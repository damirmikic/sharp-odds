require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const KeyManager = require('./keyManager');

const app = express();

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', // Alternative dev port
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Initialize Key Manager
// Assumes keys are comma-separated in .env, e.g., ODDS_API_KEYS=key1,key2,key3
const rawKeys = process.env.ODDS_API_KEYS ? process.env.ODDS_API_KEYS.split(',') : [];
const cleanKeys = rawKeys.map(k => k.trim()).filter(k => k.length > 0);

let keyManager;
try {
  keyManager = new KeyManager(cleanKeys);
  console.log(`Loaded ${cleanKeys.length} API keys.`);
} catch (error) {
  console.error("Failed to initialize KeyManager:", error.message);
  // We don't exit process so that the server can start, but calls will fail until keys are fixed.
}

// Configuration: Sharp Bookmakers
// These keys must match The Odds API's internal keys.
const SHARP_BOOKMAKERS = [
  'pinnacle',
  'betfair_ex_eu',
  'bookmaker',
  'betonlineag',
  'matchbook',
  'smarkets',
  'betanysports',
  'lowvig',
  'betway',
  'novig',
  'polymarket',
  'kalshi'
];

// Simple in-memory cache for Odds: { eventId: { data: ..., timestamp: ... } }
const oddsCache = {};
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes — save API quota

// Cache for sports list and events (these are cheap/free but still count)
const sportsCache = { data: null, timestamp: 0 };
const eventsCache = {}; // { sportKey: { data, timestamp } }
const SPORTS_CACHE_MS = 30 * 60 * 1000; // 30 minutes
const EVENTS_CACHE_MS = 10 * 60 * 1000; // 10 minutes

// --- Routes ---

// 1. Get Soccer Leagues (cached 30 min)
app.get('/api/sports', async (req, res) => {
  if (sportsCache.data && (Date.now() - sportsCache.timestamp < SPORTS_CACHE_MS)) {
    return res.json(sportsCache.data);
  }
  try {
    const key = keyManager.getKey();
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports`, {
      params: { apiKey: key }
    });

    keyManager.reportStatus(key, response.status, response.headers);

    const soccerLeagues = response.data.filter(sport => sport.group === 'Soccer');
    sportsCache.data = soccerLeagues;
    sportsCache.timestamp = Date.now();
    res.json(soccerLeagues);

  } catch (error) {
    handleError(error, res);
  }
});

// 2. Get Matches for a Specific League (cached 10 min)
app.get('/api/events/:sportKey', async (req, res) => {
  const { sportKey } = req.params;

  if (eventsCache[sportKey] && (Date.now() - eventsCache[sportKey].timestamp < EVENTS_CACHE_MS)) {
    return res.json(eventsCache[sportKey].data);
  }
  try {
    const key = keyManager.getKey();
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/events`, {
      params: { apiKey: key }
    });

    keyManager.reportStatus(key, response.status, response.headers);
    eventsCache[sportKey] = { data: response.data, timestamp: Date.now() };
    res.json(response.data);

  } catch (error) {
    handleError(error, res);
  }
});

// 3. Get Sharp Odds for a Specific Match (Costly)
app.get('/api/odds/:sportKey/:eventId', async (req, res) => {
  const { sportKey, eventId } = req.params;

  // Check Cache
  if (oddsCache[eventId] && (Date.now() - oddsCache[eventId].timestamp < CACHE_DURATION_MS)) {
    console.log(`Serving odds for ${eventId} from cache.`);
    return res.json(oddsCache[eventId].data);
  }

  try {
    const key = keyManager.getKey();
    // We request specific regions to cover our sharp bookies (us, uk, eu, au)
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/events/${eventId}/odds`, {
      params: {
        apiKey: key,
        regions: 'us,us_ex,uk,eu,au', // Include us_ex for Kalshi, Novig, Polymarket
        markets: 'h2h,totals', // Head to Head (1X2) + Totals (Over/Under Goals)
        oddsFormat: 'decimal'
      }
    });

    keyManager.reportStatus(key, response.status, response.headers);

    const rawData = response.data;
    
    // Filter Bookmakers — deduplicate Betfair (keep first match only)
    const seen = new Set();
    const sharpBookies = rawData.bookmakers.filter(b => {
      if (!SHARP_BOOKMAKERS.includes(b.key)) return false;
      // Deduplicate betfair variants
      const normalizedKey = b.key.startsWith('betfair') ? 'betfair' : b.key;
      if (seen.has(normalizedKey)) return false;
      seen.add(normalizedKey);
      return true;
    });

    // Calculate average odds across sharp bookmakers only
    const sharpH2h = sharpBookies
      .map(b => b.markets.find(m => m.key === 'h2h'))
      .filter(Boolean);

    let averageOdds = null;
    if (sharpH2h.length > 0) {
      const homeTeam = rawData.home_team;
      const awayTeam = rawData.away_team;
      const sums = { home: 0, draw: 0, away: 0 };
      const counts = { home: 0, draw: 0, away: 0 };

      sharpH2h.forEach(market => {
        market.outcomes.forEach(o => {
          if (o.name === homeTeam) { sums.home += o.price; counts.home++; }
          else if (o.name === 'Draw') { sums.draw += o.price; counts.draw++; }
          else if (o.name === awayTeam) { sums.away += o.price; counts.away++; }
        });
      });

      averageOdds = {
        home: counts.home > 0 ? +(sums.home / counts.home).toFixed(3) : null,
        draw: counts.draw > 0 ? +(sums.draw / counts.draw).toFixed(3) : null,
        away: counts.away > 0 ? +(sums.away / counts.away).toFixed(3) : null,
        bookmakerCount: sharpBookies.length,
      };
    }

    // Calculate average odds for totals market
    const sharpTotals = sharpBookies
      .map(b => b.markets.find(m => m.key === 'totals'))
      .filter(Boolean);

    let averageTotals = null;
    if (sharpTotals.length > 0) {
      const sums = { over: 0, under: 0 };
      const counts = { over: 0, under: 0 };

      sharpTotals.forEach(market => {
        market.outcomes.forEach(o => {
          if (o.name === 'Over') { sums.over += o.price; counts.over++; }
          else if (o.name === 'Under') { sums.under += o.price; counts.under++; }
        });
      });

      averageTotals = {
        over: counts.over > 0 ? +(sums.over / counts.over).toFixed(3) : null,
        under: counts.under > 0 ? +(sums.under / counts.under).toFixed(3) : null,
        bookmakerCount: sharpTotals.length,
      };
    }

    // Create new response object with last update timestamp
    const lastUpdate = Date.now();
    const filteredData = {
      ...rawData,
      bookmakers: sharpBookies,
      averageOdds,
      averageTotals,
      lastUpdate,
    };

    // Update Cache
    oddsCache[eventId] = {
      data: filteredData,
      timestamp: lastUpdate
    };

    res.json(filteredData);

  } catch (error) {
    handleError(error, res);
  }
});

// 4. API Key Status (no quota cost)
app.get('/api/status', (req, res) => {
  if (!keyManager) return res.status(500).json({ message: 'KeyManager not initialized' });
  res.json(keyManager.getStatus());
});

function handleError(error, res) {
  if (error.response) {
    // The request was made and the server responded with a status code
    const keyUsed = error.config?.params?.apiKey;
    if (keyUsed && keyManager) {
        keyManager.reportStatus(keyUsed, error.response.status, error.response.headers);
    }
    console.error("API Error:", error.response.status, error.response.data);
    res.status(error.response.status).json(error.response.data);
  } else if (error.request) {
    console.error("No response received:", error.message);
    res.status(500).json({ message: "Upstream API timed out or is unreachable." });
  } else {
    console.error("Error setting up request:", error.message);
    res.status(500).json({ message: error.message });
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
