import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './hooks/useAuth';
import { useBetslipSync } from './hooks/useBetslipSync';
import { supabaseAPI } from './utils/betslipStorage';
import UserMenu from './components/layout/UserMenu';
import AuthModal from './components/auth/AuthModal';
import BetslipHistory from './components/betslip/BetslipHistory';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Betslip Components ──────────────────────────────────────────────────────

const BetslipItem = ({ item, onRemove, onUpdateCustomOdds }) => {
  return (
    <div style={{
      padding: '12px',
      background: 'linear-gradient(135deg, #2e4158 0%, #253649 100%)',
      borderBottom: '1px solid #3a5575',
      borderLeft: '3px solid #4ade80',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
            {item.matchInfo.homeTeam} vs {item.matchInfo.awayTeam}
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#4ade80',
            marginBottom: 2,
            textShadow: '0 2px 6px rgba(74, 222, 128, 0.3)',
          }}>
            ⭐ {item.outcomeLabel}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>
            {item.bookmakerTitle}
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          style={{
            background: 'rgba(248, 113, 113, 0.15)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: 4,
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 600,
            padding: 0,
            lineHeight: 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >×</button>
      </div>
      <div style={{
        marginTop: 8,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr auto 1fr',
        gap: 8,
        alignItems: 'center',
      }}>
        {/* Best odds */}
        <div>
          <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2, fontWeight: 600 }}>
            BEST ODDS
          </div>
          <div style={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            fontWeight: 700,
            color: '#94a3b8',
            textAlign: 'center',
          }}>
            {item.odds.toFixed(3)}
          </div>
        </div>

        {/* Arrow 1 */}
        <div style={{ color: '#facc15', fontSize: 14, marginTop: 12 }}>→</div>

        {/* No-vig odds */}
        <div>
          <div style={{ fontSize: 9, color: '#fbbf24', marginBottom: 2, fontWeight: 600 }}>
            NO VIG
          </div>
          <div style={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            fontWeight: 700,
            color: '#fbbf24',
            textAlign: 'center',
            textShadow: '0 2px 6px rgba(251, 191, 36, 0.3)',
          }}>
            {item.noVigOdds ? item.noVigOdds.toFixed(3) : item.odds.toFixed(3)}
          </div>
        </div>

        {/* Arrow 2 */}
        <div style={{ color: '#facc15', fontSize: 14, marginTop: 12 }}>→</div>

        {/* Custom odds input */}
        <div>
          <div style={{ fontSize: 9, color: '#4ade80', marginBottom: 2, fontWeight: 600 }}>
            MY ODDS
          </div>
          <input
            type="number"
            step="0.01"
            placeholder={item.noVigOdds?.toFixed(2) || item.odds.toFixed(2)}
            value={item.customOdds || ''}
            onChange={(e) => onUpdateCustomOdds(item.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '4px 6px',
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              fontWeight: 700,
              color: '#4ade80',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '2px solid rgba(74, 222, 128, 0.3)',
              borderRadius: 6,
              outline: 'none',
              textAlign: 'center',
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.6)';
              e.currentTarget.style.background = 'rgba(74, 222, 128, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.3)';
              e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
            }}
          />
        </div>
      </div>
    </div>
  );
};

const BetslipPanel = ({ betslip, isOpen, onRemove, onClear, onClose, position = { x: 20, y: 70 }, onDragStart, onUpdateCustomOdds, stake = 10, onStakeChange, onSaveBetslipToHistory }) => {
  const [activeTab, setActiveTab] = useState('selections');

  if (!isOpen) return null;

  // Calculate best odds total (using original odds)
  const bestTotalOdds = betslip.length > 0
    ? betslip.reduce((acc, item) => acc * item.odds, 1)
    : 0;

  // Calculate no-vig odds total (using devigged odds)
  const noVigTotalOdds = betslip.length > 0
    ? betslip.reduce((acc, item) => acc * (item.noVigOdds || item.odds), 1)
    : 0;

  // Calculate custom odds total (using user's custom odds)
  const customTotalOdds = betslip.length > 0
    ? betslip.reduce((acc, item) => {
        const customOdds = item.customOdds && parseFloat(item.customOdds) > 0
          ? parseFloat(item.customOdds)
          : (item.noVigOdds || item.odds);
        return acc * customOdds;
      }, 1)
    : 0;

  // Check if any custom odds are being used
  const hasCustomOdds = betslip.some(item => item.customOdds && parseFloat(item.customOdds) > 0);

  // Calculate percentage differences
  const diffVsBest = bestTotalOdds > 0 ? ((customTotalOdds - bestTotalOdds) / bestTotalOdds * 100) : 0;
  const diffVsNoVig = noVigTotalOdds > 0 ? ((customTotalOdds - noVigTotalOdds) / noVigTotalOdds * 100) : 0;

  // Save betslip as CSV
  const handleSaveBetslipCSV = () => {
    // CSV Header
    let csv = 'Match,Selection,Bookmaker,Best Odds,No-Vig Odds,My Odds\n';

    // Add each selection
    betslip.forEach(item => {
      const match = `"${item.matchInfo.homeTeam} vs ${item.matchInfo.awayTeam}"`;
      const outcome = `"${item.outcomeLabel}"`;
      const bookmaker = `"${item.bookmakerTitle}"`;
      const bestOdds = item.odds.toFixed(3);
      const noVigOdds = (item.noVigOdds || item.odds).toFixed(3);
      const myOddsValue = item.customOdds ? parseFloat(item.customOdds) : (item.noVigOdds || item.odds);
      const myOdds = myOddsValue.toFixed(3);

      csv += `${match},${outcome},${bookmaker},${bestOdds},${noVigOdds},${myOdds}\n`;
    });

    // Add summary rows
    csv += '\n';
    csv += `Summary\n`;
    csv += `Total Selections,${betslip.length}\n`;
    csv += `Best Odds Total,${bestTotalOdds.toFixed(2)}\n`;
    csv += `No-Vig Odds Total,${noVigTotalOdds.toFixed(2)}\n`;
    csv += `My Odds Total,${customTotalOdds.toFixed(2)}\n`;
    csv += `Stake,€${stake}\n`;
    csv += `Potential Return,€${(customTotalOdds * stake).toFixed(2)}\n`;
    csv += `Profit,€${((customTotalOdds * stake) - stake).toFixed(2)}\n`;
    csv += `vs Best,${diffVsBest >= 0 ? '+' : ''}${diffVsBest.toFixed(1)}%,€${Math.abs((customTotalOdds - bestTotalOdds) * stake).toFixed(2)}\n`;
    csv += `vs No-Vig,${diffVsNoVig >= 0 ? '+' : ''}${diffVsNoVig.toFixed(1)}%,€${Math.abs((customTotalOdds - noVigTotalOdds) * stake).toFixed(2)}\n`;
    csv += `Date,${new Date().toLocaleString()}\n`;

    // Copy to clipboard
    navigator.clipboard.writeText(csv)
      .then(() => alert('Betslip CSV copied to clipboard!'))
      .catch(() => alert('Failed to copy betslip'));
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: position.y,
      right: position.x,
      width: 360,
      maxHeight: 500,
      background: 'linear-gradient(135deg, #2a3f5f 0%, #1e2f45 100%)',
      border: '2px solid #4a7ba7',
      borderRadius: 12,
      boxShadow: '0 12px 40px rgba(74, 222, 128, 0.15), 0 0 0 1px rgba(250, 204, 21, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      animation: 'slideUp 0.2s ease-out',
    }}>
      {/* Header */}
      <div
        onMouseDown={onDragStart}
        style={{
          padding: '12px 16px',
          borderBottom: '2px solid #facc15',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #3b5170 0%, #2a3f5f 100%)',
          borderRadius: '10px 10px 0 0',
          cursor: 'move',
          userSelect: 'none',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#facc15', letterSpacing: '0.5px' }}>
            My Betslip
          </span>
          {betslip.length > 0 && (
            <span style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: '#0a0f14',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(74, 222, 128, 0.4)',
            }}>
              {betslip.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {betslip.length > 0 && (
            <>
              <button
                onClick={handleSaveBetslipCSV}
                style={{
                  background: 'rgba(74, 222, 128, 0.15)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: '#4ade80',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.3)';
                }}
              >📊 CSV</button>
              <button
                onClick={onClear}
                style={{
                  background: 'rgba(248, 113, 113, 0.15)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.3)';
                }}
              >Clear All</button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.15)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: 4,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
            }}
          >×</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #3a4560',
        background: 'linear-gradient(135deg, #2a3548 0%, #1e2736 100%)',
      }}>
        <button
          onClick={() => setActiveTab('selections')}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            border: 'none',
            background: activeTab === 'selections' ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
            borderBottom: activeTab === 'selections' ? '3px solid #4ade80' : '3px solid transparent',
            color: activeTab === 'selections' ? '#4ade80' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          📋 Selections
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            border: 'none',
            background: activeTab === 'analysis' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
            borderBottom: activeTab === 'analysis' ? '3px solid #fbbf24' : '3px solid transparent',
            color: activeTab === 'analysis' ? '#fbbf24' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          📊 Analysis
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: betslip.length > 0 ? (activeTab === 'selections' ? 420 : 340) : 440,
      }}>
        {betslip.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontStyle: 'italic',
          }}>
            Click on odds to add to your betslip
          </div>
        ) : activeTab === 'selections' ? (
          // Selections Tab - Compact View
          betslip.map((item, idx) => (
            <div key={item.id} style={{
              padding: '10px 12px',
              background: idx % 2 === 0 ? '#1e2433' : '#1a1f2e',
              borderBottom: '1px solid #2a3548',
              borderLeft: '3px solid #4ade80',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>
                    {item.matchInfo.homeTeam} vs {item.matchInfo.awayTeam}
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#4ade80',
                    textShadow: '0 2px 6px rgba(74, 222, 128, 0.3)',
                  }}>
                    ⭐ {item.outcomeLabel}
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                    {item.bookmakerTitle}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  style={{
                    background: 'rgba(248, 113, 113, 0.15)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    borderRadius: 4,
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: 0,
                    lineHeight: 1,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(248, 113, 113, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >×</button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.2fr',
                gap: 6,
                fontSize: 10,
                alignItems: 'center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                  color: '#94a3b8',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 8, marginBottom: 2, fontWeight: 600 }}>BEST</div>
                  <div style={{ fontWeight: 600 }}>{item.odds.toFixed(2)}</div>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                  color: '#fbbf24',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 8, marginBottom: 2, fontWeight: 600 }}>FAIR</div>
                  <div style={{ fontWeight: 600 }}>{(item.noVigOdds || item.odds).toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, marginBottom: 2, color: '#4ade80', fontWeight: 600 }}>MY ODDS</div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={(item.noVigOdds || item.odds).toFixed(2)}
                    value={item.customOdds || ''}
                    onChange={(e) => onUpdateCustomOdds(item.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '3px 4px',
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                      fontWeight: 700,
                      color: '#4ade80',
                      background: 'rgba(74, 222, 128, 0.1)',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      borderRadius: 4,
                      outline: 'none',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.6)';
                      e.currentTarget.style.background = 'rgba(74, 222, 128, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.3)';
                      e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          // Analysis Tab - Detailed View
          betslip.map(item => (
            <BetslipItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              onUpdateCustomOdds={onUpdateCustomOdds}
            />
          ))
        )}
      </div>

      {/* Quick Summary for Selections Tab */}
      {betslip.length > 0 && activeTab === 'selections' && (
        <div style={{
          borderTop: '2px solid #4ade80',
          background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)',
          padding: '12px 16px',
          borderRadius: '0 0 10px 10px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
                {betslip.length === 1 ? 'SINGLE' : `${betslip.length}-FOLD ACCUMULATOR`}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Total Odds
              </div>
            </div>
            <div style={{
              fontSize: 24,
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              fontWeight: 800,
              color: '#4ade80',
              textShadow: '0 2px 12px rgba(74, 222, 128, 0.5)',
            }}>
              {customTotalOdds.toFixed(2)}
            </div>
          </div>
          <div style={{
            marginTop: 8,
            fontSize: 10,
            color: '#94a3b8',
            textAlign: 'center',
          }}>
            Switch to Analysis tab for detailed odds comparison
          </div>
        </div>
      )}

      {/* Total Odds Section - Only show in Analysis tab */}
      {betslip.length > 0 && activeTab === 'analysis' && (
        <div style={{
          borderTop: '2px solid #facc15',
          background: 'linear-gradient(135deg, #3b5170 0%, #2a3f5f 100%)',
          padding: '14px 16px',
          borderRadius: '0 0 10px 10px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}>
              Total Selections
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#facc15',
              textShadow: '0 2px 6px rgba(251, 191, 36, 0.3)',
            }}>
              {betslip.length}
            </span>
          </div>

          {/* Stake input */}
          <div style={{
            marginBottom: 10,
            padding: '10px 12px',
            background: 'rgba(96, 165, 250, 0.1)',
            borderRadius: 6,
            border: '2px solid rgba(96, 165, 250, 0.3)',
          }}>
            <div style={{
              fontSize: 9,
              color: '#60a5fa',
              fontWeight: 600,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Stake Amount (€)
            </div>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="10"
              value={stake}
              onChange={(e) => onStakeChange(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 16,
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                fontWeight: 700,
                color: '#60a5fa',
                background: 'rgba(96, 165, 250, 0.05)',
                border: '2px solid rgba(96, 165, 250, 0.4)',
                borderRadius: 6,
                outline: 'none',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.6)';
                e.currentTarget.style.background = 'rgba(96, 165, 250, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                e.currentTarget.style.background = 'rgba(96, 165, 250, 0.05)';
              }}
            />
          </div>

          {/* Bet type header */}
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#facc15',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: 10,
            textAlign: 'center',
            textShadow: '0 2px 6px rgba(251, 191, 36, 0.3)',
          }}>
            {betslip.length === 1 ? '⭐ Single' : `⭐ ${betslip.length}-Fold Accumulator`}
          </div>

          {/* Best Odds Total */}
          <div style={{
            padding: '10px 12px',
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(148, 163, 184, 0.1) 100%)',
            borderRadius: 6,
            border: '2px solid rgba(148, 163, 184, 0.3)',
            marginBottom: 8,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontSize: 9,
                  color: '#94a3b8',
                  fontWeight: 600,
                  marginBottom: 2,
                }}>
                  BEST ODDS TOTAL
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  fontWeight: 500,
                }}>
                  Stake €{stake} → €{(bestTotalOdds * stake).toFixed(2)}
                </div>
              </div>
              <div style={{
                fontSize: 20,
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '-0.5px',
              }}>
                {bestTotalOdds.toFixed(2)}
              </div>
            </div>
          </div>

          {/* No-Vig Odds Total */}
          <div style={{
            padding: '10px 12px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.1) 100%)',
            borderRadius: 6,
            border: '2px solid rgba(251, 191, 36, 0.4)',
            marginBottom: 8,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontSize: 9,
                  color: '#fbbf24',
                  fontWeight: 600,
                  marginBottom: 2,
                }}>
                  NO-VIG ODDS TOTAL
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  fontWeight: 500,
                }}>
                  Stake €{stake} → <span style={{ color: '#fbbf24', fontWeight: 600 }}>€{(noVigTotalOdds * stake).toFixed(2)}</span>
                </div>
              </div>
              <div style={{
                fontSize: 20,
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                fontWeight: 700,
                color: '#fbbf24',
                letterSpacing: '-0.5px',
                textShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
              }}>
                {noVigTotalOdds.toFixed(2)}
              </div>
            </div>
          </div>

          {/* My Odds Total */}
          <div style={{
            padding: '10px 12px',
            background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)',
            borderRadius: 6,
            border: '2px solid rgba(74, 222, 128, 0.4)',
            boxShadow: '0 4px 12px rgba(74, 222, 128, 0.2)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontSize: 9,
                  color: '#4ade80',
                  fontWeight: 600,
                  marginBottom: 2,
                }}>
                  MY ODDS TOTAL
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  fontWeight: 500,
                }}>
                  Stake €{stake} → <span style={{ color: '#4ade80', fontWeight: 700 }}>€{(customTotalOdds * stake).toFixed(2)}</span>
                </div>
              </div>
              <div style={{
                fontSize: 20,
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                fontWeight: 700,
                color: '#4ade80',
                letterSpacing: '-0.5px',
                textShadow: '0 2px 12px rgba(74, 222, 128, 0.4)',
              }}>
                {customTotalOdds.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Percentage Difference Indicators */}
          <div style={{
            marginTop: 8,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {/* vs Best Odds */}
            <div style={{
              padding: '8px 10px',
              background: diffVsBest >= 0
                ? 'rgba(74, 222, 128, 0.1)'
                : 'rgba(248, 113, 113, 0.1)',
              borderRadius: 6,
              border: `2px solid ${diffVsBest >= 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 8,
                color: '#94a3b8',
                fontWeight: 600,
                marginBottom: 2,
                textTransform: 'uppercase',
              }}>
                vs Best
              </div>
              <div style={{
                fontSize: 16,
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                color: diffVsBest >= 0 ? '#4ade80' : '#f87171',
                fontWeight: 800,
              }}>
                {diffVsBest >= 0 ? '+' : ''}{diffVsBest.toFixed(1)}%
              </div>
              <div style={{
                fontSize: 8,
                color: '#94a3b8',
                marginTop: 2,
              }}>
                {diffVsBest >= 0 ? '↑' : '↓'} €{Math.abs((customTotalOdds - bestTotalOdds) * stake).toFixed(2)}
              </div>
            </div>

            {/* vs No-Vig */}
            <div style={{
              padding: '8px 10px',
              background: diffVsNoVig >= 0
                ? 'rgba(74, 222, 128, 0.1)'
                : 'rgba(248, 113, 113, 0.1)',
              borderRadius: 6,
              border: `2px solid ${diffVsNoVig >= 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 8,
                color: '#94a3b8',
                fontWeight: 600,
                marginBottom: 2,
                textTransform: 'uppercase',
              }}>
                vs No-Vig
              </div>
              <div style={{
                fontSize: 16,
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                color: diffVsNoVig >= 0 ? '#4ade80' : '#f87171',
                fontWeight: 800,
              }}>
                {diffVsNoVig >= 0 ? '+' : ''}{diffVsNoVig.toFixed(1)}%
              </div>
              <div style={{
                fontSize: 8,
                color: '#94a3b8',
                marginTop: 2,
              }}>
                {diffVsNoVig >= 0 ? '↑' : '↓'} €{Math.abs((customTotalOdds - noVigTotalOdds) * stake).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Save to History Button */}
          <button
            onClick={onSaveBetslipToHistory}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: 16,
              background: 'var(--odds-green)',
              border: 'none',
              borderRadius: 6,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(74, 222, 128, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#22c55e';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 222, 128, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--odds-green)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 222, 128, 0.3)';
            }}
          >
            💾 Save to History
          </button>
        </div>
      )}
    </div>
  );
};

const BetslipWidget = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
        border: '3px solid #facc15',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(74, 222, 128, 0.6), 0 0 0 2px rgba(250, 204, 21, 0.3)',
        transition: 'all 0.2s ease',
        zIndex: 1000,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(74, 222, 128, 0.8), 0 0 0 3px rgba(250, 204, 21, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(74, 222, 128, 0.6), 0 0 0 2px rgba(250, 204, 21, 0.3)';
      }}
    >
      <span style={{ fontSize: 26 }}>📋</span>
      {count > 0 && (
        <div style={{
          position: 'absolute',
          top: -6,
          right: -6,
          minWidth: 24,
          height: 24,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          color: '#0a0f14',
          fontSize: 12,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 5px',
          boxShadow: '0 3px 12px rgba(251, 191, 36, 0.8)',
          border: '2px solid #4ade80',
        }}>
          {count}
        </div>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const FlagEmoji = ({ league }) => {
  const flags = {
    'soccer_epl': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'soccer_england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'soccer_spain_la_liga': '🇪🇸',
    'soccer_italy_serie_a': '🇮🇹',
    'soccer_germany_bundesliga': '🇩🇪',
    'soccer_germany_bundesliga2': '🇩🇪',
    'soccer_france_ligue_one': '🇫🇷',
    'soccer_france_ligue_two': '🇫🇷',
    'soccer_netherlands_eredivisie': '🇳🇱',
    'soccer_portugal_primeira_liga': '🇵🇹',
    'soccer_brazil': '🇧🇷',
    'soccer_argentina': '🇦🇷',
    'soccer_usa_mls': '🇺🇸',
    'soccer_mexico_ligamx': '🇲🇽',
    'soccer_turkey_super_league': '🇹🇷',
    'soccer_belgium_first_div': '🇧🇪',
    'soccer_scotland_premiership': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'soccer_australia_aleague': '🇦🇺',
    'soccer_japan_j_league': '🇯🇵',
    'soccer_korea_kleague1': '🇰🇷',
    'soccer_china_superleague': '🇨🇳',
    'soccer_sweden_allsvenskan': '🇸🇪',
    'soccer_norway_eliteserien': '🇳🇴',
    'soccer_denmark_superliga': '🇩🇰',
    'soccer_switzerland_superleague': '🇨🇭',
    'soccer_austria_bundesliga': '🇦🇹',
    'soccer_greece_super_league': '🇬🇷',
    'soccer_poland_ekstraklasa': '🇵🇱',
    'soccer_russia_premier_league': '🇷🇺',
    'soccer_uefa_champs_league': '🇪🇺',
    'soccer_uefa_europa_league': '🇪🇺',
    'soccer_conmebol_copa_libertadores': '🌎',
    'soccer_fa_cup': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'soccer_league_cup': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  };
  const key = league?.key || '';
  for (const [pattern, flag] of Object.entries(flags)) {
    if (key.includes(pattern)) return <span style={{ marginRight: 6, fontSize: 13 }}>{flag}</span>;
  }
  return <span style={{ marginRight: 6, fontSize: 13 }}>⚽</span>;
};

// ─── Sidebar Component ────────────────────────────────────────────────────────

const Sidebar = ({ leagues, selectedLeagues, onToggleLeague, onSelectAll, onClearAll, searchTerm, onSearchChange }) => {
  const popular = useMemo(() => {
    const popularKeys = [
      'soccer_epl', 'soccer_spain_la_liga', 'soccer_italy_serie_a',
      'soccer_germany_bundesliga', 'soccer_france_ligue_one',
      'soccer_uefa_champs_league', 'soccer_uefa_europa_league'
    ];
    return leagues.filter(l => popularKeys.some(pk => l.key.includes(pk)));
  }, [leagues]);

  const filtered = useMemo(() => {
    if (!searchTerm) return leagues;
    const term = searchTerm.toLowerCase();
    return leagues.filter(l => l.title.toLowerCase().includes(term));
  }, [leagues, searchTerm]);

  const otherLeagues = useMemo(() => {
    const popularKeySet = new Set(popular.map(l => l.key));
    return filtered.filter(l => !popularKeySet.has(l.key));
  }, [filtered, popular]);

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-primary)',
      height: '100vh',
      overflowY: 'auto',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{ padding: '10px 10px 6px' }}>
        <input
          type="text"
          placeholder="Search leagues..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: 12,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-primary)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Quick actions */}
      <div style={{ padding: '4px 10px 8px', display: 'flex', gap: 6 }}>
        <button onClick={onSelectAll} style={{
          fontSize: 10, padding: '3px 8px', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)', borderRadius: 3,
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>Select All</button>
        <button onClick={onClearAll} style={{
          fontSize: 10, padding: '3px 8px', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)', borderRadius: 3,
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>Clear</button>
      </div>

      {/* Counter */}
      <div style={{
        padding: '4px 12px 8px', fontSize: 10, color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-primary)', marginBottom: 4,
      }}>
        {selectedLeagues.length} of {leagues.length} leagues selected
      </div>

      {/* Popular */}
      {popular.length > 0 && !searchTerm && (
        <>
          <div style={{
            padding: '8px 12px 4px', fontSize: 10, fontWeight: 700,
            color: 'var(--accent-favourite)', textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>Popular</div>
          {popular.map(league => (
            <div
              key={league.key}
              className={`sidebar-league ${selectedLeagues.includes(league.key) ? 'active' : ''}`}
              onClick={() => onToggleLeague(league.key)}
            >
              <FlagEmoji league={league} />
              {league.title}
            </div>
          ))}
          <div style={{
            height: 1, background: 'var(--border-primary)',
            margin: '6px 12px',
          }} />
        </>
      )}

      {/* All leagues */}
      <div style={{
        padding: '6px 12px 4px', fontSize: 10, fontWeight: 700,
        color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {searchTerm ? `Results (${filtered.length})` : 'All Leagues'}
      </div>
      {(searchTerm ? filtered : otherLeagues).map(league => (
        <div
          key={league.key}
          className={`sidebar-league ${selectedLeagues.includes(league.key) ? 'active' : ''}`}
          onClick={() => onToggleLeague(league.key)}
        >
          <FlagEmoji league={league} />
          {league.title}
        </div>
      ))}
    </aside>
  );
};

// ─── Header Bar ───────────────────────────────────────────────────────────────

const TopBar = ({ matchCount, leagueCount, loading, user, onAuthClick, onOpenHistory }) => (
  <header style={{
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-primary)',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src="/sharp-logo.png" alt="Logo" style={{ height: 24, width: 24, borderRadius: 4 }} />
      <h1 style={{
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-white)',
        margin: 0,
        letterSpacing: '-0.02em',
      }}>
        <span style={{ color: 'var(--odds-green)' }}>Sharp</span>Odds
      </h1>
      <span style={{
        fontSize: 10,
        padding: '2px 8px',
        background: 'var(--bg-tertiary)',
        borderRadius: 3,
        color: 'var(--text-muted)',
        border: '1px solid var(--border-primary)',
      }}>Football</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
      {loading && (
        <span style={{ color: 'var(--odds-yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="live-indicator" style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: '50%', background: 'var(--odds-yellow)',
          }} />
          Loading...
        </span>
      )}
      <span>{matchCount} matches</span>
      <span>{leagueCount} leagues</span>

      {/* Auth Section */}
      {user ? (
        <UserMenu onOpenHistory={onOpenHistory} />
      ) : (
        <button
          onClick={onAuthClick}
          style={{
            background: 'var(--odds-green)',
            border: 'none',
            borderRadius: 4,
            padding: '6px 12px',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      )}
    </div>
  </header>
);

// ─── Tab Switcher ─────────────────────────────────────────────────────────────

const TabSwitcher = ({ activeTab, onTabChange }) => (
  <div style={{
    display: 'flex',
    gap: 4,
    padding: '8px 16px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-primary)',
  }}>
    {[
      { key: 'h2h', label: '1X2' },
      { key: 'totals', label: 'Goals' }
    ].map(tab => (
      <button
        key={tab.key}
        onClick={() => onTabChange(tab.key)}
        style={{
          padding: '6px 16px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          border: 'none',
          borderRadius: 4,
          background: activeTab === tab.key ? 'var(--odds-blue)' : 'transparent',
          color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// ─── Column Headers ───────────────────────────────────────────────────────────

const TableHeader = ({ marketTab }) => {
  const h2hHeaders = ['', 'Time', 'Home', 'Away', '1', 'X', '2', 'Bookmaker'];
  const totalsHeaders = ['', 'Time', 'Home', 'Away', 'Over 2.5', 'Under 2.5', 'Bookmaker'];
  const headers = marketTab === 'totals' ? totalsHeaders : h2hHeaders;
  const gridCols = marketTab === 'totals'
    ? '30px 60px 1fr 1fr 120px 120px 150px'
    : '30px 60px 1fr 1fr 100px 100px 100px 100px';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols,
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-primary)',
    }}>
      {headers.map((label, i) => (
        <div key={i} style={{
          padding: '6px 8px',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: i >= 4 ? 'center' : 'left',
          borderRight: i < headers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
        }}>
          {label}
        </div>
      ))}
    </div>
  );
};

// ─── League Section Header ────────────────────────────────────────────────────

const LeagueRow = ({ league, isOpen, onToggle, matchCount }) => (
  <div
    className="league-header"
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '5px 10px',
      cursor: 'pointer',
      userSelect: 'none',
      gap: 8,
    }}
  >
    <ChevronIcon open={isOpen} />
    <FlagEmoji league={league} />
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)' }}>
      {league.title}
    </span>
    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
      {matchCount}
    </span>
  </div>
);

// ─── Match Row ────────────────────────────────────────────────────────────────

const MatchRow = ({ match, odds, bestOdds, isEven, favourites, onToggleFav, marketTab }) => {
  const time = new Date(match.commence_time);
  const now = new Date();
  const isToday = time.toDateString() === now.toDateString();
  const timeStr = isToday
    ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : time.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

  const isFav = favourites.has(match.id);

  // Get best odds based on market type
  let hasOdds, col1, col2, col3, bookmaker, isBest1, isBest2, isBest3;

  if (marketTab === 'totals') {
    // Goals/Totals market
    const overOdds = odds?.over ?? '-';
    const underOdds = odds?.under ?? '-';
    bookmaker = odds?.bookmaker ?? '';
    hasOdds = odds && typeof overOdds === 'number';
    col1 = overOdds;
    col2 = underOdds;
    col3 = null; // No third column for totals
    isBest1 = bestOdds && overOdds === bestOdds.over;
    isBest2 = bestOdds && underOdds === bestOdds.under;
    isBest3 = false;
  } else {
    // 1X2 market (h2h)
    const homeOdds = odds?.home ?? '-';
    const drawOdds = odds?.draw ?? '-';
    const awayOdds = odds?.away ?? '-';
    bookmaker = odds?.bookmaker ?? '';
    hasOdds = odds && typeof homeOdds === 'number';
    col1 = homeOdds;
    col2 = drawOdds;
    col3 = awayOdds;
    isBest1 = bestOdds && homeOdds === bestOdds.home;
    isBest2 = bestOdds && drawOdds === bestOdds.draw;
    isBest3 = bestOdds && awayOdds === bestOdds.away;
  }

  const gridCols = marketTab === 'totals'
    ? '30px 60px 1fr 1fr 120px 120px 150px'
    : '30px 60px 1fr 1fr 100px 100px 100px 100px';
  const spanCols = marketTab === 'totals' ? 3 : 4;

  return (
    <div
      className="match-row"
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        background: isEven ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
        borderBottom: '1px solid var(--border-subtle)',
        alignItems: 'center',
      }}
    >
      {/* Star */}
      <div style={{ textAlign: 'center' }}>
        <button className={`star-btn ${isFav ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleFav(match.id); }}>
          <StarIcon filled={isFav} />
        </button>
      </div>

      {/* Time */}
      <div style={{
        padding: '4px 8px', fontSize: 11,
        color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderRight: '1px solid var(--border-subtle)',
      }}>
        {timeStr}
      </div>

      {/* Home */}
      <div style={{
        padding: '4px 8px', fontSize: 12,
        color: 'var(--text-bright)', fontWeight: 500,
        borderRight: '1px solid var(--border-subtle)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {match.home_team}
      </div>

      {/* Away */}
      <div style={{
        padding: '4px 8px', fontSize: 12,
        color: 'var(--text-primary)',
        borderRight: '1px solid var(--border-subtle)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {match.away_team}
      </div>

      {hasOdds ? (
        <>
          {/* Column 1 (Home odds for h2h, Over 2.5 for totals) */}
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', padding: '3px 4px' }}>
            <span className={`odds-cell font-mono-odds ${isBest1 ? 'best' : ''}`}>
              {typeof col1 === 'number' ? col1.toFixed(3) : '-'}
            </span>
          </div>

          {/* Column 2 (Draw odds for h2h, Under 2.5 for totals) */}
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', padding: '3px 4px' }}>
            <span className={`odds-cell font-mono-odds ${isBest2 ? 'best' : ''}`}>
              {typeof col2 === 'number' ? col2.toFixed(3) : '-'}
            </span>
          </div>

          {/* Column 3 (Away odds for h2h only) */}
          {col3 !== null && (
            <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', padding: '3px 4px' }}>
              <span className={`odds-cell font-mono-odds ${isBest3 ? 'best' : ''}`}>
                {typeof col3 === 'number' ? col3.toFixed(3) : '-'}
              </span>
            </div>
          )}

          {/* Bookmaker */}
          <div style={{
            padding: '4px 8px', fontSize: 10,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {bookmaker}
          </div>
        </>
      ) : (
        /* No odds loaded yet — show click prompt */
        <div style={{
          gridColumn: `span ${spanCols}`,
          textAlign: 'center',
          padding: '3px 8px',
          fontSize: 11,
          color: 'gold',
          fontStyle: 'italic',
        }}>
          click to load odds
        </div>
      )}
    </div>
  );
};

// ─── Expanded Odds Detail ─────────────────────────────────────────────────────

const OddsDetail = ({ oddsData, onAddToBetslip }) => {
  const [detailTab, setDetailTab] = useState('h2h');

  if (!oddsData || !oddsData.bookmakers || oddsData.bookmakers.length === 0) {
    return null;
  }

  // Format last update time
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const lastUpdateStr = formatLastUpdate(oddsData.lastUpdate);

  const formatBetLimit = (limit) => {
    if (!limit) return null;
    if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`;
    if (limit >= 1000) return `${Math.round(limit / 1000)}k`;
    return String(limit);
  };

  const getBestOdds = (type, marketKey) => {
    let best = -1;
    oddsData.bookmakers.forEach(bookie => {
      const market = bookie.markets.find(m => m.key === marketKey);
      if (market) {
        if (marketKey === 'h2h') {
          const outcome = market.outcomes.find(o =>
            type === 'home' ? o.name === oddsData.home_team :
            type === 'away' ? o.name === oddsData.away_team :
            o.name === 'Draw'
          );
          if (outcome && outcome.price > best) best = outcome.price;
        } else if (marketKey === 'totals') {
          const outcome = market.outcomes.find(o =>
            type === 'over' ? o.name === 'Over' :
            o.name === 'Under'
          );
          if (outcome && outcome.price > best) best = outcome.price;
        }
      }
    });
    return best;
  };

  const bestHome = getBestOdds('home', 'h2h');
  const bestDraw = getBestOdds('draw', 'h2h');
  const bestAway = getBestOdds('away', 'h2h');
  const bestOver = getBestOdds('over', 'totals');
  const bestUnder = getBestOdds('under', 'totals');

  return (
    <div style={{
      gridColumn: '1 / -1',
      background: 'var(--bg-tertiary)',
      borderBottom: '2px solid var(--border-accent)',
      padding: '8px 16px 12px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-bright)',
        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{oddsData.home_team} vs {oddsData.away_team}</span>
        <span style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 3,
          background: 'var(--bg-primary)', color: 'var(--text-muted)',
        }}>
          {oddsData.bookmakers.length} bookmakers
        </span>
        {lastUpdateStr && (
          <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 3,
            background: 'var(--bg-primary)', color: 'var(--odds-yellow)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {lastUpdateStr}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[
            { key: 'h2h', label: '1X2' },
            { key: 'totals', label: 'Goals' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={(e) => { e.stopPropagation(); setDetailTab(tab.key); }}
              style={{
                padding: '4px 12px',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: 3,
                background: detailTab === tab.key ? 'var(--odds-blue)' : 'var(--bg-primary)',
                color: detailTab === tab.key ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {detailTab === 'h2h' ? (
        <table className="dense-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: 140 }}>Bookmaker</th>
              <th style={{ width: 100 }}>1 (Home)</th>
              <th style={{ width: 100 }}>X (Draw)</th>
              <th style={{ width: 100 }}>2 (Away)</th>
              <th style={{ width: 100 }}>Margin</th>
              <th style={{ width: 90, fontSize: 9, color: 'var(--odds-yellow)' }}>Max Bet</th>
            </tr>
          </thead>
          <tbody>
            {/* Average odds row */}
            {oddsData.averageOdds && (
              <tr style={{
                background: 'var(--bg-primary)',
                borderBottom: '2px solid var(--border-accent)',
              }}>
                <td style={{
                  textAlign: 'left', fontWeight: 700,
                  color: 'var(--odds-blue)', fontSize: 11,
                  padding: '6px 8px',
                }}>
                  AVG ({oddsData.averageOdds.bookmakerCount})
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span className="font-mono-odds odds-cell" style={{ color: 'var(--odds-blue)' }}>
                    {oddsData.averageOdds.home ? oddsData.averageOdds.home.toFixed(3) : '-'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span className="font-mono-odds odds-cell" style={{ color: 'var(--odds-blue)' }}>
                    {oddsData.averageOdds.draw ? oddsData.averageOdds.draw.toFixed(3) : '-'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span className="font-mono-odds odds-cell" style={{ color: 'var(--odds-blue)' }}>
                    {oddsData.averageOdds.away ? oddsData.averageOdds.away.toFixed(3) : '-'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span className="font-mono-odds">
                    {oddsData.averageOdds.home && oddsData.averageOdds.draw && oddsData.averageOdds.away
                      ? (((1/oddsData.averageOdds.home + 1/oddsData.averageOdds.draw + 1/oddsData.averageOdds.away) - 1) * 100).toFixed(2) + '%'
                      : '-'}
                  </span>
                </td>
                <td />
              </tr>
            )}
            {oddsData.bookmakers.map((bookie, i) => {
              const market = bookie.markets.find(m => m.key === 'h2h');
              if (!market) return null;

              const getOutcome = (name) => market.outcomes.find(o => o.name === name);

              const homeOutcome = getOutcome(oddsData.home_team);
              const drawOutcome = getOutcome('Draw');
              const awayOutcome = getOutcome(oddsData.away_team);

              const home = homeOutcome?.price ?? null;
              const draw = drawOutcome?.price ?? null;
              const away = awayOutcome?.price ?? null;

              const homeLimit = formatBetLimit(homeOutcome?.bet_limit);
              const drawLimit = formatBetLimit(drawOutcome?.bet_limit);
              const awayLimit = formatBetLimit(awayOutcome?.bet_limit);

              // Show the lowest bet limit across outcomes as the binding limit
              const rawLimits = [homeOutcome?.bet_limit, drawOutcome?.bet_limit, awayOutcome?.bet_limit].filter(Boolean);
              const minLimit = rawLimits.length > 0 ? formatBetLimit(Math.min(...rawLimits)) : null;

              // Calculate margin
              let margin = null;
              if (home && draw && away) {
                margin = ((1/home + 1/draw + 1/away) - 1) * 100;
              }

              return (
                <tr key={bookie.key} style={{
                  background: i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
                }}>
                  <td style={{
                    textAlign: 'left', fontWeight: 500,
                    color: 'var(--text-primary)', fontSize: 11,
                    padding: '5px 8px',
                  }}>
                    {bookie.title}
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    <div
                      className={`font-mono-odds ${home === bestHome ? 'odds-cell best' : 'odds-cell'}`}
                      onClick={() => home && onAddToBetslip(
                        oddsData.id,
                        {
                          homeTeam: oddsData.home_team,
                          awayTeam: oddsData.away_team,
                          sportKey: oddsData.sport_key,
                          commenceTime: oddsData.commence_time
                        },
                        'home',
                        'Home Win',
                        bookie.key,
                        bookie.title,
                        home,
                        'h2h',
                        { home, draw, away }
                      )}
                      style={{
                        cursor: home ? 'pointer' : 'default',
                        transition: 'background-color 0.1s ease',
                        padding: '2px 4px',
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => home && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {home ? home.toFixed(3) : '-'}
                      {homeLimit && <div style={{ fontSize: 8, color: 'var(--odds-yellow)', marginTop: 1, fontFamily: 'inherit' }}>{homeLimit}</div>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    <div
                      className={`font-mono-odds ${draw === bestDraw ? 'odds-cell best' : 'odds-cell'}`}
                      onClick={() => draw && onAddToBetslip(
                        oddsData.id,
                        {
                          homeTeam: oddsData.home_team,
                          awayTeam: oddsData.away_team,
                          sportKey: oddsData.sport_key,
                          commenceTime: oddsData.commence_time
                        },
                        'draw',
                        'Draw',
                        bookie.key,
                        bookie.title,
                        draw,
                        'h2h',
                        { home, draw, away }
                      )}
                      style={{
                        cursor: draw ? 'pointer' : 'default',
                        transition: 'background-color 0.1s ease',
                        padding: '2px 4px',
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => draw && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {draw ? draw.toFixed(3) : '-'}
                      {drawLimit && <div style={{ fontSize: 8, color: 'var(--odds-yellow)', marginTop: 1, fontFamily: 'inherit' }}>{drawLimit}</div>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    <div
                      className={`font-mono-odds ${away === bestAway ? 'odds-cell best' : 'odds-cell'}`}
                      onClick={() => away && onAddToBetslip(
                        oddsData.id,
                        {
                          homeTeam: oddsData.home_team,
                          awayTeam: oddsData.away_team,
                          sportKey: oddsData.sport_key,
                          commenceTime: oddsData.commence_time
                        },
                        'away',
                        'Away Win',
                        bookie.key,
                        bookie.title,
                        away,
                        'h2h',
                        { home, draw, away }
                      )}
                      style={{
                        cursor: away ? 'pointer' : 'default',
                        transition: 'background-color 0.1s ease',
                        padding: '2px 4px',
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => away && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {away ? away.toFixed(3) : '-'}
                      {awayLimit && <div style={{ fontSize: 8, color: 'var(--odds-yellow)', marginTop: 1, fontFamily: 'inherit' }}>{awayLimit}</div>}
                    </div>
                  </td>
                  <td style={{
                    textAlign: 'center', padding: '5px 8px',
                    fontSize: 11,
                    color: margin !== null && margin < 3 ? 'var(--odds-green)' :
                           margin !== null && margin < 5 ? 'var(--odds-yellow)' :
                           'var(--odds-red)',
                  }}>
                    <span className="font-mono-odds">
                      {margin !== null ? margin.toFixed(2) + '%' : '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    {minLimit ? (
                      <span style={{
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono, Consolas, monospace',
                        fontWeight: 600,
                        color: 'var(--odds-yellow)',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}>
                        {minLimit}
                      </span>
                    ) : (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table className="dense-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: 140 }}>Bookmaker</th>
              <th style={{ width: 100 }}>Line</th>
              <th style={{ width: 100 }}>Over</th>
              <th style={{ width: 100 }}>Under</th>
              <th style={{ width: 100 }}>Margin</th>
              <th style={{ width: 90, fontSize: 9, color: 'var(--odds-yellow)' }}>Max Bet</th>
            </tr>
          </thead>
          <tbody>
            {/* Average totals row */}
            {oddsData.averageTotals && (
              <tr style={{
                background: 'var(--bg-primary)',
                borderBottom: '2px solid var(--border-accent)',
              }}>
                <td style={{
                  textAlign: 'left', fontWeight: 700,
                  color: 'var(--odds-blue)', fontSize: 11,
                  padding: '6px 8px',
                }}>
                  AVG ({oddsData.averageTotals.bookmakerCount})
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span className="font-mono-odds" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    2.5
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span className="font-mono-odds odds-cell" style={{ color: 'var(--odds-blue)' }}>
                    {oddsData.averageTotals.over ? oddsData.averageTotals.over.toFixed(3) : '-'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span className="font-mono-odds odds-cell" style={{ color: 'var(--odds-blue)' }}>
                    {oddsData.averageTotals.under ? oddsData.averageTotals.under.toFixed(3) : '-'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span className="font-mono-odds">
                    {oddsData.averageTotals.over && oddsData.averageTotals.under
                      ? (((1/oddsData.averageTotals.over + 1/oddsData.averageTotals.under) - 1) * 100).toFixed(2) + '%'
                      : '-'}
                  </span>
                </td>
                <td />
              </tr>
            )}
            {oddsData.bookmakers.map((bookie, i) => {
              const market = bookie.markets.find(m => m.key === 'totals');
              if (!market) return null;

              const over = market.outcomes.find(o => o.name === 'Over');
              const under = market.outcomes.find(o => o.name === 'Under');
              const line = over?.point || under?.point || '-';

              const overLimit = formatBetLimit(over?.bet_limit);
              const underLimit = formatBetLimit(under?.bet_limit);

              const rawLimits = [over?.bet_limit, under?.bet_limit].filter(Boolean);
              const minTotalsLimit = rawLimits.length > 0 ? formatBetLimit(Math.min(...rawLimits)) : null;

              // Calculate margin for totals
              let margin = null;
              if (over && under) {
                margin = ((1/over.price + 1/under.price) - 1) * 100;
              }

              return (
                <tr key={bookie.key} style={{
                  background: i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
                }}>
                  <td style={{
                    textAlign: 'left', fontWeight: 500,
                    color: 'var(--text-primary)', fontSize: 11,
                    padding: '5px 8px',
                  }}>
                    {bookie.title}
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    <span className="font-mono-odds" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {line}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    <div
                      className={`font-mono-odds ${over && over.price === bestOver ? 'odds-cell best' : 'odds-cell'}`}
                      onClick={() => over && onAddToBetslip(
                        oddsData.id,
                        {
                          homeTeam: oddsData.home_team,
                          awayTeam: oddsData.away_team,
                          sportKey: oddsData.sport_key,
                          commenceTime: oddsData.commence_time
                        },
                        'over',
                        `Over ${line}`,
                        bookie.key,
                        bookie.title,
                        over.price,
                        'totals',
                        { over: over.price, under: under?.price }
                      )}
                      style={{
                        cursor: over ? 'pointer' : 'default',
                        transition: 'background-color 0.1s ease',
                        padding: '2px 4px',
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => over && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {over ? over.price.toFixed(3) : '-'}
                      {overLimit && <div style={{ fontSize: 8, color: 'var(--odds-yellow)', marginTop: 1, fontFamily: 'inherit' }}>{overLimit}</div>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    <div
                      className={`font-mono-odds ${under && under.price === bestUnder ? 'odds-cell best' : 'odds-cell'}`}
                      onClick={() => under && onAddToBetslip(
                        oddsData.id,
                        {
                          homeTeam: oddsData.home_team,
                          awayTeam: oddsData.away_team,
                          sportKey: oddsData.sport_key,
                          commenceTime: oddsData.commence_time
                        },
                        'under',
                        `Under ${line}`,
                        bookie.key,
                        bookie.title,
                        under.price,
                        'totals',
                        { over: over?.price, under: under.price }
                      )}
                      style={{
                        cursor: under ? 'pointer' : 'default',
                        transition: 'background-color 0.1s ease',
                        padding: '2px 4px',
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => under && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {under ? under.price.toFixed(3) : '-'}
                      {underLimit && <div style={{ fontSize: 8, color: 'var(--odds-yellow)', marginTop: 1, fontFamily: 'inherit' }}>{underLimit}</div>}
                    </div>
                  </td>
                  <td style={{
                    textAlign: 'center', padding: '5px 8px',
                    fontSize: 11,
                    color: margin !== null && margin < 3 ? 'var(--odds-green)' :
                           margin !== null && margin < 5 ? 'var(--odds-yellow)' :
                           'var(--odds-red)',
                  }}>
                    <span className="font-mono-odds">
                      {margin !== null ? margin.toFixed(2) + '%' : '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                    {minTotalsLimit ? (
                      <span style={{
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono, Consolas, monospace',
                        fontWeight: 600,
                        color: 'var(--odds-yellow)',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}>
                        {minTotalsLimit}
                      </span>
                    ) : (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const LoadingSkeleton = ({ rows = 8 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        display: 'grid',
        gridTemplateColumns: '30px 60px 1fr 1fr 100px 100px 100px 100px',
        padding: '8px 0',
        borderBottom: '1px solid var(--border-subtle)',
        gap: 8,
      }}>
        {Array.from({ length: 8 }).map((_, j) => (
          <div key={j} className="skeleton" style={{ height: 16, margin: '0 8px' }} />
        ))}
      </div>
    ))}
  </div>
);

// ─── Error Banner ─────────────────────────────────────────────────────────────

const ErrorBanner = ({ message, onDismiss }) => (
  <div style={{
    background: '#2a0a0a',
    borderBottom: '1px solid #4a1515',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    color: 'var(--odds-red)',
  }}>
    <span>{message}</span>
    <button onClick={onDismiss} style={{
      background: 'none', border: 'none', color: 'var(--odds-red)',
      cursor: 'pointer', fontSize: 14, padding: '0 4px',
    }}>×</button>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [leagueMatches, setLeagueMatches] = useState({}); // { leagueKey: [matches] }
  const [leagueOdds, setLeagueOdds] = useState({});       // { matchId: oddsData }
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [openLeagues, setOpenLeagues] = useState(new Set());
  const [favourites, setFavourites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingOdds, setLoadingOdds] = useState(new Set());
  const [error, setError] = useState(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [marketTab, setMarketTab] = useState('h2h');
  const [betslip, setBetslip] = useState([]);
  const [betslipOpen, setBetslipOpen] = useState(false);
  const [betslipPosition, setBetslipPosition] = useState({ x: 20, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [stake, setStake] = useState(10);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Get auth context
  const { user } = useAuth();

  // Sync betslip with cloud (handles migration and auto-save)
  useBetslipSync(betslip, setBetslip);

  // Load leagues on mount
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/sports`);
        setLeagues(res.data);
        // Auto-select first 3 popular leagues
        const popular = ['soccer_epl', 'soccer_spain_la_liga', 'soccer_italy_serie_a'];
        const autoSelect = res.data
          .filter(l => popular.some(pk => l.key.includes(pk)))
          .map(l => l.key)
          .slice(0, 3);
        if (autoSelect.length > 0) {
          setSelectedLeagues(autoSelect);
          setOpenLeagues(new Set(autoSelect));
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load leagues. Check your API connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeagues();
  }, []);

  // Fetch matches when selected leagues change
  useEffect(() => {
    const fetchMatches = async () => {
      const toFetch = selectedLeagues.filter(k => !leagueMatches[k]);
      if (toFetch.length === 0) return;

      setLoading(true);
      try {
        const results = await Promise.allSettled(
          toFetch.map(key =>
            axios.get(`${API_BASE_URL}/events/${key}`).then(res => ({ key, data: res.data }))
          )
        );

        const newMatches = {};
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            newMatches[r.value.key] = r.value.data;
          }
        });

        setLeagueMatches(prev => ({ ...prev, ...newMatches }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [selectedLeagues]);


  // Track which leagues have already had their odds fetched (prevents duplicate calls)
  const fetchedLeagueOddsRef = useRef(new Set());

  // Fetch odds on match click — uses the league-level endpoint for cost efficiency:
  // one API call loads ALL matches in the league instead of one call per match.
  // After the first click on any match in a league, all other matches in that league
  // show odds instantly (populated from the same single API call).
  const fetchOddsForMatch = useCallback(async (matchId) => {
    if (leagueOdds[matchId]) return; // Odds already loaded for this match

    // Find which league this match belongs to
    let leagueKey = null;
    for (const key of selectedLeagues) {
      const matches = leagueMatches[key] || [];
      if (matches.some(m => m.id === matchId)) {
        leagueKey = key;
        break;
      }
    }
    if (!leagueKey) return;

    // If this league is already being fetched or was already fetched, skip
    if (fetchedLeagueOddsRef.current.has(leagueKey)) return;
    fetchedLeagueOddsRef.current.add(leagueKey);

    setLoadingOdds(prev => new Set(prev).add(matchId));
    try {
      // One call fetches ALL events' odds for the entire league
      const res = await axios.get(`${API_BASE_URL}/league-odds/${leagueKey}`);
      // res.data is { [eventId]: oddsData } — populates every match in the league at once
      setLeagueOdds(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(`Failed to fetch league odds for ${leagueKey}`, err);
      setError('Failed to load odds. API quota may be exhausted.');
      fetchedLeagueOddsRef.current.delete(leagueKey); // Allow retry on error
    } finally {
      setLoadingOdds(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  }, [leagueOdds, selectedLeagues, leagueMatches]);

  // Get best odds for a match based on market type
  const getMatchBestOdds = useCallback((matchId, market = 'h2h') => {
    const data = leagueOdds[matchId];
    if (!data || !data.bookmakers || data.bookmakers.length === 0) return null;

    if (market === 'totals') {
      let bestOver = { price: -1, bookie: '' };
      let bestUnder = { price: -1, bookie: '' };

      data.bookmakers.forEach(bookie => {
        const totalsMarket = bookie.markets.find(m => m.key === 'totals');
        if (!totalsMarket) return;

        totalsMarket.outcomes.forEach(o => {
          if (o.name === 'Over' && o.price > bestOver.price) {
            bestOver = { price: o.price, bookie: bookie.title };
          } else if (o.name === 'Under' && o.price > bestUnder.price) {
            bestUnder = { price: o.price, bookie: bookie.title };
          }
        });
      });

      return {
        over: bestOver.price > 0 ? bestOver.price : null,
        under: bestUnder.price > 0 ? bestUnder.price : null,
        bookmaker: bestOver.bookie,
      };
    } else {
      // h2h market
      let bestHome = { price: -1, bookie: '' };
      let bestDraw = { price: -1, bookie: '' };
      let bestAway = { price: -1, bookie: '' };

      data.bookmakers.forEach(bookie => {
        const h2hMarket = bookie.markets.find(m => m.key === 'h2h');
        if (!h2hMarket) return;

        h2hMarket.outcomes.forEach(o => {
          if (o.name === data.home_team && o.price > bestHome.price) {
            bestHome = { price: o.price, bookie: bookie.title };
          } else if (o.name === 'Draw' && o.price > bestDraw.price) {
            bestDraw = { price: o.price, bookie: bookie.title };
          } else if (o.name === data.away_team && o.price > bestAway.price) {
            bestAway = { price: o.price, bookie: bookie.title };
          }
        });
      });

      return {
        home: bestHome.price > 0 ? bestHome.price : null,
        draw: bestDraw.price > 0 ? bestDraw.price : null,
        away: bestAway.price > 0 ? bestAway.price : null,
        bookmaker: bestHome.bookie,
      };
    }
  }, [leagueOdds]);

  const toggleLeague = useCallback((key) => {
    setSelectedLeagues(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setOpenLeagues(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const toggleLeagueOpen = useCallback((key) => {
    setOpenLeagues(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const toggleFavourite = useCallback((matchId) => {
    setFavourites(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId); else next.add(matchId);
      return next;
    });
  }, []);

  const handleMatchClick = useCallback((matchId) => {
    setExpandedMatch(prev => prev === matchId ? null : matchId);
    // Fetch odds on click only — no auto-fetching to save API quota
    fetchOddsForMatch(matchId);
  }, [fetchOddsForMatch]);

  // Betslip drag handlers
  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setDragOffset({
      x: window.innerWidth - e.clientX - betslipPosition.x,
      y: window.innerHeight - e.clientY - betslipPosition.y,
    });
  }, [betslipPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = window.innerWidth - e.clientX - dragOffset.x;
      const newY = window.innerHeight - e.clientY - dragOffset.y;

      // Constrain position to viewport
      const constrainedX = Math.max(20, Math.min(newX, window.innerWidth - 380));
      const constrainedY = Math.max(20, Math.min(newY, window.innerHeight - 100));

      setBetslipPosition({ x: constrainedX, y: constrainedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Betslip handlers
  const handleAddToBetslip = useCallback((matchId, matchInfo, outcome, outcomeLabel, bookmaker, bookmakerTitle, odds, marketType, allMarketOdds = {}) => {
    setBetslip(prev => {
      // Check if exact same selection already exists
      const exists = prev.find(item =>
        item.matchId === matchId &&
        item.outcome === outcome &&
        item.bookmaker === bookmaker &&
        item.marketType === marketType
      );
      if (exists) return prev; // Don't add duplicates

      // Calculate no-vig odds using classic normalization
      let noVigOdds = odds; // Default to original odds

      if (marketType === 'h2h' && allMarketOdds.home && allMarketOdds.draw && allMarketOdds.away) {
        // Convert to implied probabilities
        const probHome = 1 / allMarketOdds.home;
        const probDraw = 1 / allMarketOdds.draw;
        const probAway = 1 / allMarketOdds.away;
        const totalProb = probHome + probDraw + probAway;

        // Normalize and convert back to odds
        if (outcome === 'home') {
          noVigOdds = totalProb / probHome;
        } else if (outcome === 'draw') {
          noVigOdds = totalProb / probDraw;
        } else if (outcome === 'away') {
          noVigOdds = totalProb / probAway;
        }
      } else if (marketType === 'totals' && allMarketOdds.over && allMarketOdds.under) {
        // Convert to implied probabilities
        const probOver = 1 / allMarketOdds.over;
        const probUnder = 1 / allMarketOdds.under;
        const totalProb = probOver + probUnder;

        // Normalize and convert back to odds
        if (outcome === 'over') {
          noVigOdds = totalProb / probOver;
        } else if (outcome === 'under') {
          noVigOdds = totalProb / probUnder;
        }
      }

      const newItem = {
        id: `${matchId}-${outcome}-${bookmaker}-${marketType}-${Date.now()}`,
        matchId,
        matchInfo,
        outcome,
        outcomeLabel,
        bookmaker,
        bookmakerTitle,
        odds,
        noVigOdds,
        marketType
      };
      return [...prev, newItem];
    });
    // Auto-show betslip when adding a price
    setBetslipOpen(true);
  }, []);

  const handleRemoveFromBetslip = useCallback((itemId) => {
    setBetslip(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleClearBetslip = useCallback(() => {
    setBetslip([]);
  }, []);

  const handleUpdateCustomOdds = useCallback((itemId, customOdds) => {
    setBetslip(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, customOdds }
        : item
    ));
  }, []);

  const handleSaveBetslipToHistory = useCallback(async () => {
    if (!user) {
      alert('Sign in to save betslip history');
      setAuthModalOpen(true);
      return;
    }

    if (betslip.length === 0) {
      alert('Add bets to save');
      return;
    }

    const name = prompt('Name this betslip (optional):');
    if (name === null) return; // User cancelled

    // Calculate totals using custom odds if available
    const totalOdds = betslip.reduce((acc, item) => {
      const odds = item.customOdds && parseFloat(item.customOdds) > 0
        ? parseFloat(item.customOdds)
        : (item.noVigOdds || item.odds);
      return acc * odds;
    }, 1);

    const historyData = {
      name: name || `Betslip ${new Date().toLocaleDateString()}`,
      items: betslip,
      totalOdds: totalOdds,
      stake: stake,
      potentialReturn: stake * totalOdds,
    };

    try {
      await supabaseAPI.saveBetslipHistory(user.id, historyData);
      alert('✓ Betslip saved to history!');
    } catch (err) {
      alert('✗ Failed to save: ' + err.message);
    }
  }, [betslip, stake, user]);

  const handleToggleBetslip = useCallback(() => {
    setBetslipOpen(prev => !prev);
  }, []);

  const totalMatches = useMemo(() =>
    selectedLeagues.reduce((sum, key) => sum + (leagueMatches[key]?.length || 0), 0),
    [selectedLeagues, leagueMatches]
  );

  // Build favourite matches section
  const favouriteMatches = useMemo(() => {
    const favs = [];
    selectedLeagues.forEach(leagueKey => {
      const matches = leagueMatches[leagueKey] || [];
      matches.forEach(m => {
        if (favourites.has(m.id)) {
          favs.push({ ...m, leagueKey, league: leagues.find(l => l.key === leagueKey) });
        }
      });
    });
    return favs;
  }, [selectedLeagues, leagueMatches, favourites, leagues]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar
        leagues={leagues}
        selectedLeagues={selectedLeagues}
        onToggleLeague={toggleLeague}
        onSelectAll={() => {
          const allKeys = leagues.map(l => l.key);
          setSelectedLeagues(allKeys);
          setOpenLeagues(new Set(allKeys));
        }}
        onClearAll={() => {
          setSelectedLeagues([]);
          setOpenLeagues(new Set());
        }}
        searchTerm={sidebarSearch}
        onSearchChange={setSidebarSearch}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          matchCount={totalMatches}
          leagueCount={selectedLeagues.length}
          loading={loading || loadingOdds.size > 0}
          user={user}
          onAuthClick={() => setAuthModalOpen(true)}
          onOpenHistory={() => setHistoryModalOpen(true)}
        />

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <TabSwitcher activeTab={marketTab} onTabChange={setMarketTab} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TableHeader marketTab={marketTab} />

          {/* Favourites Section */}
          {favouriteMatches.length > 0 && (
            <>
              <div className="section-bar favourites">
                <StarIcon filled /> Favourites
                <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>{favouriteMatches.length}</span>
              </div>
              {favouriteMatches.map((match, i) => {
                const odds = getMatchBestOdds(match.id, marketTab);
                return (
                  <div key={`fav-${match.id}`} onClick={() => handleMatchClick(match.id)} style={{ cursor: 'pointer' }}>
                    <MatchRow
                      match={match}
                      odds={odds}
                      bestOdds={odds}
                      isEven={i % 2 === 0}
                      favourites={favourites}
                      onToggleFav={toggleFavourite}
                      marketTab={marketTab}
                    />
                    {expandedMatch === match.id && (
                      loadingOdds.has(match.id)
                        ? <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderBottom: '2px solid var(--border-accent)', fontSize: 12, color: 'var(--odds-yellow)' }}>Loading odds...</div>
                        : <OddsDetail oddsData={leagueOdds[match.id]} onAddToBetslip={handleAddToBetslip} />
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Today Section */}
          {selectedLeagues.length > 0 && (
            <div className="section-bar today">
              <span style={{
                display: 'inline-block', width: 7, height: 7,
                borderRadius: '50%', background: 'var(--accent-today)',
              }} />
              Today
              <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>{totalMatches}</span>
            </div>
          )}

          {loading && Object.keys(leagueMatches).length === 0 ? (
            <LoadingSkeleton rows={12} />
          ) : (
            selectedLeagues.map(leagueKey => {
              const league = leagues.find(l => l.key === leagueKey);
              const matches = leagueMatches[leagueKey] || [];
              if (!league || matches.length === 0) return null;

              const isOpen = openLeagues.has(leagueKey);

              return (
                <div key={leagueKey}>
                  <LeagueRow
                    league={league}
                    isOpen={isOpen}
                    onToggle={() => toggleLeagueOpen(leagueKey)}
                    matchCount={matches.length}
                  />
                  {isOpen && matches.map((match, i) => {
                    const odds = getMatchBestOdds(match.id, marketTab);
                    return (
                      <div key={match.id} onClick={() => handleMatchClick(match.id)} style={{ cursor: 'pointer' }}>
                        <MatchRow
                          match={match}
                          odds={odds}
                          bestOdds={odds}
                          isEven={i % 2 === 0}
                          favourites={favourites}
                          onToggleFav={toggleFavourite}
                          marketTab={marketTab}
                        />
                        {expandedMatch === match.id && (
                          loadingOdds.has(match.id)
                            ? <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderBottom: '2px solid var(--border-accent)', fontSize: 12, color: 'var(--odds-yellow)' }}>Loading odds...</div>
                            : <OddsDetail oddsData={leagueOdds[match.id]} onAddToBetslip={handleAddToBetslip} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}

          {/* Empty State */}
          {!loading && selectedLeagues.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '80px 40px', color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>⚽</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                No leagues selected
              </div>
              <div style={{ fontSize: 12 }}>
                Select leagues from the sidebar to view matches and odds
              </div>
            </div>
          )}

          {/* SEO Content Section */}
          <section style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-primary)',
            padding: '32px 24px',
            marginTop: 'auto',
          }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 16,
                letterSpacing: '-0.02em',
              }}>
                Compare Live Football Odds from Sharp Bookmakers
              </h2>

              <p style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: 20,
              }}>
                Sharp Odds aggregates real-time betting odds from the world's sharpest bookmakers including <strong>Pinnacle</strong>, <strong>Betfair Exchange</strong>, <strong>Matchbook</strong>, <strong>Smarkets</strong>, and more. Our platform helps you find the best odds across 50+ football leagues including the <strong>Premier League</strong>, <strong>La Liga</strong>, <strong>Serie A</strong>, <strong>Bundesliga</strong>, <strong>Ligue 1</strong>, and <strong>Champions League</strong>. Compare 1X2 (Match Winner) and Over/Under 2.5 Goals markets to identify value bets and arbitrage opportunities instantly.
              </p>

              <h3 style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 12,
                marginTop: 24,
              }}>
                Why Use Sharp Odds for Betting Odds Comparison?
              </h3>

              <ul style={{
                fontSize: 13,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                paddingLeft: 20,
                marginBottom: 20,
              }}>
                <li>Real-time odds from 12+ sharp bookmakers with lowest margins (1-3%)</li>
                <li>Average odds calculation across all sharp books for true market value</li>
                <li>Compare 1X2 and Over/Under markets side-by-side</li>
                <li>Identify value bets and arbitrage opportunities instantly</li>
                <li>No registration required - completely free odds comparison tool</li>
                <li>Clean, fast interface designed for professional bettors</li>
              </ul>

              <h3 style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}>
                Supported Bookmakers
              </h3>

              <p style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: 20,
              }}>
                We compare odds from Pinnacle, Betfair Exchange, BookMaker, BetOnline, Matchbook, Smarkets, BetAnySports, LowVig, Betway, Novig, Polymarket, and Kalshi. These sharp bookmakers offer the lowest margins and most accurate odds, making them ideal for finding true market value and beating the closing line.
              </p>

              <h3 style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}>
                Supported Football Leagues
              </h3>

              <p style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: 0,
              }}>
                We cover all major football leagues worldwide: English Premier League (EPL), Spanish La Liga, Italian Serie A, German Bundesliga, French Ligue 1, UEFA Champions League, UEFA Europa League, Portuguese Primeira Liga, Dutch Eredivisie, Scottish Premiership, Brazilian Serie A, Argentine Primera División, MLS, and 40+ additional domestic leagues. Find the best football odds for every match across all competitions.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Betslip components */}
      <BetslipWidget
        count={betslip.length}
        onClick={handleToggleBetslip}
      />
      <BetslipPanel
        betslip={betslip}
        isOpen={betslipOpen}
        onRemove={handleRemoveFromBetslip}
        onClear={handleClearBetslip}
        onClose={handleToggleBetslip}
        position={betslipPosition}
        onDragStart={handleDragStart}
        onUpdateCustomOdds={handleUpdateCustomOdds}
        stake={stake}
        onStakeChange={setStake}
        onSaveBetslipToHistory={handleSaveBetslipToHistory}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Betslip History Modal */}
      <BetslipHistory
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
}

export default App;
