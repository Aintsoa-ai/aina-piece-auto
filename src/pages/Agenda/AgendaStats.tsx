import React from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';

interface AgendaStatsProps {
  totalEntrees: number;
  totalSorties: number;
  soldeCaisse: number;
  expectedExpenses: number;
}

export const AgendaStats: React.FC<AgendaStatsProps> = ({ totalEntrees, totalSorties, soldeCaisse, expectedExpenses }) => {
  const formatAr = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  };

  const isWarning = expectedExpenses > soldeCaisse;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.label}>Vola Miditra (Jour)</span>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <TrendingUp size={16} />
          </div>
        </div>
        <div style={{ ...styles.amount, color: '#22c55e' }}>{formatAr(totalEntrees)}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.label}>Vola Mivoka (Jour)</span>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <TrendingDown size={16} />
          </div>
        </div>
        <div style={{ ...styles.amount, color: '#ef4444' }}>{formatAr(totalSorties)}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.label}>Caisse (Actuelle)</span>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
            <Wallet size={16} />
          </div>
        </div>
        <div style={{ ...styles.amount, color: '#38bdf8' }}>{formatAr(soldeCaisse)}</div>
      </div>

      {isWarning && (
        <div style={{ ...styles.card, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', animation: 'pulseWarning 2s infinite' }}>
          <div style={styles.header}>
            <span style={{ ...styles.label, color: '#ef4444' }}>Alerte Dépenses Demain</span>
            <div style={{ ...styles.iconBox, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ ...styles.amount, color: '#ef4444', fontSize: '16px' }}>{formatAr(expectedExpenses)} prévus</div>
          <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px' }}>Attention: le solde actuel est insuffisant.</p>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: '0.05em',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: '24px',
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
  }
};
