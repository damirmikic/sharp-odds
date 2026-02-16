import { localStorageAPI, supabaseAPI } from './betslipStorage';

export async function migrateLocalBetslipsToCloud(userId) {
  try {
    // Get betslips from localStorage
    const localBetslips = localStorageAPI.getBetslip();

    if (localBetslips.length === 0) {
      return { migrated: false, count: 0 };
    }

    // Check if user already has cloud betslips
    const cloudBetslips = await supabaseAPI.getBetslips(userId);

    if (cloudBetslips.length === 0) {
      // User has no cloud betslips, migrate local ones
      await supabaseAPI.saveBetslip(userId, localBetslips);
      // Keep localStorage for dual-write strategy
      return { migrated: true, count: localBetslips.length };
    } else {
      // User has both, need to merge
      const merged = mergeBetslips(localBetslips, cloudBetslips);
      await supabaseAPI.saveBetslip(userId, merged);
      // Update localStorage with merged data
      localStorageAPI.saveBetslip(merged);
      return {
        migrated: true,
        count: localBetslips.length,
        merged: true,
        totalCount: merged.length,
      };
    }
  } catch (err) {
    console.error('Migration failed:', err);
    return { migrated: false, error: err.message };
  }
}

function mergeBetslips(local, cloud) {
  const merged = [...cloud];
  const existingKeys = new Set(
    cloud.map(item =>
      `${item.matchId}-${item.outcome}-${item.bookmaker}-${item.marketType}`
    )
  );

  local.forEach(item => {
    const key = `${item.matchId}-${item.outcome}-${item.bookmaker}-${item.marketType}`;
    if (!existingKeys.has(key)) {
      merged.push(item);
    }
  });

  return merged;
}
