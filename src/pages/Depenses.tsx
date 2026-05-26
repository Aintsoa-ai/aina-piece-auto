import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  X, 
  Search, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';

interface ExpenseItem {
  id: string;
  date: string;
  motif: string;
  commentaire: string;
  utilisateur: string;
  montant: number;
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

export const Depenses: React.FC = () => {
  const { role, profile } = useAuth();
  
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isDemoData = false;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motif, setMotif] = useState('');
  const [montant, setMontant] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exact mock list matching reference screenshot 1
  const demoExpenses: ExpenseItem[] = [
    {
      id: 'e1',
      date: '18/05/2026',
      motif: 'Électricité',
      commentaire: 'Facture JIRAMA',
      utilisateur: 'Administrateur',
      montant: 85000
    },
    {
      id: 'e2',
      date: '21/05/2026',
      motif: 'Carburant livraison',
      commentaire: 'Plein essence',
      utilisateur: 'Administrateur',
      montant: 45000
    }
  ];

  const formatAr = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  };

  const fetchData = async () => {
    setLoading(true);

    const timeoutPromise = new Promise<any>((resolve) => 
      setTimeout(() => resolve({ isTimeout: true }), 15000)
    );

    const queryPromise = (async () => {
      // Fetch expenses with profiles to display full name of creator
      const { data, error } = await supabase
        .from('depenses')
        .select('*, profiles:utilisateur_id(full_name, roles(name))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    })();

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result && !result.isTimeout && result.length > 0) {
        const parsed: ExpenseItem[] = result.map((item: any) => {
          // Parse motif & commentaire from description
          const desc = item.description || '';
          const parts = desc.split(' | ');
          const motifText = parts[0] || desc || 'Dépense';
          const commentText = parts[1] || '—';

          // Format date as DD/MM/YYYY
          const d = new Date(item.created_at);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const formattedDate = `${day}/${month}/${year}`;

          const userLabel = item.profiles?.full_name || 'Administrateur';

          return {
            id: item.id,
            date: formattedDate,
            motif: motifText,
            commentaire: commentText,
            utilisateur: userLabel,
            montant: Number(item.montant || 0)
          };
        });

        setExpenses(parsed);
        
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.error('Error fetching expenses, using fallback cards:', err);
      setExpenses([]);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setMotif('');
    setMontant('');
    setCommentaire('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif.trim()) {
      setErrorMsg("Le motif est obligatoire.");
      return;
    }

    const numMontant = parseNum(montant);
    if (isNaN(numMontant) || numMontant <= 0) {
      setErrorMsg("Le montant doit être supérieur à 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Save using description = 'motif | commentaire' format
    const fullDescription = `${motif.trim()} | ${commentaire.trim() || '—'}`;

    try {
      if (isDemoData) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        const newItem: ExpenseItem = {
          id: 'mock-e-' + Math.random().toString(36).substring(7),
          date: `${day}/${month}/${year}`,
          motif: motif.trim(),
          commentaire: commentaire.trim() || '—',
          utilisateur: profile?.full_name || 'Administrateur',
          montant: numMontant
        };

        setExpenses([newItem, ...expenses]);
        setSuccessMsg("Dépense enregistrée avec succès.");
        setTimeout(() => setIsModalOpen(false), 800);
        return;
      }

      const { data, error } = await supabase
        .from('depenses')
        .insert({
          montant: numMontant,
          description: fullDescription,
          utilisateur_id: profile?.id || null,
          boutique_id: profile?.boutique_id || null
        })
        .select('*')
        .single();

      if (error) throw error;

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();

      const newItem: ExpenseItem = {
        id: data.id,
        date: `${day}/${month}/${year}`,
        motif: motif.trim(),
        commentaire: commentaire.trim() || '—',
        utilisateur: profile?.full_name || 'Administrateur',
        montant: numMontant
      };

      setExpenses([newItem, ...expenses]);
      setSuccessMsg("Dépense enregistrée avec succès.");
      fetchData();
      setTimeout(() => setIsModalOpen(false), 800);
    } catch (err: any) {
      console.warn("DB save failed, simulating local update:", err);
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();

      const offlineId = uuidv4();

      await db.pending_depenses.add({
        id: offlineId,
        motif: motif.trim(),
        montant: numMontant,
        boutique_id: profile?.boutique_id || '',
        utilisateur_id: profile?.id || '',
        created_at: new Date().toISOString()
      });

      const simulatedItem: ExpenseItem = {
        id: offlineId,
        date: `${day}/${month}/${year}`,
        motif: motif.trim(),
        commentaire: commentaire.trim() || '—',
        utilisateur: profile?.full_name || 'Administrateur',
        montant: numMontant
      };

      setExpenses([simulatedItem, ...expenses]);
      setSuccessMsg("Dépense enregistrée localement (hors-ligne).");
      setTimeout(() => setIsModalOpen(false), 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter(e =>
    e.motif.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.commentaire.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.utilisateur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sumTotalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.montant, 0);

  return (
    <div style={s.container}>
      
      {/* HEADER SECTION exactly matching reference screenshot */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Dépenses</h1>
          <p style={s.pageSubtitle}>
            {filteredExpenses.length} dépenses — total {formatAr(sumTotalFiltered)}
          </p>
        </div>
        <button style={s.addBtn} onClick={handleOpenAddModal}>
          <Plus size={16} />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      {/* SEARCH BAR - always included below header and styled cleanly */}
      <div style={s.searchWrapper}>
        <Search size={16} style={s.searchIcon} />
        <input
          type="text"
          placeholder="Rechercher une dépense..."
          style={s.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TABLE WRAPPER CONTAINER */}
      {loading ? (
        <div style={s.loadingWrapper}>
          <div style={s.spinner}></div>
          <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.45)', fontSize: '13.5px' }}>Chargement des dépenses...</p>
        </div>
      ) : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>DATE</th>
                <th style={s.th}>MOTIF</th>
                <th style={s.th}>COMMENTAIRE</th>
                <th style={s.th}>UTILISATEUR</th>
                <th style={{ ...s.th, textAlign: 'right' }}>MONTANT</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} style={s.tr}>
                  <td style={s.td}>{expense.date}</td>
                  <td style={{ ...s.td, fontWeight: '700', color: '#ffffff' }}>{expense.motif}</td>
                  <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)' }}>{expense.commentaire}</td>
                  <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)' }}>{expense.utilisateur}</td>
                  <td style={{ ...s.td, textAlign: 'right', color: '#ef4444', fontWeight: '700' }}>
                    -{formatAr(expense.montant)}
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} style={s.emptyCell}>Aucune dépense trouvée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL OVERLAY: NOUVELLE DÉPENSE ───────────── */}
      {isModalOpen && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            
            {/* Header */}
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Nouvelle dépense</h3>
              <button style={s.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSave}>
              <div style={s.modalBody}>
                
                {errorMsg && (
                  <div style={s.alertBox}>
                    <AlertCircle size={15} style={{ marginRight: '6px' }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div style={s.successBox}>
                    <CheckCircle2 size={15} style={{ marginRight: '6px' }} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Motif Input */}
                <div style={s.inputContainer}>
                  <label style={s.inputLabel}>Motif *</label>
                  <input 
                    type="text"
                    style={s.inputField}
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Ex : Électricité, loyer..."
                    required
                  />
                </div>

                {/* Montant Input */}
                <div style={s.inputContainer}>
                  <label style={s.inputLabel}>Montant (Ar) *</label>
                  <input 
                    type="text"
                    style={s.inputField}
                    value={montant}
                    onChange={(e) => setMontant(formatNum(e.target.value))}
                    placeholder=""
                    required
                  />
                </div>

                {/* Commentaire Textarea */}
                <div style={s.inputContainer}>
                  <label style={s.inputLabel}>Commentaire</label>
                  <textarea 
                    style={s.textareaField}
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Facture JIRAMA, Plein essence, etc..."
                    rows={4}
                  />
                </div>

              </div>

              {/* Modal Buttons */}
              <div style={s.modalFooter}>
                <button 
                  type="button"
                  style={s.btnAnnuler} 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  style={s.btnValider} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

// ─── STYLES MATCHING THE REFERENCE PRECISELY ───────────
const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeIn 0.3s ease-out'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: '4px',
    fontWeight: 500
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0066fe',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 102, 254, 0.25)',
    transition: 'all 0.2s ease'
  },

  // Search input matching standard top bar search wrapper
  searchWrapper: {
    position: 'relative',
    maxWidth: '320px',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255, 255, 255, 0.35)',
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px 9px 38px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#161b22',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.15s ease'
  },

  // Premium glassmorphism table container
  tableWrapper: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '14px 20px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.35)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    letterSpacing: '0.05em'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#ffffff'
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13.5px'
  },

  // Loading indicator
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px'
  },
  spinner: {
    width: '26px',
    height: '26px',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderTopColor: '#0066fe',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },

  // Modal styles exact match to screenshot 2
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '460px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.45)',
    cursor: 'pointer',
    padding: '2px'
  },
  modalBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: '0.01em'
  },
  inputField: {
    width: '100%',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13.5px',
    outline: 'none'
  },
  textareaField: {
    width: '100%',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13.5px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit'
  },

  // Alert panels
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#ef4444',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px'
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#22c55e',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px'
  },

  // Footer buttons
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    backgroundColor: '#0d1117'
  },
  btnAnnuler: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  btnValider: {
    backgroundColor: '#0066fe',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};
