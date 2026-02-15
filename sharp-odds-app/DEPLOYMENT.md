# Sharp Odds - Deployment Guide

This guide covers deploying Sharp Odds to production.

## Prerequisites

- Node.js 18+ installed
- PM2 or similar process manager (for server)
- Nginx or similar reverse proxy (recommended)
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Environment Variables

### Server (.env)

Create a `.env` file in the `server/` directory:

```bash
PORT=5000
FRONTEND_URL=https://sharp-odds.com
ODDS_API_KEYS=key1,key2,key3
NODE_ENV=production
```

### Client (.env)

Create a `.env` file in the `client/` directory:

```bash
VITE_API_URL=https://api.sharp-odds.com
```

Or for same-domain deployment:

```bash
VITE_API_URL=https://sharp-odds.com
```

## Deployment Steps

### 1. Server Deployment

```bash
cd server
npm install --production
npm install -g pm2

# Start server with PM2
pm2 start index.js --name sharp-odds-api
pm2 save
pm2 startup
```

### 2. Client Build

```bash
cd client
npm install
npm run build
```

This creates a `dist/` folder with optimized static files.

### 3. Nginx Configuration

Example Nginx configuration:

```nginx
# API Server (Backend)
server {
    listen 80;
    server_name api.sharp-odds.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend (Static Files)
server {
    listen 80;
    server_name sharp-odds.com www.sharp-odds.com;

    root /var/www/sharp-odds/client/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 4. SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d sharp-odds.com -d www.sharp-odds.com -d api.sharp-odds.com
```

## Alternative: Same-Domain Deployment

If deploying both frontend and backend on the same domain:

```nginx
server {
    listen 80;
    server_name sharp-odds.com www.sharp-odds.com;

    root /var/www/sharp-odds/client/dist;
    index index.html;

    # API requests proxied to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

In this case, set `VITE_API_URL=https://sharp-odds.com` (no separate API subdomain needed).

## Vercel/Netlify Deployment (Frontend Only)

### Vercel

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-api-url.com`

### Netlify

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-api-url.com`
5. Add `_redirects` file in `public/`:

```
/*    /index.html   200
```

## Railway/Render Deployment (Full Stack)

### Railway

**Backend:**
1. Create new project from GitHub
2. Select `server/` as root directory
3. Add environment variables from `.env.example`
4. Deploy

**Frontend:**
1. Create new project from GitHub
2. Select `client/` as root directory
3. Set `VITE_API_URL` to your Railway backend URL
4. Deploy

### Render

Similar process to Railway.

## Environment-Specific Configuration

### Development

```bash
# Server
PORT=5000
# FRONTEND_URL not needed (CORS allows all in dev)

# Client
VITE_API_URL=http://localhost:5000
```

### Staging

```bash
# Server
PORT=5000
FRONTEND_URL=https://staging.sharp-odds.com
NODE_ENV=production

# Client
VITE_API_URL=https://api-staging.sharp-odds.com
```

### Production

```bash
# Server
PORT=5000
FRONTEND_URL=https://sharp-odds.com
NODE_ENV=production

# Client
VITE_API_URL=https://api.sharp-odds.com
```

## Health Checks

Test your deployment:

**Backend:**
```bash
curl https://api.sharp-odds.com/api/sports
```

**Frontend:**
```bash
curl https://sharp-odds.com
# Should return HTML with proper meta tags
```

## Monitoring

Set up monitoring with PM2:

```bash
pm2 monit
pm2 logs sharp-odds-api
```

## Troubleshooting

### CORS Errors

Ensure `FRONTEND_URL` in server `.env` matches your actual frontend domain.

### API Not Loading

Check that `VITE_API_URL` in client build matches your backend URL.

### Build Fails

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Performance Optimization

1. **Enable Nginx caching** for API responses (careful with real-time odds)
2. **Use CDN** for static assets
3. **Enable HTTP/2** in Nginx
4. **Compress images** (sharp-logo.png)
5. **Monitor API quota usage** with `/api/status` endpoint

## Backup Strategy

- **Database:** Not applicable (no database, stateless)
- **API Keys:** Backup `.env` securely (do not commit to git)
- **Logs:** PM2 logs are saved in `~/.pm2/logs/`

## Scaling Considerations

- **Multiple server instances:** Use PM2 cluster mode
- **Load balancing:** Nginx upstream with multiple backend instances
- **API quota management:** Add more API keys to `ODDS_API_KEYS`
- **Caching:** Consider Redis for odds caching across instances

---

*Last updated: February 2026*
