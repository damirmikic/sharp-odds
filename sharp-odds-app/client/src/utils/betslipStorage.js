import { supabase } from '../lib/supabaseClient';

const LOCALSTORAGE_KEY = 'sharpOdds_betslip';

// LocalStorage operations (fallback for anonymous users)
export const localStorageAPI = {
  getBetslip: () => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      // Filter out old matches (> 7 days)
      const now = new Date();
      const filtered = parsed.filter(item => {
        if (!item.matchInfo?.commenceTime) return true;
        const matchDate = new Date(item.matchInfo.commenceTime);
        const daysDiff = (now - matchDate) / (1000 * 60 * 60 * 24);
        return daysDiff < 7;
      });

      return filtered;
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return [];
    }
  },

  saveBetslip: (betslip) => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(betslip));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  },

  clearBetslip: () => {
    localStorage.removeItem(LOCALSTORAGE_KEY);
  },
};

// Supabase operations (for authenticated users)
export const supabaseAPI = {
  getBetslips: async (userId) => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('betslips')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch betslips from Supabase:', error);
      return [];
    }

    // Convert database format to app format
    return data.map(item => ({
      id: item.id,
      matchId: item.match_id,
      matchInfo: {
        homeTeam: item.home_team,
        awayTeam: item.away_team,
        commenceTime: item.commence_time,
        sportKey: item.sport_key,
      },
      outcome: item.outcome,
      outcomeLabel: item.outcome_label,
      bookmaker: item.bookmaker,
      bookmakerTitle: item.bookmaker_title,
      odds: parseFloat(item.odds),
      noVigOdds: item.no_vig_odds ? parseFloat(item.no_vig_odds) : null,
      customOdds: item.custom_odds ? String(item.custom_odds) : null,
      marketType: item.market_type,
    }));
  },

  saveBetslip: async (userId, betslipItems) => {
    if (!supabase) return;

    // Delete existing betslips for this user
    await supabase
      .from('betslips')
      .delete()
      .eq('user_id', userId)
      .eq('is_archived', false);

    // Insert new betslips
    if (betslipItems.length === 0) return;

    const insertData = betslipItems.map(item => ({
      user_id: userId,
      match_id: item.matchId,
      home_team: item.matchInfo.homeTeam,
      away_team: item.matchInfo.awayTeam,
      commence_time: item.matchInfo.commenceTime,
      sport_key: item.matchInfo.sportKey || 'soccer',
      outcome: item.outcome,
      outcome_label: item.outcomeLabel,
      market_type: item.marketType,
      bookmaker: item.bookmaker,
      bookmaker_title: item.bookmakerTitle,
      odds: item.odds,
      no_vig_odds: item.noVigOdds,
      custom_odds: item.customOdds ? parseFloat(item.customOdds) : null,
    }));

    const { error } = await supabase
      .from('betslips')
      .insert(insertData);

    if (error) {
      console.error('Failed to save betslips to Supabase:', error);
      throw error;
    }
  },

  clearBetslips: async (userId) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('betslips')
      .delete()
      .eq('user_id', userId)
      .eq('is_archived', false);

    if (error) {
      console.error('Failed to clear betslips from Supabase:', error);
    }
  },

  saveBetslipHistory: async (userId, betslipData) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('betslip_history')
      .insert({
        user_id: userId,
        name: betslipData.name,
        items: betslipData.items,
        total_odds: betslipData.totalOdds,
        stake: betslipData.stake,
        potential_return: betslipData.potentialReturn,
        notes: betslipData.notes || null,
      });

    if (error) {
      console.error('Failed to save betslip history:', error);
      throw error;
    }
  },
};
