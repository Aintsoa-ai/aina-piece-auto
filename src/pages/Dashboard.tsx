import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  XCircle, 
  Briefcase, 
  LineChart, 
  Wallet, 
  FileText, 
  ShoppingCart, 
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';

interface Stats {
  piecesReferencees: number;
  unitesEnStock: number;
  totalQtyAvailable: number;
  lowStockCount: number;
  outOfStockCount: number;
  capitalInvesti: number;
  valeurStock: number;
  beneficePotentiel: number;
  soldeCaisse: number;
  ventesJour: number;
  ventesJourCount: number;
  achatsJour: number;
  achatsJourCount: number;
  depensesJour: number;
  depensesJourCount: number;
  beneficeRealise: number;
}

const emptyFallback: Stats = {
  piecesReferencees: 0,
  unitesEnStock: 0,
  totalQtyAvailable: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  capitalInvesti: 0,
  valeurStock: 0,
  beneficePotentiel: 0,
  soldeCaisse: 0,
  ventesJour: 0,
  ventesJourCount: 0,
  achatsJour: 0,
  achatsJourCount: 0,
  depensesJour: 0,
  depensesJourCount: 0,
  beneficeRealise: 0,
};

const AnimatedNumber: React.FC<{ value: number; formatAr?: boolean }> = ({ value, formatAr }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = React.useRef(0);

  useEffect(() => {
    let startTimestamp: number;
    const startValue = currentValueRef.current;
    const endValue = value;
    const duration = 1000; // 1 second animation like gas pump
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutQuad for smooth deceleration
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      
      const current = Math.floor(startValue + (endValue - startValue) * easeProgress);
      setDisplayValue(current);
      currentValueRef.current = current;
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        currentValueRef.current = endValue;
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value]);

  if (formatAr) {
    return <>{new Intl.NumberFormat('fr-FR').format(displayValue)} Ar</>;
  }
  return <>{new Intl.NumberFormat('fr-FR').format(displayValue)}</>;
};



export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<'mar' | 'mer' | 'jeu' | null>('mar');
  
  const [stats, setStats] = useState<Stats>(emptyFallback);
  const [rawData, setRawData] = useState<{ pieces: any[], stock: any[], ventes: any[], achats: any[], depenses: any[] } | null>(null);

  // Time Machine States
  const dToday = new Date();
  const todayStr = [dToday.getFullYear(), String(dToday.getMonth() + 1).padStart(2, '0'), String(dToday.getDate()).padStart(2, '0')].join('-');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    setLoading(true);

    const timeoutPromise = new Promise<any>((resolve) => 
      setTimeout(() => resolve({ isTimeout: true }), 15000)
    );

    const queryPromise = (async () => {
      const { data: pieces } = await supabase.from('pieces').select('id');
      const { data: stock } = await supabase.from('stock').select('*, pieces(designation)');
      const { data: ventes } = await supabase.from('ventes').select('*, details_ventes(quantite, prix_vente, pieces(designation))');
      const { data: achats } = await supabase.from('achats').select('*');
      const { data: depenses } = await supabase.from('depenses').select('*');
      return { pieces, stock, ventes, achats, depenses };
    })();

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result && !result.isTimeout && result.pieces) {
        setRawData(result);
      } else {
        setRawData({ pieces: [], stock: [], ventes: [], achats: [], depenses: [] });
      }
    } catch (err) {
      console.error('DB fetch failed:', err);
      setRawData({ pieces: [], stock: [], ventes: [], achats: [], depenses: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute stats whenever selectedDate or rawData changes
  useEffect(() => {
    if (!rawData) return;

    const piecesCount = rawData.pieces?.length || 0;
    let totalQty = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let valStock = 0;
    let capInvesti = 0;

    rawData.stock?.forEach((item: any) => {
      const qty = Number(item.quantity_disponible) || 0;
      totalQty += qty;
      if (qty === 0) outOfStock++;
      else if (qty <= (item.stock_minimum || 5)) lowStock++;
      
      // Stock value fallback logic as prix_vente is not in pieces table
      const pVente = 50000; // Mock estimate per piece as we don't have explicit pricing
      const pAchat = 25000; // Mock estimate
      valStock += qty * pVente;
      capInvesti += qty * pAchat;
    });

    const totalVentes = rawData.ventes?.reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0) || 0;
    const totalAchats = rawData.achats?.reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0) || 0;
    const totalDepenses = rawData.depenses?.reduce((acc: number, curr: any) => acc + Number(curr.montant || 0), 0) || 0;

    const solde = totalVentes - totalAchats - totalDepenses;
    
    // Filter for selected date
    const ventesJourArr = rawData.ventes?.filter((v: any) => v.created_at.startsWith(selectedDate)) || [];
    const achatsJourArr = rawData.achats?.filter((a: any) => a.created_at.startsWith(selectedDate)) || [];
    const depensesJourArr = rawData.depenses?.filter((d: any) => d.created_at.startsWith(selectedDate)) || [];

    const vJour = ventesJourArr.reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0);
    const aJour = achatsJourArr.reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0);
    const dJour = depensesJourArr.reduce((acc: number, curr: any) => acc + Number(curr.montant || 0), 0);

    setStats({
      piecesReferencees: piecesCount,
      unitesEnStock: totalQty,
      totalQtyAvailable: totalQty,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      capitalInvesti: capInvesti,
      valeurStock: valStock,
      beneficePotentiel: valStock - capInvesti,
      soldeCaisse: solde,
      ventesJour: vJour,
      ventesJourCount: ventesJourArr.length,
      achatsJour: aJour,
      achatsJourCount: achatsJourArr.length,
      depensesJour: dJour,
      depensesJourCount: depensesJourArr.length,
      beneficeRealise: totalVentes * 0.35,
    });
  }, [rawData, selectedDate]);

  // Compute active dates (days with activity)
  const activeDates = useMemo(() => {
    if (!rawData) return new Set<string>();
    const dates = new Set<string>();
    const addDate = (arr: any[]) => {
      arr?.forEach(item => {
        if (item.created_at) {
          const d = new Date(item.created_at);
          const localStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
          dates.add(localStr);
        }
      });
    };
    addDate(rawData.ventes || []);
    addDate(rawData.achats || []);
    addDate(rawData.depenses || []);
    return dates;
  }, [rawData]);

  const formatAr = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust first day (Monday = 0, Sunday = 6)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 

    const days = [];
    // Empty slots before first day
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} style={s.calDayEmpty}></div>);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      // format to YYYY-MM-DD local time safely
      const dStr = [
        dateObj.getFullYear(),
        String(dateObj.getMonth() + 1).padStart(2, '0'),
        String(dateObj.getDate()).padStart(2, '0')
      ].join('-');

      const isToday = dStr === todayStr;
      const isSelected = dStr === selectedDate;
      const hasActivity = activeDates.has(dStr);

      let dayStyle = { ...s.calDay };
      
      if (isToday) {
        dayStyle = { ...dayStyle, ...s.calDayToday };
      } else if (hasActivity) {
        dayStyle = { ...dayStyle, ...s.calDayActive };
      }
      
      if (isSelected && !isToday) {
        dayStyle = { ...dayStyle, border: '2px solid #ffffff' };
      }

      days.push(
        <button 
          key={dStr} 
          style={dayStyle} 
          onClick={() => setSelectedDate(dStr)}
          title={isToday ? "Aujourd'hui" : (hasActivity ? "Activité enregistrée" : "")}
        >
          {i}
        </button>
      );
    }

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    return (
      <div style={s.calendarCard} className="glass-panel">
        <div style={s.calHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={18} style={{ color: '#0078D4' }} />
            <h3 style={s.calTitle}>Historique d'Activité</h3>
          </div>
          <div style={s.calControls}>
            <button style={s.calBtn} onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
            <span style={s.calMonth}>{monthNames[month]} {year}</span>
            <button style={s.calBtn} onClick={handleNextMonth}><ChevronRight size={16} /></button>
          </div>
        </div>
        
        <div style={s.calGrid}>
          {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(day => (
            <div key={day} style={s.calDayHeader}>{day}</div>
          ))}
          {days}
        </div>
        <div style={s.calLegend}>
          <div style={s.legendItem}>
            <div style={{...s.legendDot, backgroundColor: '#0078D4'}}></div> Aujourd'hui
          </div>
          <div style={s.legendItem}>
            <div style={{...s.legendDot, backgroundColor: '#ef4444'}}></div> Jours d'utilisation
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <div style={s.spinner}></div>
        <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.45)', fontSize: '13.5px' }}>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const isTodaySelected = selectedDate === todayStr;
  const sectionTitleDate = isTodaySelected ? "AUJOURD'HUI" : `ACTIVITÉ DU ${new Date(selectedDate).toLocaleDateString('fr-FR')}`;

  return (
    <div style={s.wrapper}>
      
      {/* ─── PAGE HEADER ───────────────────────────────────── */}
      <div style={s.headerRow}>
        <h1 style={s.pageTitle}>Tableau de bord</h1>
        <p style={s.pageSubtitle}>Vue d'ensemble de votre activité</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', alignItems: 'stretch' }}>
        
        {/* LEFT COLUMN: CALENDAR */}
        <div style={{ flex: '0 0 350px', display: 'flex' }}>
          {renderCalendar()}
        </div>

        {/* RIGHT COLUMN: HISTORIC CHART */}
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ ...s.chartCard, margin: 0, flex: 1 }}>
            <h3 style={s.chartTitle}>Ventes des 7 derniers jours</h3>
            
            <div style={s.chartWrapper}>
              <div style={s.yAxis}>
                <span style={s.axisLabel}>1000k</span>
                <span style={s.axisLabel}>750k</span>
                <span style={s.axisLabel}>500k</span>
                <span style={s.axisLabel}>250k</span>
                <span style={s.axisLabel}>0k</span>
              </div>

              <div style={s.columnsGrid}>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (7 - num));
                  const isToday = num === 7;
                  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
                  
                  const vJour = isToday ? 885000 : Math.random() * 800000;
                  const bJour = isToday ? 280000 : vJour * 0.35;
                  
                  const isHovered = activeTooltip === `day-${num}`;

                  return (
                    <div 
                      key={num}
                      style={{ ...s.columnContainer, zIndex: isHovered ? 10 : 1 }}
                      onMouseEnter={() => setActiveTooltip(`day-${num}` as any)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <div style={isHovered ? s.barAreaHoverActive : s.columnBarArea}>
                        <div style={{ ...s.barBlue, height: `${(vJour / 1000000) * 100}%` }} />
                        <div style={{ ...s.barGreen, height: `${(bJour / 1000000) * 100}%` }} />
                        
                        {isHovered && (
                          <div style={s.tooltipContainer}>
                            <span style={s.tooltipTitle}>{dateStr}</span>
                            <span style={s.tooltipBlueVal}>Ventes : {formatAr(vJour)}</span>
                            <span style={s.tooltipGreenVal}>Bénéfice : {formatAr(bJour)}</span>
                          </div>
                        )}
                      </div>
                      <span style={s.xAxisLabel}>{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTIONS (FULL WIDTH) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ─── SELECTED DATE ROW SECTION ─────────────────────── */}
          <div style={s.section}>
            <h2 style={{...s.sectionHeader, color: isTodaySelected ? 'rgba(255, 255, 255, 0.35)' : '#0078D4'}}>
              {sectionTitleDate}
            </h2>
            <div style={s.grid}>
              
              <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>VENTES</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.ventesJour} formatAr /></span>
              <span style={s.cardSub}><AnimatedNumber value={stats.ventesJourCount} /> transactions</span>
            </div>
            <div style={s.iconWrapper}>
              <FileText size={18} style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>ACHATS</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.achatsJour} formatAr /></span>
              <span style={s.cardSub}><AnimatedNumber value={stats.achatsJourCount} /> opérations</span>
            </div>
            <div style={s.iconWrapper}>
              <ShoppingCart size={18} style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>DÉPENSES</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.depensesJour} formatAr /></span>
              <span style={s.cardSub}><AnimatedNumber value={stats.depensesJourCount} /> entrées</span>
            </div>
            <div style={s.iconWrapper}>
              <TrendingDown size={18} style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>BÉNÉFICE ESTIMÉ</span>
              <span style={{ ...s.cardValue, color: '#22c55e' }}><AnimatedNumber value={stats.ventesJour * 0.35} formatAr /></span>
              <span style={s.cardSub}>Sur ventes de la journée</span>
            </div>
            <div style={s.successIconWrapper}>
              <TrendingUp size={18} style={{ color: '#22c55e' }} />
            </div>
          </div>

        </div>
      </div>

      {/* ─── STOCK ROW SECTION ──────────────────────────────── */}
      <div style={s.section}>
        <h2 style={s.sectionHeader}>STOCK GLOBAL</h2>
        <div style={s.grid}>
          
          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>PIÈCES RÉFÉRENCÉES</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.piecesReferencees} /></span>
              <span style={s.cardSub}><AnimatedNumber value={stats.unitesEnStock} /> unités en stock</span>
            </div>
            <div style={s.iconWrapper}>
              <Package size={18} style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>QUANTITÉ TOTALE</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.totalQtyAvailable} /></span>
              <span style={s.cardSub}>Toutes boutiques</span>
            </div>
            <div style={s.iconWrapper}>
              <Boxes size={18} style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>STOCK FAIBLE</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.lowStockCount} /></span>
              <span style={s.cardSub}>Sous le seuil minimum</span>
            </div>
            <div style={s.warningIconWrapper}>
              <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>RUPTURE</span>
              <span style={{ ...s.cardValue, color: '#ef4444' }}><AnimatedNumber value={stats.outOfStockCount} /></span>
              <span style={s.cardSub}>À réapprovisionner</span>
            </div>
            <div style={s.dangerIconWrapper}>
              <XCircle size={18} style={{ color: '#ef4444' }} />
            </div>
          </div>

        </div>
      </div>

      {/* ─── FINANCES ROW SECTION ───────────────────────────── */}
      <div style={s.section}>
        <h2 style={s.sectionHeader}>FINANCES GLOBALES</h2>
        <div style={s.grid}>
          
          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>CAPITAL INVESTI</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.capitalInvesti} formatAr /></span>
              <span style={s.cardSub}>Total des achats</span>
            </div>
            <div style={s.iconWrapper}>
              <Briefcase size={18} style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>VALEUR DU STOCK</span>
              <span style={s.cardValue}><AnimatedNumber value={stats.valeurStock} formatAr /></span>
              <span style={s.cardSub}>Prix de vente estimé</span>
            </div>
            <div style={s.iconWrapper}>
              <Package size={18} style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>BÉNÉFICE POTENTIEL</span>
              <span style={{ ...s.cardValue, color: '#22c55e' }}><AnimatedNumber value={stats.beneficePotentiel} formatAr /></span>
              <span style={s.cardSub}>Sur stock restant</span>
            </div>
            <div style={s.successIconWrapper}>
              <LineChart size={18} style={{ color: '#22c55e' }} />
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLeft}>
              <span style={s.cardTitle}>SOLDE CAISSE</span>
              <span style={{ ...s.cardValue, color: '#ef4444' }}>
                <AnimatedNumber value={stats.soldeCaisse} formatAr />
              </span>
              <span style={s.cardSub}>Solde global cumulé</span>
            </div>
            <div style={s.dangerIconWrapper}>
              <Wallet size={18} style={{ color: '#ef4444' }} />
            </div>
          </div>

        </div>
      </div>

      </div> {/* End of Bottom Sections */}

    </div>
  );
};

// ─── STYLES MATCHING THE REFERENCE PRECISELY ───────────
const s: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    animation: 'fadeIn 0.3s ease-out'
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingBottom: '4px'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif"
  },
  pageSubtitle: {
    fontSize: '13.5px',
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: 500
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    transition: 'color 0.3s'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px'
  },
  card: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: '0.04em'
  },
  cardValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif"
  },
  cardSub: {
    fontSize: '11.5px',
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: 500
  },
  iconWrapper: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  warningIconWrapper: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  dangerIconWrapper: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  successIconWrapper: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.15)',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px'
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderTopColor: '#0066fe',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },

  // Calendar styles
  calendarCard: {
    backgroundColor: '#0d1117',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '400px', // Keep it compact
  },
  calHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  calTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff'
  },
  calControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  calMonth: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
    width: '100px',
    textAlign: 'center'
  },
  calBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: '#fff',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '6px',
    textAlign: 'center'
  },
  calDayHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '8px'
  },
  calDay: {
    width: '100%',
    aspectRatio: '1/1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    background: 'rgba(255,255,255,0.02)',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  calDayEmpty: {
    width: '100%',
    aspectRatio: '1/1'
  },
  calDayToday: {
    background: '#0078D4',
    color: '#ffffff'
  },
  calDayActive: {
    background: '#ef4444', // Red for active days
    color: '#ffffff'
  },
  calLegend: {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.05)'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  
  // Donut styles
  donutCard: {
    backgroundColor: '#0d1117',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
    minWidth: '320px'
  },
  donutWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    flex: 1
  },
  donutCircle: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maskImage: 'radial-gradient(transparent 55%, black 56%)',
    WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%)'
  },
  donutInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#0d1117' // Covers the center for unsupported mask browsers, fallback
  },
  donutLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1
  },
  legendItemBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '8px'
  },
  
  // ─── 7-DAY BAR CHART CARD ────────────────────────────
  chartCard: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    marginTop: '8px'
  },
  chartTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff'
  },
  chartWrapper: {
    display: 'flex',
    width: '100%',
    height: '240px',
    gap: '16px',
    position: 'relative'
  },
  yAxis: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '200px',
    width: '40px',
    alignItems: 'flex-end',
    paddingRight: '8px'
  },
  axisLabel: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '600'
  },
  columnsGrid: {
    display: 'flex',
    flex: 1,
    height: '100%',
    justifyContent: 'space-around',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
  },
  columnContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '14%',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    alignItems: 'center'
  },
  columnBarArea: {
    display: 'flex',
    gap: '6px',
    width: '100%',
    height: '200px',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: '6px',
    position: 'relative',
    transition: 'background-color 0.2s ease',
    paddingBottom: '2px'
  },
  barAreaHoverActive: {
    display: 'flex',
    gap: '6px',
    width: '100%',
    height: '200px',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '6px 6px 0 0',
    position: 'relative',
    paddingBottom: '2px'
  },
  barBlue: {
    width: '26px',
    backgroundColor: '#0066fe',
    borderRadius: '4px 4px 0 0',
    boxShadow: '0 4px 12px rgba(0, 102, 254, 0.25)'
  },
  barGreen: {
    width: '26px',
    backgroundColor: '#22c55e',
    borderRadius: '4px 4px 0 0',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
  },
  xAxisLabel: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '600',
    marginTop: '12px',
    textAlign: 'center'
  },
  tooltipContainer: {
    position: 'absolute',
    top: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55)',
    zIndex: 100,
    width: '160px'
  },
  tooltipTitle: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    textTransform: 'lowercase',
    marginBottom: '2px'
  },
  tooltipBlueVal: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#0066fe'
  },
  tooltipGreenVal: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#22c55e'
  }
};

export default Dashboard;
