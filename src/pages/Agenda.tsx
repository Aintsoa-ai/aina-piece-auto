import React, { useState } from 'react';
import { useAgenda } from '../hooks/useAgenda';
import { AgendaStats } from './Agenda/AgendaStats';
import { AgendaList } from './Agenda/AgendaList';
import { AgendaFormModal } from './Agenda/AgendaFormModal';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export const Agenda: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { 
    movements, 
    totalEntrees, 
    totalSorties, 
    soldeCaisse, 
    expectedExpenses, 
    loading, 
    error,
    addAgendaItem
  } = useAgenda(selectedDate);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Carnet & Agenda</h2>
          <p style={styles.subtitle}>Suivez vos entrées, sorties et planifiez vos journées.</p>
        </div>
        <button style={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Ajouter à l'agenda
        </button>
      </div>

      <AgendaStats 
        totalEntrees={totalEntrees}
        totalSorties={totalSorties}
        soldeCaisse={soldeCaisse}
        expectedExpenses={expectedExpenses}
      />

      <div style={styles.dateSelector}>
        <button style={styles.iconBtn} onClick={handlePrevDay}><ChevronLeft size={20} /></button>
        <div style={styles.dateDisplay}>
          {isToday() ? "Aujourd'hui, " : ""}
          {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <button style={styles.iconBtn} onClick={handleNextDay}><ChevronRight size={20} /></button>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>Chargement des mouvements...</div>
      ) : (
        <AgendaList movements={movements} />
      )}

      {isModalOpen && (
        <AgendaFormModal 
          onClose={() => setIsModalOpen(false)}
          onSave={addAgendaItem}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#7c3aed',
    color: '#fff',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '24px',
    padding: '12px',
    backgroundColor: '#161b22',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  dateDisplay: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'capitalize',
    minWidth: '200px',
    textAlign: 'center',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
