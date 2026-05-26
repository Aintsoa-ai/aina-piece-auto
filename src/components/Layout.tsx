import React, { useState, useEffect } from 'react';
import { initSyncListeners } from '../services/syncManager';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart2,
  Wallet,
  TrendingDown,
  Store,
  Boxes,
  Truck,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  FileSpreadsheet,
  ChevronRight,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { syncUp } from '../services/syncManager';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { profile, role, signOut } = useAuth();
  const { theme, setTheme, pagePermissions, appName, appSubtitle, appLogoText, appLogoImage } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pendingSalesCount = useLiveQuery(() => db.pending_ventes.count(), []) || 0;
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (pendingSalesCount === 0 || !navigator.onLine) return;
    setIsSyncing(true);
    await syncUp();
    setIsSyncing(false);
  };

  // Heartbeat pour le statut "En ligne" et Init Sync avec Presence
  useEffect(() => {
    if (!profile?.id) return;
    
    // Initialiser le système hors-ligne
    initSyncListeners(profile?.boutique_id || undefined);
    
    // Ping DB immédiat pour historique
    supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', profile.id).then();
    
    // Presence Channel pour suivi en temps réel instantané (Millisecondes)
    const room = supabase.channel('online-boutiques', {
      config: { presence: { key: profile.id } },
    });

    room.on('presence', { event: 'sync' }, () => {
      const state = room.presenceState();
      window.dispatchEvent(new CustomEvent('presenceUpdate', { detail: state }));
    });
    room.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      window.dispatchEvent(new CustomEvent('presenceUpdate', { detail: room.presenceState() }));
    });
    room.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      window.dispatchEvent(new CustomEvent('presenceUpdate', { detail: room.presenceState() }));
    });

    room.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await room.track({
          user_id: profile.id,
          boutique_id: profile?.boutique_id || 'admin',
          full_name: profile.full_name,
          online_at: new Date().toISOString(),
        });
      }
    });
    
    return () => {
      supabase.removeChannel(room);
    };
  }, [profile?.id, profile?.boutique_id, profile?.full_name]);

  // ─── Menu sections exactly like the reference ───────────────────────
  const menuSections = [
    {
      label: 'Activité',
      roles: ['administrateur', 'employe', 'caissier'],
      items: [
        { id: 'sales',     name: 'Ventes',    icon: ShoppingCart, roles: ['administrateur', 'employe', 'caissier'] },
        { id: 'purchases', name: 'Achats',     icon: TrendingDown, roles: ['administrateur', 'employe', 'caissier'] },
        { id: 'clients',   name: 'Clients & Crédits', icon: Users, roles: ['administrateur', 'employe', 'caissier'] },
        { id: 'caisse',    name: 'Caisse',     icon: Wallet,       roles: ['administrateur', 'employe', 'caissier'] },
        { id: 'depenses',  name: 'Dépenses',   icon: BarChart2,    roles: ['administrateur', 'employe', 'caissier'] },
      ],
    },
    {
      label: 'Catalogue',
      roles: ['administrateur', 'employe', 'caissier'],
      items: [
        { id: 'pieces',       name: 'Pièces',       icon: Boxes, roles: ['administrateur', 'employe', 'caissier'] },
        { id: 'stock',        name: 'Stock',        icon: Store, roles: ['administrateur', 'employe', 'caissier'] },
        { id: 'fournisseurs', name: 'Fournisseurs', icon: Truck, roles: ['administrateur', 'employe', 'caissier'] },
      ],
    },
    {
      label: 'Administration',
      roles: ['administrateur'],
      items: [
        { id: 'users',    name: 'Utilisateurs',  icon: Users,          roles: ['administrateur'] },
        { id: 'boutiques', name: 'Boutiques',    icon: Building2,      roles: ['administrateur'] },
        { id: 'excel',    name: 'Import Excel',  icon: FileSpreadsheet, roles: ['administrateur'] },
        { id: 'settings', name: 'Administrateur', icon: Settings,       roles: ['administrateur'] },
      ],
    },
  ];

  const userRole = role?.toLowerCase() || '';
  const isAdmin = userRole === 'administrateur';
  const isBoutique = !isAdmin;
  const displaySubtitle = isBoutique ? (profile?.full_name?.replace(/AINA PIECE /i, '') || appSubtitle) : appSubtitle;

  // Normalise current tab name for header
  const currentName = (() => {
    for (const section of menuSections) {
      const found = section.items.find(i => i.id === activeTab);
      if (found) return found.name;
    }
    if (activeTab === 'dashboard') return 'Tableau de bord';
    return 'ERP';
  })();


  const SidebarContent = () => (
    <div style={s.sidebarInner}>
      {/* Logo */}
      <div style={s.logoArea}>
        <div style={s.logoBox}>
          {appLogoImage ? (
            <img src={appLogoImage} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <span style={s.logoBoxText}>{appLogoText}</span>
          )}
        </div>
        <div>
          <div style={s.logoTitle}>{appName}</div>
          <div style={s.logoSub}>{displaySubtitle}</div>
        </div>
        {!isDesktop && (
          <button style={s.closeBtn} onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        )}
      </div>
      
      {/* Helper pour vérifier les permissions matricielles */}
      {(() => {
        const canSeePage = (pageId: string) => {
          if (isAdmin) return true;
          const profileKey = profile ? `${profile.id}_${pageId}` : null;
          const boutiqueKey = profile?.boutique_id ? `${profile.boutique_id}_${pageId}` : null;
          
          if (profileKey && profileKey in pagePermissions) return pagePermissions[profileKey];
          if (boutiqueKey && boutiqueKey in pagePermissions) return pagePermissions[boutiqueKey];
          if (pageId in pagePermissions) return pagePermissions[pageId as keyof typeof pagePermissions];
          return true;
        };
        
        return (
          <>
            {/* Dashboard link */}
            {canSeePage('dashboard') && (
              <button
                style={{
                  ...s.dashLink,
                  ...(activeTab === 'dashboard' ? s.dashLinkActive : {}),
                }}
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              >
                <LayoutDashboard size={17} />
                <span>Tableau de bord</span>
                {activeTab === 'dashboard' && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            )}

            {/* Scrollable nav */}
            <nav style={s.nav}>
              {menuSections.map(section => {
                // Show section only if user has at least one item in it
                const visibleItems = section.items.filter(item => {
                  // Role check
                  if (!item.roles.includes(userRole)) return false;
                  // Permission check
                  return canSeePage(item.id);
                });
                if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} style={s.navSection}>
              <span style={s.navSectionLabel}>{section.label}</span>
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    style={{ ...s.navItem, ...(isActive ? s.navItemActive : {}) }}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  >
                    <Icon size={17} style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.45)' }} />
                    <span>{item.name}</span>
                    {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#fff' }} />}
                  </button>
                );
              })}
            </div>
          );
        })}
            </nav>

          </>
        );
      })()}


      {/* User footer */}
      <div style={s.userFooter}>
        <div style={isBoutique ? s.boutiqueAvatar : s.userAvatar}>
          {isBoutique ? <Store size={20} /> : (profile?.full_name?.charAt(0).toUpperCase() || 'A')}
        </div>
        <div style={s.userInfo}>
          <span style={s.userName}>{profile?.full_name || 'Utilisateur'}</span>
          <span style={s.userRoleBadge}>{role || 'Admin'}</span>
        </div>
        <button style={s.logoutBtn} onClick={signOut} title="Se déconnecter">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={s.wrapper}>
      {/* ── SIDEBAR DESKTOP ───────────────────── */}
      {isDesktop && (
        <aside style={s.sidebar}>
          <SidebarContent />
        </aside>
      )}

      {/* ── SIDEBAR MOBILE OVERLAY ────────────── */}
      {!isDesktop && sidebarOpen && (
        <>
          <div style={s.overlay} onClick={() => setSidebarOpen(false)} />
          <aside style={{ ...s.sidebar, ...s.sidebarMobile }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── MAIN AREA ─────────────────────────── */}
      <div style={s.mainArea}>
        {/* Top bar */}
        <header style={s.topBar}>
          <div style={s.topBarLeft}>
            {!isDesktop && (
              <button style={s.menuBtn} onClick={() => setSidebarOpen(true)}>
                <Menu size={20} color="rgba(255,255,255,0.7)" />
              </button>
            )}
            <span style={s.topBarTitle}>{currentName}</span>
          </div>
          <div style={s.topBarRight}>
            
            {/* Sync Button */}
            <button
              style={{
                ...s.themeBtn,
                backgroundColor: pendingSalesCount > 0 ? (navigator.onLine ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)') : 'transparent',
                color: pendingSalesCount > 0 ? (navigator.onLine ? '#f59e0b' : '#ef4444') : 'rgba(255,255,255,0.4)',
                border: pendingSalesCount > 0 ? (navigator.onLine ? '1px solid #f59e0b' : '1px solid #ef4444') : '1px solid transparent',
                position: 'relative'
              }}
              onClick={handleManualSync}
              disabled={isSyncing || pendingSalesCount === 0 || !navigator.onLine}
              title={pendingSalesCount > 0 ? `${pendingSalesCount} ventes en attente de synchronisation` : 'Aucune donnée en attente'}
            >
              {isSyncing ? (
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : pendingSalesCount > 0 ? (
                <CloudOff size={16} />
              ) : (
                <Cloud size={16} />
              )}
              {pendingSalesCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5, background: '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', padding: '2px 5px'
                }}>
                  {pendingSalesCount}
                </span>
              )}
            </button>

            <button
              style={s.themeBtn}
              onClick={() => setTheme(theme === 'clair' ? 'sombre' : 'clair')}
              title={theme === 'clair' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'clair' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={s.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const SIDEBAR_W = 220;
const BG_SIDEBAR = '#0d1117';
const BG_MAIN = '#0d1117';
const ITEM_ACTIVE_BG = 'rgba(255,255,255,0.08)';
const TEXT_DIM = 'rgba(255,255,255,0.45)';
const TEXT_BRIGHT = 'rgba(255,255,255,0.9)';
const BORDER = 'rgba(255,255,255,0.07)';

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: BG_MAIN,
    color: TEXT_BRIGHT,
    fontFamily: "'Inter', sans-serif",
  },

  // ── Sidebar ──────────────────────────────
  sidebar: {
    width: SIDEBAR_W,
    minWidth: SIDEBAR_W,
    backgroundColor: BG_SIDEBAR,
    borderRight: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    overflowY: 'hidden',
    zIndex: 200,
  },
  sidebarMobile: {
    position: 'fixed' as const,
    left: 0,
    top: 0,
    height: '100vh',
    zIndex: 300,
  },
  sidebarInner: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto' as const,
  },

  // ── Logo ─────────────────────────────────
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px 16px',
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoBoxText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  logoTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 10,
    color: TEXT_DIM,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  closeBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: TEXT_DIM,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },

  // ── Dashboard link ────────────────────────
  dashLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    margin: '12px 10px 4px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: TEXT_DIM,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: 'calc(100% - 20px)',
    transition: 'background 0.15s, color 0.15s',
  },
  dashLinkActive: {
    background: ITEM_ACTIVE_BG,
    color: '#fff',
  },

  // ── Nav ──────────────────────────────────
  nav: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 0 8px',
  },
  navSection: {
    marginTop: 16,
    paddingBottom: 4,
  },
  navSectionLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    color: TEXT_DIM,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    padding: '0 16px 6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 16px',
    margin: '1px 10px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: TEXT_DIM,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: 'calc(100% - 20px)',
    transition: 'background 0.15s, color 0.15s',
  },
  navItemActive: {
    background: ITEM_ACTIVE_BG,
    color: '#fff',
  },

  // ── User footer ───────────────────────────
  userFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderTop: `1px solid ${BORDER}`,
    flexShrink: 0,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  boutiqueAvatar: {
    width: 32,
    height: 32,
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#0066fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: TEXT_BRIGHT,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRoleBadge: {
    fontSize: 10,
    color: TEXT_DIM,
    textTransform: 'capitalize' as const,
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: TEXT_DIM,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
    transition: 'color 0.15s',
    flexShrink: 0,
  },

  // ── Main area ─────────────────────────────
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: '100vh',
  },

  // ── Top bar ───────────────────────────────
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 56,
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: BG_MAIN,
    flexShrink: 0,
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: TEXT_BRIGHT,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  themeBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    color: TEXT_DIM,
    cursor: 'pointer',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },

  // ── Content ───────────────────────────────
  content: {
    flex: 1,
    padding: '28px 28px',
    overflowY: 'auto' as const,
  },

  // ── Overlay mobile ────────────────────────
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 250,
  },
};

export default Layout;
