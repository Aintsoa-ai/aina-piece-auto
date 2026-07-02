import React from 'react';
import type { DailyMovement } from '../../types/agenda';
import { ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react';

interface AgendaListProps {
  movements: DailyMovement[];
}

export const AgendaList: React.FC<AgendaListProps> = ({ movements }) => {
  const formatAr = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  };

  if (movements.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <CalendarIcon size={48} color="rgba(255,255,255,0.1)" />
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>Aucun mouvement prévu ou enregistré ce jour.</p>
      </div>
    );
  }

  return (
    <div style={styles.listContainer}>
      {movements.map((m) => {
        const isEntree = m.type === 'ENTREE';
        const isSortie = m.type === 'SORTIE';
        const isAgenda = m.type === 'AGENDA';
        
        let color = '#a78bfa'; // default
        let bgColor = 'rgba(167, 139, 250, 0.1)';
        let Icon = CalendarIcon;

        if (isEntree) {
          color = '#22c55e';
          bgColor = 'rgba(34, 197, 94, 0.1)';
          Icon = ArrowUpRight;
        } else if (isSortie) {
          color = '#ef4444';
          bgColor = 'rgba(239, 68, 68, 0.1)';
          Icon = ArrowDownRight;
        }

        return (
          <div key={m.id} style={styles.card}>
            <div style={{ ...styles.iconBox, backgroundColor: bgColor, color }}>
              <Icon size={18} />
            </div>
            
            <div style={styles.cardContent}>
              <h4 style={styles.motif}>{m.motif}</h4>
              <div style={styles.details}>
                <span style={styles.time}>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isAgenda && (
                  <span style={{ 
                    ...styles.badge, 
                    backgroundColor: m.statut === 'TERMINE' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                    color: m.statut === 'TERMINE' ? '#22c55e' : '#f59e0b'
                  }}>
                    {m.statut === 'TERMINE' ? <CheckCircle size={10} style={{ marginRight: '4px' }}/> : <Clock size={10} style={{ marginRight: '4px' }}/>}
                    {m.statut}
                  </span>
                )}
              </div>
            </div>

            <div style={{ ...styles.amount, color }}>
              {isEntree ? '+' : isSortie ? '-' : ''}{formatAr(m.montant)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  emptyContainer: {
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#161b22',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#161b22',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
  },
  cardContent: {
    flex: 1,
  },
  motif: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '4px',
  },
  details: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  time: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  amount: {
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
  }
};
