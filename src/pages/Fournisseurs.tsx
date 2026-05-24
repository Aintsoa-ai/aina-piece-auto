import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Truck, Plus, Edit, Trash2, X, Search, Phone, MapPin } from 'lucide-react';

interface Supplier {
  id: string;
  nom: string;
  contact: string;
  adresse: string;
  pieces_fournies?: string; // description or count of items
}

export const Fournisseurs: React.FC = () => {
  const { role } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const [adresse, setAdresse] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = role === 'administrateur';

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error(err);
      // Fallback
      setSuppliers([
        { id: '1', nom: 'Sodirex Madagascar', contact: '+261 20 22 400 12', adresse: 'Ankorondrano, Antananarivo', pieces_fournies: 'Filtres, Bougies, Freinage' },
        { id: '2', nom: 'Materauto Auto Parts', contact: '+261 20 22 224 01', adresse: 'Behoririka, Antananarivo', pieces_fournies: 'Amortisseurs, Kits Embrayage' },
        { id: '3', nom: 'CFAO Motors Parts', contact: '+261 32 07 888 99', adresse: 'Alarobia, Antananarivo', pieces_fournies: 'Moteur, Direction, Optiques' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAddModal = () => {
    setEditId(null);
    setNom('');
    setContact('');
    setAdresse('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditId(supplier.id);
    setNom(supplier.nom);
    setContact(supplier.contact || '');
    setAdresse(supplier.adresse || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nom.trim()) {
      setFormError('Le nom du fournisseur est requis.');
      return;
    }

    try {
      if (editId) {
        // Update
        const { error } = await supabase
          .from('fournisseurs')
          .update({ nom, contact, adresse })
          .eq('id', editId);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('fournisseurs')
          .insert({ nom, contact, adresse });
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) return;
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.adresse?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.searchWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button style={styles.addBtn} onClick={handleOpenAddModal}>
            <Plus size={16} /> Nouveau Fournisseur
          </button>
        )}
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>NOM DU FOURNISSEUR</th>
              <th style={styles.th}>CONTACT</th>
              <th style={styles.th}>ADRESSE / EMPLACEMENT</th>
              <th style={styles.th}>CATÉGORIES DE PIÈCES</th>
              {isAdmin && <th style={{ ...styles.th, textAlign: 'right' }}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={styles.loadingCell}>Chargement...</td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={5} style={styles.emptyCell}>Aucun fournisseur trouvé.</td>
              </tr>
            ) : (
              filteredSuppliers.map(supplier => (
                <tr key={supplier.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.nameGroup}>
                      <Truck size={16} style={styles.supplierIcon} />
                      <span style={styles.supplierName}>{supplier.nom}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.contactGroup}>
                      <Phone size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <span>{supplier.contact || '—'}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.locationGroup}>
                      <MapPin size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <span>{supplier.adresse || '—'}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{supplier.pieces_fournies || 'Pièces Auto Diverses'}</span>
                  </td>
                  {isAdmin && (
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={styles.actionGroup}>
                        <button style={styles.actionBtn} onClick={() => handleOpenEditModal(supplier)} title="Modifier">
                          <Edit size={14} />
                        </button>
                        <button style={{ ...styles.actionBtn, color: '#ef4444' }} onClick={() => handleDelete(supplier.id)} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>{editId ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}</span>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              {formError && <div style={styles.error}>{formError}</div>}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom du Fournisseur</label>
                <input
                  type="text"
                  placeholder="ex: CFAO Motors Madagascar"
                  style={styles.input}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Contact (Téléphone / Email)</label>
                <input
                  type="text"
                  placeholder="ex: +261 20 22 224 01"
                  style={styles.input}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse / Emplacement</label>
                <input
                  type="text"
                  placeholder="ex: Boulevard de l'Europe, Antananarivo"
                  style={styles.input}
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {editId ? 'Enregistrer' : 'Créer Fournisseur'}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    maxWidth: '320px',
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
    padding: '8px 12px 8px 36px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#161b22',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
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
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
  },
  nameGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  supplierIcon: {
    color: '#a78bfa',
  },
  supplierName: {
    fontWeight: 500,
    color: '#ffffff',
  },
  contactGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  locationGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    color: '#a78bfa',
    fontSize: '11px',
    fontWeight: 500,
  },
  actionGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCell: {
    padding: '40px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
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
    backgroundColor: '#2563eb',
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
