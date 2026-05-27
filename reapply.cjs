const fs = require('fs');

const file = 'src/pages/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  const [boutiques, setBoutiques] = useState<Boutique[]>([]);',
  \`  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'acces' | 'systeme' | 'personnalisation'>('acces');\`
);

const tabsHeader = \`
      {/* ── TABS HEADER ─────────────── */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', paddingBottom: '0', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveSettingsTab('acces')}
          style={{
            ...s.tabBtn,
            borderBottom: activeSettingsTab === 'acces' ? '2px solid #0066fe' : '2px solid transparent',
            color: activeSettingsTab === 'acces' ? '#fff' : 'rgba(255,255,255,0.45)',
            fontWeight: activeSettingsTab === 'acces' ? '700' : '500'
          }}
        >
          <Shield size={16} />
          Accès & Boutiques
        </button>
        <button
          onClick={() => setActiveSettingsTab('systeme')}
          style={{
            ...s.tabBtn,
            borderBottom: activeSettingsTab === 'systeme' ? '2px solid #10b981' : '2px solid transparent',
            color: activeSettingsTab === 'systeme' ? '#fff' : 'rgba(255,255,255,0.45)',
            fontWeight: activeSettingsTab === 'systeme' ? '700' : '500'
          }}
        >
          <Database size={16} />
          Système & Sécurité
        </button>
        <button
          onClick={() => setActiveSettingsTab('personnalisation')}
          style={{
            ...s.tabBtn,
            borderBottom: activeSettingsTab === 'personnalisation' ? '2px solid #c084fc' : '2px solid transparent',
            color: activeSettingsTab === 'personnalisation' ? '#fff' : 'rgba(255,255,255,0.45)',
            fontWeight: activeSettingsTab === 'personnalisation' ? '700' : '500'
          }}
        >
          <SettingsIcon size={16} />
          Personnalisation
        </button>
      </div>\n\`;

content = content.replace(
  \`      {/* ── CONTRÔLE D'ACCÈS MATRICIEL ─────────────── */}\`,
  tabsHeader + \`      <div style={{ display: activeSettingsTab === 'acces' ? 'block' : 'none' }}>
      {/* ── CONTRÔLE D'ACCÈS MATRICIEL ─────────────── */}\`
);

content = content.replace(
  \`      {/* THREE-COLUMN GRID */}\`,
  \`      </div>
      {/* THREE-COLUMN GRID */}\`
);

content = content.replace(
  \`        {/* Mode Offline PWA */}\\n        <div style={s.card}>\`,
  \`        {/* Mode Offline PWA */}\\n        <div style={{ ...s.card, display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>\`
);

content = content.replace(
  \`        {/* Boutiques & Points de Vente Actifs */}\\n          <div style={s.card}>\`,
  \`        {/* Boutiques & Points de Vente Actifs */}\\n          <div style={{ ...s.card, display: activeSettingsTab === 'acces' ? 'block' : 'none' }}>\`
);

content = content.replace(
  \`          {/* ── HORAIRES DE LA BOUTIQUE & VERROUILLAGE ─────────────── */}\\n          {isAdmin && (\\n            <div style={s.card}>\`,
  \`          {/* ── HORAIRES DE LA BOUTIQUE & VERROUILLAGE ─────────────── */}\\n          {isAdmin && (\\n            <div style={{ ...s.card, display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>\`
);

content = content.replace(
  \`      {/* ── PERSONNALISATION DE L'APPLICATION ────────────────────────── */}\\n      <div style={s.card}>\`,
  \`      {/* ── PERSONNALISATION DE L'APPLICATION ────────────────────────── */}\\n      <div style={{ ...s.card, display: activeSettingsTab === 'personnalisation' ? 'block' : 'none' }}>\`
);

content = content.replace(
  \`      {/* ── SÉCURITÉ & SAUVEGARDES ─────────────── */}\`,
  \`      <div style={{ display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>
      {/* ── SÉCURITÉ & SAUVEGARDES ─────────────── */}\`
);

content = content.replace(
  \`    </div>\\n  );\\n};\\n\\nconst s: Record\`,
  \`      </div>\\n    </div>\\n  );\\n};\\n\\nconst s: Record\`
);

content = content.replace(
  \`    textTransform: 'uppercase',\\n  },\\n};\`,
  \`    textTransform: 'uppercase',\\n  },\\n  tabBtn: {\\n    background: 'none',\\n    border: 'none',\\n    padding: '0 0 12px 0',\\n    display: 'flex',\\n    alignItems: 'center',\\n    gap: '8px',\\n    cursor: 'pointer',\\n    fontSize: '14px',\\n    transition: 'all 0.2s ease',\\n  },\\n};\`
);

fs.writeFileSync(file, content, 'utf8');
