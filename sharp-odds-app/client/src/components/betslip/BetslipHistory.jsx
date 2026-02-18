import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';

export default function BetslipHistory({ isOpen, onClose }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    async function fetchHistory() {
      setLoading(true);
      if (!supabase) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('betslip_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error) {
        setHistory(data || []);
      } else {
        console.error('Failed to load history:', error);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e2f45 0%, #2a3f5f 100%)',
          borderRadius: 12,
          padding: 24,
          width: '90%',
          maxWidth: 900,
          maxHeight: '85vh',
          overflow: 'auto',
          border: '2px solid #4a7ba7',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '2px solid #4a7ba7',
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--odds-green)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            📚 Saved Betslips
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(248, 113, 113, 0.2)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              borderRadius: 6,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: 20,
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
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: '#94a3b8',
            }}
          >
            <div
              style={{
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              Loading your saved betslips...
            </div>
          </div>
        ) : history.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              color: '#94a3b8',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No saved betslips yet</div>
            <div style={{ fontSize: 13 }}>
              Save betslips from the Analysis tab to see them here
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {history.map((item) => {
              const createdDate = new Date(item.created_at);
              const itemCount = Array.isArray(item.items) ? item.items.length : 0;
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    background: 'linear-gradient(135deg, #2e4158 0%, #253649 100%)',
                    borderRadius: 8,
                    border: '1px solid #3a5575',
                    borderLeft: '4px solid var(--odds-green)',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderLeftColor = '#22c55e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderLeftColor = 'var(--odds-green)';
                  }}
                >
                  {/* Header Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--text-white)',
                          margin: '0 0 6px 0',
                        }}
                      >
                        {item.name || 'Untitled Betslip'}
                      </h3>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                        }}
                      >
                        {createdDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#4ade80',
                        background: 'rgba(74, 222, 128, 0.1)',
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontWeight: 600,
                        border: '1px solid rgba(74, 222, 128, 0.3)',
                      }}
                    >
                      {itemCount} {itemCount === 1 ? 'Selection' : 'Selections'}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  {(() => {
                    const sharpTotalOdds = Array.isArray(item.items)
                      ? item.items.reduce((acc, bet) => acc * (bet.odds || 1), 1)
                      : 1;
                    const noVigTotalOdds = Array.isArray(item.items)
                      ? item.items.reduce((acc, bet) => acc * (bet.noVigOdds || bet.odds || 1), 1)
                      : 1;
                    const hasCustomOdds = Array.isArray(item.items) && item.items.some(bet => bet.customOdds && parseFloat(bet.customOdds) > 0);
                    const customTotalOdds = hasCustomOdds
                      ? item.items.reduce((acc, bet) => {
                          const odds = bet.customOdds && parseFloat(bet.customOdds) > 0
                            ? parseFloat(bet.customOdds)
                            : (bet.noVigOdds || bet.odds || 1);
                          return acc * odds;
                        }, 1)
                      : null;

                    const sharpReturn = parseFloat(item.stake || 0) * sharpTotalOdds;
                    const noVigReturn = parseFloat(item.stake || 0) * noVigTotalOdds;
                    const customReturn = customTotalOdds !== null ? parseFloat(item.stake || 0) * customTotalOdds : null;

                    const noVigVsSharp = sharpTotalOdds > 0 ? ((noVigTotalOdds - sharpTotalOdds) / sharpTotalOdds * 100) : 0;
                    const customVsSharp = customTotalOdds !== null && sharpTotalOdds > 0 ? ((customTotalOdds - sharpTotalOdds) / sharpTotalOdds * 100) : null;
                    const customVsNoVig = customTotalOdds !== null && noVigTotalOdds > 0 ? ((customTotalOdds - noVigTotalOdds) / noVigTotalOdds * 100) : null;

                    const formatPct = (pct) => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
                    const pctColor = (pct) => pct >= 0 ? '#4ade80' : '#f87171';

                    return (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          padding: 12,
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: 6,
                        }}
                      >
                        {/* Stake */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                            Stake
                          </div>
                          <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 700, color: '#94a3b8' }}>
                            €{item.stake ? parseFloat(item.stake).toFixed(2) : '0.00'}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />

                        {/* Sharp Odds Total */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                              Sharp Odds Total
                            </span>
                            <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 600, color: '#60a5fa' }}>
                              {sharpTotalOdds.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 8, color: '#94a3b8' }}>Return:</span>
                            <span style={{ fontSize: 14, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 700, color: '#60a5fa' }}>
                              €{sharpReturn.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* No-Vig Odds Total */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                              No-Vig Odds Total
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                fontSize: 9,
                                fontFamily: 'JetBrains Mono, Consolas, monospace',
                                fontWeight: 600,
                                color: pctColor(noVigVsSharp),
                                background: `${pctColor(noVigVsSharp)}1a`,
                                border: `1px solid ${pctColor(noVigVsSharp)}40`,
                                borderRadius: 4,
                                padding: '1px 5px',
                              }}>
                                {formatPct(noVigVsSharp)} vs Sharp
                              </span>
                              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 600, color: '#a78bfa' }}>
                                {noVigTotalOdds.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 8, color: '#94a3b8' }}>Return:</span>
                            <span style={{ fontSize: 14, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 700, color: '#a78bfa' }}>
                              €{noVigReturn.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Custom Odds Total */}
                        {customTotalOdds !== null && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                                Custom Odds Total
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                  {customVsSharp !== null && (
                                    <span style={{
                                      fontSize: 9,
                                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                                      fontWeight: 600,
                                      color: pctColor(customVsSharp),
                                      background: `${pctColor(customVsSharp)}1a`,
                                      border: `1px solid ${pctColor(customVsSharp)}40`,
                                      borderRadius: 4,
                                      padding: '1px 5px',
                                    }}>
                                      {formatPct(customVsSharp)} vs Sharp
                                    </span>
                                  )}
                                  {customVsNoVig !== null && (
                                    <span style={{
                                      fontSize: 9,
                                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                                      fontWeight: 600,
                                      color: pctColor(customVsNoVig),
                                      background: `${pctColor(customVsNoVig)}1a`,
                                      border: `1px solid ${pctColor(customVsNoVig)}40`,
                                      borderRadius: 4,
                                      padding: '1px 5px',
                                    }}>
                                      {formatPct(customVsNoVig)} vs No-Vig
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 700, color: '#fbbf24' }}>
                                  {customTotalOdds.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 8, color: '#94a3b8' }}>Return:</span>
                              <span style={{ fontSize: 14, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 700, color: '#fbbf24' }}>
                                €{customReturn.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Expand/Collapse indicator */}
                  <div
                    style={{
                      marginTop: 12,
                      padding: 8,
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#94a3b8',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {isExpanded ? '▲ Click to collapse' : '▼ Click to view selections'}
                  </div>

                  {/* Expanded bet details */}
                  {isExpanded && Array.isArray(item.items) && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 6,
                        border: '1px solid rgba(74, 222, 128, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#4ade80',
                          marginBottom: 12,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        📋 Selections ({item.items.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {item.items.map((bet, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: 10,
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: 4,
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: '#94a3b8',
                                marginBottom: 4,
                              }}
                            >
                              {bet.matchInfo?.homeTeam} vs {bet.matchInfo?.awayTeam}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#4ade80',
                                marginBottom: 8,
                              }}
                            >
                              {bet.outcomeLabel}
                            </div>

                            {/* Odds breakdown */}
                            {(() => {
                              const sharpOdds = bet.odds || 0;
                              const noVigOdds = bet.noVigOdds || 0;
                              const customOdds = bet.customOdds && parseFloat(bet.customOdds) > 0 ? parseFloat(bet.customOdds) : 0;
                              const noVigVsSharpPct = sharpOdds > 0 && noVigOdds > 0 ? ((noVigOdds - sharpOdds) / sharpOdds * 100) : null;
                              const customVsSharpPct = sharpOdds > 0 && customOdds > 0 ? ((customOdds - sharpOdds) / sharpOdds * 100) : null;
                              const customVsNoVigPct = noVigOdds > 0 && customOdds > 0 ? ((customOdds - noVigOdds) / noVigOdds * 100) : null;
                              const fmtPct = (pct) => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
                              const pctClr = (pct) => pct >= 0 ? '#4ade80' : '#f87171';
                              const pctBadge = (pct, label) => (
                                <span style={{
                                  fontSize: 8,
                                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                                  fontWeight: 600,
                                  color: pctClr(pct),
                                  background: `${pctClr(pct)}1a`,
                                  border: `1px solid ${pctClr(pct)}40`,
                                  borderRadius: 3,
                                  padding: '1px 4px',
                                  marginLeft: 4,
                                }}>
                                  {fmtPct(pct)} vs {label}
                                </span>
                              );
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                                  {sharpOdds > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>Sharp Odds:</span>
                                      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 600, color: '#60a5fa' }}>
                                        {sharpOdds.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {noVigOdds > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>No-Vig Odds:</span>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {noVigVsSharpPct !== null && pctBadge(noVigVsSharpPct, 'Sharp')}
                                        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 600, color: '#a78bfa', marginLeft: 6 }}>
                                          {noVigOdds.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {customOdds > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>Custom Odds:</span>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {customVsSharpPct !== null && pctBadge(customVsSharpPct, 'Sharp')}
                                        {customVsNoVigPct !== null && pctBadge(customVsNoVigPct, 'No-Vig')}
                                        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, Consolas, monospace', fontWeight: 700, color: '#fbbf24', marginLeft: 6 }}>
                                          {customOdds.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div
                              style={{
                                fontSize: 9,
                                color: '#94a3b8',
                                marginTop: 4,
                              }}
                            >
                              {bet.bookmakerTitle} • {bet.marketType === 'h2h' ? '1X2' : 'Totals'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes if any */}
                  {item.notes && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: 'rgba(96, 165, 250, 0.05)',
                        borderRadius: 4,
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                      }}
                    >
                      "{item.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {history.length > 0 && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #3a5575',
              textAlign: 'center',
              fontSize: 12,
              color: '#94a3b8',
            }}
          >
            Showing {history.length} saved betslip{history.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
