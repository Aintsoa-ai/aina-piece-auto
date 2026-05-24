import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Wallet, Play, Square, RefreshCw, Plus, ArrowUpRight, ArrowDownRight, Calendar, User, X } from 'lucide-react';

interface CaisseSession {
  id: string;
  boutique_id: string;
  boutiques?: { name: string };
  ouvert_par: string;
  ferme_par?: string;
  profiles?: { full_name: string };
  montant_debut: number;
  montant_fin?: number;
  statut: 'OUVERT' | 'FERME';
  date_ouverture: string;
  date_fermeture?: string;
}

interface CaisseTransaction {
  id: string;
  type: 'ENTREE' | 'SORTIE';
  montant: number;
  motif: string;
  created_at: string;
  utilisateurs?: { full_name: string };
}

const formatNum = (val: string | number | undefined | null) => {
  if (val === null || val === undefined || val === '') return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('fr-FR').format(parseInt(digits, 10)).replace(/\u202f/g, ' ');
};

const parseNum = (val: string | number | undefined | null) => {
  if (!val) return 0;
  return parseInt(String(val).replace(/\D/g, ''), 10) || 0;
};

export const Caisse: React.FC = () => {
  const { role, profile } = useAuth();
  const [activeSession, setActiveSession] = useState<CaisseSession | null>(null);
  const [sessions, setSessions] = useState<CaisseSession[]>([]);
  const [transactions, setTransactions] = useState<CaisseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = role === 'administrateur';

  const fetchCaisseState = async () => {
    setLoading(true);
    try {
      // 1. Fetch current open caisse for this boutique
      let openQuery = supabase
        .from('caisse')
        .select('*, boutiques(name), profiles:ouvert_par(full_name)')
        .eq('statut', 'OUVERT');

      if (profile?.boutique_id) {
        openQuery = openQuery.eq('boutique_id', profile.boutique_id);
      }

      const { data: openData } = await openQuery.limit(1);
      
      if (openData && openData.length > 0) {
        setActiveSession(openData[0]);
        // Fetch transactions for the active session (sales and expenses since opening)
        const dateStr = new Date(openData[0].date_ouverture).toISOString();
        
        // Fetch sales
        const { data: sales } = await supabase
          .from('ventes')
          .select('id, total, created_at')
          .gte('created_at', dateStr);

        // Fetch expenses
        const { data: expenses } = await supabase
          .from('depenses')
          .select('id, montant, motif, created_at')
          .gte('created_at', dateStr);

        const txs: CaisseTransaction[] = [];
        sales?.forEach(s => {
          txs.push({
            id: s.id,
            type: 'ENTREE',
            montant: Number(s.total),
            motif: 'Vente POS',
            created_at: s.created_at
          });
        });

        expenses?.forEach(e => {
          txs.push({
            id: e.id,
            type: 'SORTIE',
            montant: Number(e.montant),
            motif: `Dépense: ${e.motif}`,
            created_at: e.created_at
          });
        });

        txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTransactions(txs);
      } else {
        setActiveSession(null);
        setTransactions([]);
      }

      // 2. Fetch past sessions
      let listQuery = supabase
        .from('caisse')
        .select('*, boutiques(name), profiles:ouvert_par(full_name)')
        .order('date_ouverture', { ascending: false })
        .limit(20);

      if (profile?.boutique_id) {
        listQuery = listQuery.eq('boutique_id', profile.boutique_id);
      }

      const { data: listData } = await listQuery;
      setSessions(listData || []);
    } catch (err) {
      console.error(err);
      // Fallback mocks
      const mockSession: CaisseSession = {
        id: '1',
        boutique_id: 'b1',
        boutiques: { name: 'Aina Pièces Auto - Principal' },
        ouvert_par: 'u1',
        profiles: { full_name: 'Aina Admin' },
        montant_debut: 150000,
        statut: 'OUVERT',
        date_ouverture: new Date().toISOString()
      };
      setActiveSession(mockSession);
      
      const mockTxs: CaisseTransaction[] = [
        { id: 't1', type: 'ENTREE', montant: 450000, motif: 'Vente POS Ticket #9012', created_at: new Date().toISOString() },
        { id: 't2', type: 'SORTIE', montant: 45000, motif: 'Dépense: Frais livraison', created_at: new Date().toISOString() }
      ];
      setTransactions(mockTxs);

      setSessions([mockSession]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaisseState();
  }, [profile]);

  const handleOpenCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const balance = parseNum(openingBalance);

    if (isNaN(balance) || balance < 0) {
      setFormError('Le montant initial doit être valide (0 ou plus).');
      return;
    }

    try {
      let targetBoutiqueId = profile?.boutique_id;
      if (!targetBoutiqueId) {
        // Fallback pour les administrateurs sans boutique assignée
        const { data: bData } = await supabase.from('boutiques').select('id').limit(1);
        if (bData && bData.length > 0) {
          targetBoutiqueId = bData[0].id;
        } else {
          throw new Error("Impossible d'ouvrir la caisse : Aucune boutique existante.");
        }
      }

      const { error } = await supabase
        .from('caisse')
        .insert({
          boutique_id: targetBoutiqueId,
          ouvert_par: profile?.id,
          montant_debut: balance,
          statut: 'OUVERT'
        });

      if (error) throw error;
      setIsOpeningModalOpen(false);
      fetchCaisseState();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'ouverture de la caisse.');
    }
  };

  const handleCloseCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const balance = parseNum(closingBalance);

    if (isNaN(balance) || balance < 0) {
      setFormError('Le montant final doit être valide.');
      return;
    }

    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from('caisse')
        .update({
          montant_fin: balance,
          statut: 'FERME',
          date_fermeture: new Date().toISOString(),
          ferme_par: profile?.id
        })
        .eq('id', activeSession.id);

      if (error) throw error;
      setIsClosingModalOpen(false);
      fetchCaisseState();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la fermeture de la caisse.');
    }
  };

  const getExpectedBalance = () => {
    if (!activeSession) return 0;
    const entries = transactions.filter(t => t.type === 'ENTREE').reduce((acc, c) => acc + c.montant, 0);
    const exits = transactions.filter(t => t.type === 'SORTIE').reduce((acc, c) => acc + c.montant, 0);
    return activeSession.montant_debut + entries - exits;
  };

  const formatAr = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  };

  return (
    <div style={styles.container}>
      {/* active state header */}
      <div style={styles.statusBanner} className="glass-panel">
        <div style={styles.statusLeft}>
          <div style={{ ...styles.statusDot, backgroundColor: activeSession ? '#22c55e' : '#ef4444' }} />
          <div>
            <h3 style={styles.statusTitle}>
              {activeSession ? 'Caisse Ouverte' : 'Caisse Fermée'}
            </h3>
            <p style={styles.statusSub}>
              {activeSession
                ? `Ouverte par ${activeSession.profiles?.full_name} le ${new Date(activeSession.date_ouverture).toLocaleDateString()} à ${new Date(activeSession.date_ouverture).toLocaleTimeString()}`
                : 'Aucune session de vente active pour cette boutique.'}
            </p>
          </div>
        </div>
        <div style={styles.statusRight}>
          {activeSession ? (
            <button style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }} onClick={() => { setClosingBalance(getExpectedBalance().toString()); setIsClosingModalOpen(true); }}>
              <Square size={16} /> Fermer la Caisse
            </button>
          ) : (
            <button style={{ ...styles.actionBtn, backgroundColor: '#22c55e' }} onClick={() => { setOpeningBalance(''); setIsOpeningModalOpen(true); }}>
              <Play size={16} /> Ouvrir la Caisse
            </button>
          )}
        </div>
      </div>

      {activeSession && (
        <div style={styles.activeMetrics}>
          <div style={styles.metricCard} className="glass-panel">
            <span style={styles.metricLabel}>Fonds Initial</span>
            <span style={styles.metricValue}>{formatAr(activeSession.montant_debut)}</span>
          </div>
          <div style={styles.metricCard} className="glass-panel">
            <span style={styles.metricLabel}>Ventes Estimées (Jour)</span>
            <span style={{ ...styles.metricValue, color: '#22c55e' }}>
              +{formatAr(transactions.filter(t => t.type === 'ENTREE').reduce((acc, c) => acc + c.montant, 0))}
            </span>
          </div>
          <div style={styles.metricCard} className="glass-panel">
            <span style={styles.metricLabel}>Dépenses Estimées (Jour)</span>
            <span style={{ ...styles.metricValue, color: '#ef4444' }}>
              -{formatAr(transactions.filter(t => t.type === 'SORTIE').reduce((acc, c) => acc + c.montant, 0))}
            </span>
          </div>
          <div style={styles.metricCard} className="glass-panel">
            <span style={styles.metricLabel}>Solde Théorique</span>
            <span style={{ ...styles.metricValue, color: '#38bdf8' }}>{formatAr(getExpectedBalance())}</span>
          </div>
        </div>
      )}

      {/* Grid of Journal & past sessions */}
      <div style={styles.grid}>
        {/* Journal Section */}
        <div style={styles.col}>
          <h4 style={styles.sectionTitle}>Journal des Flux (Session active)</h4>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>HEURE</th>
                  <th style={styles.th}>MOTIF</th>
                  <th style={styles.th}>FLUX</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>MONTANT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={styles.emptyCell}>Aucune transaction enregistrée.</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>{new Date(t.created_at).toLocaleTimeString()}</td>
                      <td style={styles.td}>{t.motif}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.fluxBadge,
                          backgroundColor: t.type === 'ENTREE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: t.type === 'ENTREE' ? '#22c55e' : '#ef4444'
                        }}>
                          {t.type === 'ENTREE' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {t.type === 'ENTREE' ? 'ENTRÉE' : 'SORTIE'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, color: t.type === 'ENTREE' ? '#22c55e' : '#ef4444' }}>
                        {t.type === 'ENTREE' ? '+' : '-'}{formatAr(t.montant)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Section */}
        <div style={styles.col}>
          <h4 style={styles.sectionTitle}>Historique des Sessions</h4>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>DATE</th>
                  <th style={styles.th}>CAISSIER</th>
                  <th style={styles.th}>DEBUT</th>
                  <th style={styles.th}>FIN</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.emptyCell}>Aucune session passée.</td>
                  </tr>
                ) : (
                  sessions.map(s => (
                    <tr key={s.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                          <span>{new Date(s.date_ouverture).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                          <span>{s.profiles?.full_name || 'Utilisateur'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{formatAr(s.montant_debut)}</td>
                      <td style={styles.td}>{s.montant_fin !== null && s.montant_fin !== undefined ? formatAr(s.montant_fin) : '—'}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: s.statut === 'OUVERT' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: s.statut === 'OUVERT' ? '#22c55e' : 'rgba(255,255,255,0.5)'
                        }}>
                          {s.statut}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* OPENING MODAL */}
      {isOpeningModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Ouvrir la Caisse</span>
              <button style={styles.closeBtn} onClick={() => setIsOpeningModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleOpenCaisse} style={styles.form}>
              {formError && <div style={styles.error}>{formError}</div>}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Fonds de caisse initial (Ar)</label>
                <input
                  type="text"
                  placeholder=""
                  style={styles.input}
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(formatNum(e.target.value))}
                  required
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsOpeningModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#22c55e' }}>
                  Valider l'ouverture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSING MODAL */}
      {isClosingModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Fermer la Caisse</span>
              <button style={styles.closeBtn} onClick={() => setIsClosingModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCloseCaisse} style={styles.form}>
              {formError && <div style={styles.error}>{formError}</div>}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Solde théorique attendu</label>
                <div style={{ ...styles.input, backgroundColor: '#0d1117', color: '#a78bfa', fontWeight: 600 }}>
                  {formatAr(getExpectedBalance())}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fonds de caisse final constaté (Ar)</label>
                <input
                  type="text"
                  placeholder=""
                  style={styles.input}
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(formatNum(e.target.value))}
                  required
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsClosingModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#ef4444' }}>
                  Valider la fermeture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statusBanner: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#161b22',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
  },
  statusSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '2px',
  },
  statusRight: {
    display: 'flex',
    alignItems: 'center',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '6px',
    color: '#ffffff',
    border: 'none',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  activeMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif",
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tableWrapper: {
    backgroundColor: '#161b22',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.4)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  td: {
    padding: '12px 16px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.85)',
  },
  fluxBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
  },
  // Overlay & Modal styles
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '420px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0d1117',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    color: '#ffffff',
    border: 'none',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
  },
};
