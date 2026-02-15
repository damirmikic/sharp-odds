class KeyManager {
  constructor(keys) {
    if (!keys || keys.length === 0) {
      throw new Error('No API keys provided.');
    }
    this.keys = keys.map(key => ({
      key,
      usage: 0,
      remaining: null,   // from API headers
      exhausted: false,
      blockedUntil: null
    }));
    this.currentIndex = 0;
  }

  getKey() {
    const now = Date.now();
    let attempts = 0;
    while (attempts < this.keys.length) {
      const currentKeyObj = this.keys[this.currentIndex];

      if (currentKeyObj.blockedUntil && currentKeyObj.blockedUntil > now) {
        this.rotate();
        attempts++;
        continue;
      } else if (currentKeyObj.blockedUntil && currentKeyObj.blockedUntil <= now) {
        currentKeyObj.blockedUntil = null;
        currentKeyObj.exhausted = false;
      }

      if (currentKeyObj.exhausted) {
        this.rotate();
        attempts++;
        continue;
      }

      return currentKeyObj.key;
    }
    throw new Error('All API keys are exhausted or rate-limited.');
  }

  rotate() {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
  }

  reportStatus(keyString, statusCode, headers) {
    const keyObj = this.keys.find(k => k.key === keyString);
    if (!keyObj) return;

    // Track remaining requests from The Odds API headers
    const remaining = headers?.['x-requests-remaining'];
    const used = headers?.['x-requests-used'];
    if (remaining !== undefined) {
      keyObj.remaining = parseInt(remaining, 10);
      console.log(`Key ${keyString.substring(0, 8)}... remaining: ${remaining}, used: ${used || '?'}`);

      // Mark exhausted if no requests left
      if (keyObj.remaining <= 0) {
        console.warn(`Key ${keyString.substring(0, 8)}... has 0 remaining requests, marking exhausted.`);
        keyObj.exhausted = true;
        this.rotate();
        return;
      }
    }

    if (statusCode === 200) {
      keyObj.usage++;
    } else if (statusCode === 429) {
      console.warn(`Key ${keyString.substring(0, 8)}... hit rate limit.`);
      keyObj.blockedUntil = Date.now() + 60000;
      this.rotate();
    } else if (statusCode === 401) {
      console.warn(`Key ${keyString.substring(0, 8)}... quota exceeded or invalid.`);
      keyObj.exhausted = true;
      this.rotate();
    }
  }

  // Return status summary for all keys
  getStatus() {
    return {
      totalKeys: this.keys.length,
      activeKeys: this.keys.filter(k => !k.exhausted && (!k.blockedUntil || k.blockedUntil <= Date.now())).length,
      exhaustedKeys: this.keys.filter(k => k.exhausted).length,
      blockedKeys: this.keys.filter(k => k.blockedUntil && k.blockedUntil > Date.now()).length,
      totalRemaining: this.keys.reduce((sum, k) => sum + (k.remaining ?? 0), 0),
      keys: this.keys.map(k => ({
        prefix: k.key.substring(0, 8) + '...',
        usage: k.usage,
        remaining: k.remaining,
        exhausted: k.exhausted,
        blocked: k.blockedUntil ? k.blockedUntil > Date.now() : false,
      }))
    };
  }
}

module.exports = KeyManager;
