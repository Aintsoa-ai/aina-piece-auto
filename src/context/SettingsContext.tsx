import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../utils/translations';
import type { Language } from '../utils/translations';
import { supabase } from '../services/supabaseClient';

export type Theme = 'clair' | 'sombre' | 'auto';

// Pages that employee access can be toggled by admin
export const ALL_PAGES = [
  { id: 'sales',        label: 'Ventes',           section: 'Activité' },
  { id: 'purchases',    label: 'Achats',            section: 'Activité' },
  { id: 'caisse',       label: 'Caisse',            section: 'Activité' },
  { id: 'depenses',     label: 'Dépenses',          section: 'Activité' },
  { id: 'clients',      label: 'Clients & Crédits', section: 'Activité' },
  { id: 'pieces',       label: 'Pièces',            section: 'Catalogue' },
  { id: 'stock',        label: 'Stock',             section: 'Catalogue' },
  { id: 'fournisseurs', label: 'Fournisseurs',      section: 'Catalogue' },
] as const;

export type PageId = typeof ALL_PAGES[number]['id'];

// Default: all pages enabled for employees
const DEFAULT_PERMISSIONS: Record<PageId, boolean> = {
  sales: true,
  purchases: true,
  caisse: true,
  depenses: true,
  clients: true,
  pieces: true,
  stock: true,
  fournisseurs: true,
};

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeBoutiqueId: string;
  setActiveBoutiqueId: (id: string) => void;
  isOffline: boolean;
  pagePermissions: Record<string, boolean>;
  setPagePermissions: (perms: Record<string, boolean>) => void;
  t: (key: keyof typeof translations['fr']) => string;
  appName: string;
  setAppName: (name: string) => void;
  appSubtitle: string;
  setAppSubtitle: (sub: string) => void;
  appLogoText: string;
  setAppLogoText: (logo: string) => void;
  appLogoImage: string | null;
  setAppLogoImage: (image: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize language from localStorage or browser default
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('aina_erp_lang');
    if (saved === 'fr' || saved === 'mg') return saved;
    return 'fr';
  });

  // Initialize theme from localStorage or default 'sombre'
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('aina_erp_theme');
    if (saved === 'clair' || saved === 'sombre' || saved === 'auto') return saved;
    return 'sombre';
  });

  // Active boutique for filtering/operations
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string>(() => {
    return localStorage.getItem('aina_erp_active_boutique') || '';
  });

  // Page access permissions for employees (admin only controls these)
  const [pagePermissions, setPagePermissionsState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('aina_erp_page_perms');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults in case new pages were added
        return { ...DEFAULT_PERMISSIONS, ...parsed };
      }
    } catch { /* ignore */ }
    return DEFAULT_PERMISSIONS as Record<string, boolean>;
  });

  const setPagePermissions = async (perms: Record<string, boolean>) => {
    setPagePermissionsState(perms);
    localStorage.setItem('aina_erp_page_perms', JSON.stringify(perms));
    try {
      await supabase.from('app_settings').update({ page_permissions: perms, updated_at: new Date().toISOString() }).eq('id', 'global');
    } catch (err) {
      console.error('Error saving global settings:', err);
    }
  };

  // Fetch global settings from Supabase on load
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('page_permissions').eq('id', 'global').single();
        if (data && data.page_permissions) {
          const perms = typeof data.page_permissions === 'string' ? JSON.parse(data.page_permissions) : data.page_permissions;
          const merged = { ...DEFAULT_PERMISSIONS, ...perms };
          setPagePermissionsState(merged);
          localStorage.setItem('aina_erp_page_perms', JSON.stringify(merged));
        }
      } catch (err) {
        console.error('Error fetching global settings:', err);
      }
    };
    fetchGlobalSettings();
  }, []);

  // Network state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aina_erp_lang', lang);
  };

  // Set active boutique
  const handleSetActiveBoutique = (id: string) => {
    setActiveBoutiqueId(id);
    localStorage.setItem('aina_erp_active_boutique', id);
  };

  // Set theme and apply it to document body
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('aina_erp_theme', newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    
    if (t === 'clair') {
      body.classList.add('light-theme');
    } else if (t === 'sombre') {
      body.classList.remove('light-theme');
    } else {
      // Automatic based on system
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        body.classList.remove('light-theme');
      } else {
        body.classList.add('light-theme');
      }
    }
  };

  // Listen for system theme changes if set to auto
  useEffect(() => {
    applyTheme(theme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        applyTheme('auto');
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [theme]);

  // App Branding
  const [appName, setAppNameState] = useState(() => localStorage.getItem('aina_erp_app_name') || 'AutoParts');
  const [appSubtitle, setAppSubtitleState] = useState(() => localStorage.getItem('aina_erp_app_subtitle') || 'ERP');
  const [appLogoText, setAppLogoTextState] = useState(() => localStorage.getItem('aina_erp_app_logo') || 'AP');
  const [appLogoImage, setAppLogoImageState] = useState<string | null>(() => localStorage.getItem('aina_erp_app_logo_img') || null);

  const setAppName = (v: string) => { setAppNameState(v); localStorage.setItem('aina_erp_app_name', v); };
  const setAppSubtitle = (v: string) => { setAppSubtitleState(v); localStorage.setItem('aina_erp_app_subtitle', v); };
  const setAppLogoText = (v: string) => { setAppLogoTextState(v); localStorage.setItem('aina_erp_app_logo', v); };
  const setAppLogoImage = (v: string | null) => { 
    setAppLogoImageState(v); 
    if (v) localStorage.setItem('aina_erp_app_logo_img', v);
    else localStorage.removeItem('aina_erp_app_logo_img');
  };

  // Translation helper
  const t = (key: keyof typeof translations['fr']): string => {
    const dict = translations[language];
    return (dict[key] as string) || (translations['fr'][key] as string) || String(key);
  };

  return (
    <SettingsContext.Provider value={{
      language,
      setLanguage,
      theme,
      setTheme,
      activeBoutiqueId,
      setActiveBoutiqueId: handleSetActiveBoutique,
      isOffline,
      pagePermissions,
      setPagePermissions,
      t,
      appName,
      setAppName,
      appSubtitle,
      setAppSubtitle,
      appLogoText,
      setAppLogoText,
      appLogoImage,
      setAppLogoImage
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
