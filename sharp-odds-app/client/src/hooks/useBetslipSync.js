import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { localStorageAPI, supabaseAPI } from '../utils/betslipStorage';
import { migrateLocalBetslipsToCloud } from '../utils/migration';

export function useBetslipSync(betslip, setBetslip) {
  const { user } = useAuth();
  const syncTimeoutRef = useRef(null);
  const migrationDoneRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Load betslip on mount
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadBetslip = async () => {
      if (user) {
        // Logged in - check for migration, then load from cloud
        if (!migrationDoneRef.current) {
          const result = await migrateLocalBetslipsToCloud(user.id);
          migrationDoneRef.current = true;

          if (result.migrated && result.count > 0) {
            console.log(`✓ Migrated ${result.count} betslips to cloud`);
          }
        }

        // Load from Supabase
        const cloudBetslips = await supabaseAPI.getBetslips(user.id);
        setBetslip(cloudBetslips);
      } else {
        // Anonymous - load from localStorage
        const localBetslips = localStorageAPI.getBetslip();
        setBetslip(localBetslips);
      }
    };

    loadBetslip();
  }, [user, setBetslip]);

  // Save betslip with debouncing (dual-write strategy)
  const saveBetslip = useCallback(async (betslipData) => {
    // Always save to localStorage immediately (for offline access)
    localStorageAPI.saveBetslip(betslipData);

    if (user) {
      // Logged in - also save to Supabase (debounced)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await supabaseAPI.saveBetslip(user.id, betslipData);
          console.log('✓ Betslip synced to cloud');
        } catch (err) {
          console.error('✗ Failed to sync betslip to cloud:', err);
          // LocalStorage already saved, so data is not lost
        }
      }, 2000); // 2-second debounce
    }
  }, [user]);

  // Sync betslip whenever it changes
  useEffect(() => {
    if (initialLoadRef.current) {
      saveBetslip(betslip);
    }
  }, [betslip, saveBetslip]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return { user };
}
