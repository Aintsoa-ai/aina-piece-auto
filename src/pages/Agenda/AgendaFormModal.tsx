import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AgendaItem } from '../../types/agenda';

interface AgendaFormModalProps {
  onClose: () => void;
  onSave: (item: Partial<AgendaItem>) => Promise<boolean>;
}

export const AgendaFormModal: React.FC<AgendaFormModalProps> = ({ onClose, onSave }) => {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [datePrevue, setDatePrevue] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'TACHE' | 'ENTREE_PREVUE' | 'DEPENSE_PREVUE'>('TACHE');
  const [montant, setMontant] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatNum = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('fr-FR').format(parseInt(digits, 10)).replace(/\u202f/g, ' ');
  };

  const parseNum = (val: string) => {
    return parseInt(val.replace(/\D/g, ''), 10) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onSave({
      titre,
      description,
      date_prevue: datePrevue,
      type,
      montant: parseNum(montant),
      statut: 'A_FAIRE'
    });
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Ajouter à l'Agenda</h3>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Titre / Motif</label>
            <input 
              style={styles.input} 
              required 
              value={titre} 
              onChange={e => setTitre(e.target.value)} 
              placeholder="Ex: Payer loyer, Achat marchandise..." 
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Type</label>
            <select style={styles.select} value={type} onChange={e => setType(e.target.value as any)}>
              <option value="TACHE">Tâche à faire</option>
              <option value="ENTREE_PREVUE">Entrée prévue</option>
              <option value="DEPENSE_PREVUE">Dépense prévue</option>
            </select>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Date prévue</label>
            <input 
              type="date" 
              style={styles.input} 
              required 
              value={datePrevue} 
              onChange={e => setDatePrevue(e.target.value)} 
            />
          </div>

          {(type === 'ENTREE_PREVUE' || type === 'DEPENSE_PREVUE') && (
            <div style={styles.group}>
              <label style={styles.label}>Montant (Ar)</label>
              <input 
                style={styles.input} 
                required 
                value={montant} 
                onChange={e => setMontant(formatNum(e.target.value))} 
                placeholder="0" 
              />
            </div>
          )}

          <div style={styles.group}>
            <label style={styles.label}>Détails (Optionnel)</label>
            <textarea 
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>Annuler</button>
            <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#161b22',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: '#0d1117',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: '#0d1117',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    appearance: 'none',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
  },
  submitBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#7c3aed',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  }
};
