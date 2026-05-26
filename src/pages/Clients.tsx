import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, User, Search, Plus, X, AlertCircle, CheckCircle2, 
  CreditCard, Calendar, History, TrendingUp 
} from 'lucide-react';
import { showAlert, showConfirm } from '../utils/alerts';

interface ClientItem {
  id: string;
  nom: string;
  contact: string;
  type_client: string;
  created_at: string;
  total_du?: number; // Calculé
}

export const Clients: React.FC = () => {
  const { t } = useSettings();
  const { role, profile } = useAuth();
  
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  
  // Form states
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const [typeClient, setTypeClient] = useState('GARAGE');
  const [montantPaiement, setMontantPaiement] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAr = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' Ar';

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data: clientsData, error } = await supabase.from('clients').select('*').order('nom');
      if (error) {
        // Fallback ou erreur de schéma
        if (error.code === '42P01') {
          console.warn("Table clients introuvable. Veuillez exécuter le script credits_schema.sql");
          setClients([]);
          return;
        }
        throw error;
      }
      
      // Récupérer les dettes (ventes à crédit - paiements)
      const { data: ventesData } = await supabase.from('ventes').select('client_id, total, montant_paye').eq('statut_paiement', 'CREDIT');
      const { data: reglementsData } = await supabase.from('reglements_credits').select('client_id, montant');
      
      const parsed = clientsData.map((c: any) => {
        const clientVentes = ventesData?.filter((v: any) => v.client_id === c.id) || [];
        const clientReglements = reglementsData?.filter((r: any) => r.client_id === c.id) || [];
        
        const totalAchat = clientVentes.reduce((sum: number, v: any) => sum + Number(v.total), 0);
        const totalPayeLorsVente = clientVentes.reduce((sum: number, v: any) => sum + Number(v.montant_paye || 0), 0);
        const totalRembourse = clientReglements.reduce((sum: number, r: any) => sum + Number(r.montant), 0);
        
        return {
          ...c,
          total_du: totalAchat - totalPayeLorsVente - totalRembourse
        };
      });
      
      setClients(parsed);
    } catch (err: any) {
      console.error(err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setErrorMsg("Le nom est obligatoire.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from('clients').insert({
        nom: nom.trim(),
        contact: contact.trim(),
        type_client: typeClient
      });
      
      if (error) {
        if (error.code === '42P01') throw new Error("Veuillez d'abord exécuter credits_schema.sql sur votre base de données.");
        throw error;
      }
      
      setSuccessMsg("Client ajouté avec succès.");
      fetchClients();
      setTimeout(() => setIsModalOpen(false), 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    const mt = parseInt(montantPaiement.replace(/\D/g, ''));
    if (!mt || mt <= 0) {
      setErrorMsg("Montant invalide.");
      return;
    }
    if (!selectedClient) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from('reglements_credits').insert({
        client_id: selectedClient.id,
        montant: mt,
        caissier_id: profile?.id || null,
        commentaire: `Règlement comptoir par ${profile?.full_name || 'Caissier'}`
      });
      
      if (error) throw error;
      
      setSuccessMsg("Paiement enregistré avec succès.");
      fetchClients();
      setTimeout(() => setIsPayModalOpen(false), 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = clients.filter(c => 
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={s.container}>
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Garages & Clients (Crédits)</h1>
          <p style={s.pageSubtitle}>
            Suivi des comptes clients et règlements mensuels
          </p>
        </div>
        <button style={s.addBtn} onClick={() => {
          setNom(''); setContact(''); setTypeClient('GARAGE'); setErrorMsg(null); setSuccessMsg(null); setIsModalOpen(true);
        }}>
          <Plus size={16} />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div style={s.searchWrapper}>
        <Search size={16} style={s.searchIcon} />
        <input
          type="text"
          placeholder="Rechercher un garage ou client..."
          style={s.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>TYPE</th>
              <th style={s.th}>NOM DU CLIENT / GARAGE</th>
              <th style={s.th}>CONTACT</th>
              <th style={s.th}>RESTE À PAYER (CRÉDIT)</th>
              <th style={{ ...s.th, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={s.emptyCell}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={s.emptyCell}>Aucun client trouvé.</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} style={s.tr}>
                  <td style={s.td}>
                    {c.type_client === 'GARAGE' ? <Building2 size={18} color="rgba(255,255,255,0.45)"/> : <User size={18} color="rgba(255,255,255,0.45)"/>}
                  </td>
                  <td style={{ ...s.td, fontWeight: 'bold' }}>{c.nom}</td>
                  <td style={s.td}>{c.contact || '—'}</td>
                  <td style={{ ...s.td, color: (c.total_du || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {formatAr(c.total_du || 0)}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        style={{...s.actionBtn, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: '4px'}}
                        onClick={() => {
                          setSelectedClient(c); setMontantPaiement(''); setErrorMsg(null); setSuccessMsg(null); setIsPayModalOpen(true);
                        }}
                        disabled={(c.total_du || 0) <= 0}
                      >
                        <CreditCard size={14} style={{ marginRight: '6px' }} /> 
                        Encaisser
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL NOUVEAU CLIENT */}
      {isModalOpen && (
        <div style={s.modalOverlay}>
          <div style={{...s.modalCard, maxWidth: '400px'}}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Nouveau Client</h3>
              <button style={s.modalCloseBtn} onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveClient}>
              <div style={s.modalBody}>
                {errorMsg && <div style={s.alertBox}><AlertCircle size={15} style={{ marginRight: '6px' }} />{errorMsg}</div>}
                {successMsg && <div style={s.successBox}><CheckCircle2 size={15} style={{ marginRight: '6px' }} />{successMsg}</div>}
                
                <div style={s.inputContainer}>
                  <label style={s.inputLabel}>Type</label>
                  <select style={s.selectField} value={typeClient} onChange={(e) => setTypeClient(e.target.value)}>
                    <option value="GARAGE">Garage Partenaire</option>
                    <option value="PARTICULIER">Particulier Régulier</option>
                  </select>
                </div>
                
                <div style={{...s.inputContainer, marginTop: '12px'}}>
                  <label style={s.inputLabel}>Nom *</label>
                  <input required style={s.inputField} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du garage ou personne" />
                </div>
                
                <div style={{...s.inputContainer, marginTop: '12px'}}>
                  <label style={s.inputLabel}>Contact</label>
                  <input style={s.inputField} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Téléphone" />
                </div>
              </div>
              <div style={s.modalFooter}>
                <button type="button" style={s.btnAnnuler} onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" style={s.btnValider} disabled={isSubmitting}>{isSubmitting ? "..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENCAISSEMENT REGLEMENT */}
      {isPayModalOpen && selectedClient && (
        <div style={s.modalOverlay}>
          <div style={{...s.modalCard, maxWidth: '400px'}}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Encaisser un règlement</h3>
              <button style={s.modalCloseBtn} onClick={() => setIsPayModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePaiement}>
              <div style={s.modalBody}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '15px' }}>
                  Client : <strong>{selectedClient.nom}</strong><br/>
                  Reste à payer : <strong style={{ color: '#ef4444' }}>{formatAr(selectedClient.total_du || 0)}</strong>
                </p>

                {errorMsg && <div style={s.alertBox}><AlertCircle size={15} style={{ marginRight: '6px' }} />{errorMsg}</div>}
                {successMsg && <div style={s.successBox}><CheckCircle2 size={15} style={{ marginRight: '6px' }} />{successMsg}</div>}
                
                <div style={s.inputContainer}>
                  <label style={s.inputLabel}>Montant réglé (Ar) *</label>
                  <input 
                    required 
                    style={{...s.inputField, fontSize: '18px', fontWeight: 'bold'}} 
                    value={montantPaiement} 
                    onChange={(e) => setMontantPaiement(new Intl.NumberFormat('fr-FR').format(parseInt(e.target.value.replace(/\D/g,'')) || 0))} 
                  />
                </div>
              </div>
              <div style={s.modalFooter}>
                <button type="button" style={s.btnAnnuler} onClick={() => setIsPayModalOpen(false)}>Annuler</button>
                <button type="submit" style={{...s.btnValider, backgroundColor: '#10b981'}} disabled={isSubmitting}>{isSubmitting ? "..." : "Valider l'encaissement"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#ffffff', fontFamily: "'Outfit', sans-serif" },
  pageSubtitle: { fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '4px', fontWeight: 500 },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0066fe', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 102, 254, 0.25)' },
  searchWrapper: { position: 'relative', maxWidth: '450px', width: '100%' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.35)' },
  searchInput: { width: '100%', padding: '9px 12px 9px 38px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#161b22', color: '#ffffff', fontSize: '13px', outline: 'none' },
  tableWrapper: { backgroundColor: '#0d1117', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '14px 20px', fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.35)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' },
  tr: { borderBottom: '1px solid rgba(255, 255, 255, 0.03)' },
  td: { padding: '14px 20px', fontSize: '13.5px', color: '#ffffff' },
  emptyCell: { padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13.5px' },
  actionBtn: { border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalCard: { backgroundColor: '#161b22', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#ffffff' },
  modalCloseBtn: { background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.45)', cursor: 'pointer', padding: '2px' },
  modalBody: { padding: '20px', flex: 1 },
  inputContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
  inputLabel: { fontSize: '11.5px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.45)' },
  inputField: { width: '100%', backgroundColor: '#0d1117', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#ffffff', fontSize: '13.5px', outline: 'none' },
  selectField: { width: '100%', backgroundColor: '#0d1117', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#ffffff', fontSize: '13.5px', outline: 'none' },
  alertBox: { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' },
  successBox: { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)', color: '#22c55e', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: '#0d1117' },
  btnAnnuler: { backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#ffffff', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  btnValider: { backgroundColor: '#0066fe', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease' }
};
