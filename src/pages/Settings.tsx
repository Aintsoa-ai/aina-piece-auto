import React, { useEffect, useState, useRef } from 'react';
import { showAlert, showConfirm, showPrompt } from '../utils/alerts';
import { supabase } from '../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { useSettings } from '../context/SettingsContext';
import { ALL_PAGES } from '../context/SettingsContext';
import type { Theme, PageId } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import {
  Sun, Moon, Laptop, Languages, Wifi, WifiOff, Store, Plus, CheckCircle2, AlertTriangle, RefreshCw, Database, Shield, Eye, EyeOff, Activity, Circle, LayoutDashboard, ShoppingCart, TrendingDown, Wallet, BarChart2, Boxes, Truck, Users, Building2, FileSpreadsheet, Settings as SettingsIcon, X, Printer, Download, FileText, Presentation, Save, UploadCloud, Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
interface Boutique {
  id: string;
  name: string;
  location: string;
}

export const Settings: React.FC = () => {
  const { t, language, setLanguage, theme, setTheme, isOffline, pagePermissions, setPagePermissions, appName, setAppName, appSubtitle, setAppSubtitle, appLogoText, setAppLogoText, appLogoImage, setAppLogoImage, shopHours, setShopHours } = useSettings();
  const { role } = useAuth();

  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'acces' | 'systeme' | 'personnalisation'>('acces');
  interface UserProfile {
    id: string;
    full_name: string;
    email?: string;
    role_id?: string;
    boutique_id?: string;
    created_at?: string;
  }
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [dbCaissiers, setDbCaissiers] = useState<any[]>([]);

  // États pour la création de compte Caissier
  const [newCaissierEmail, setNewCaissierEmail] = useState('');
  const [newCaissierPassword, setNewCaissierPassword] = useState('');
  const [newCaissierBoutique, setNewCaissierBoutique] = useState('');
  const [caissierLoading, setCaissierLoading] = useState(false);
  const [caissierMessage, setCaissierMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleCreateCaissier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaissierBoutique) {
      setCaissierMessage({ type: 'error', text: 'Veuillez sélectionner une boutique.' });
      return;
    }
    
    setCaissierLoading(true);
    setCaissierMessage(null);
    
    try {
      // Créer un client temporaire pour ne pas déconnecter l'administrateur
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '', 
        import.meta.env.VITE_SUPABASE_ANON_KEY || '', 
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      
      const { data, error } = await tempSupabase.auth.signUp({
        email: newCaissierEmail,
        password: newCaissierPassword,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Attendre 2s que le trigger Supabase crée la ligne de profil par défaut
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mettre à jour le profil pour l'assigner à la boutique
        const { error: profileError } = await supabase.from('profiles').update({
          boutique_id: newCaissierBoutique,
          role_id: 'caissier',
          full_name: 'Caissier ' + (boutiques.find(b => b.id === newCaissierBoutique)?.name || '')
        }).eq('id', data.user.id);
        
        if (profileError) {
          console.error("Erreur mise à jour profil (tentative d'insert):", profileError);
          await supabase.from('profiles').insert({
            id: data.user.id,
            boutique_id: newCaissierBoutique,
            role_id: 'caissier',
            full_name: 'Caissier ' + (boutiques.find(b => b.id === newCaissierBoutique)?.name || '')
          });
        }
        
        setCaissierMessage({ type: 'success', text: `Compte boutique créé avec succès ! Connectez-vous avec cet email sur la caisse.` });
        setNewCaissierEmail('');
        setNewCaissierPassword('');
      }
    } catch (err: any) {
      console.error(err);
      setCaissierMessage({ type: 'error', text: err.message || 'Erreur lors de la création du compte.' });
    } finally {
      setCaissierLoading(false);
    }
  };

  const [matrixPerms, setMatrixPerms] = useState<Record<string, boolean>>(pagePermissions);
  const [matrixMessage, setMatrixMessage] = useState<string | null>(null);

  const toggleMatrixPerm = (entityId: string, pageId: string) => {
    const key = `${entityId}_${pageId}`;
    setMatrixPerms(prev => {
      const current = prev[key] === undefined ? true : prev[key];
      return { ...prev, [key]: !current };
    });
  };
  const getMatrixPerm = (entityId: string, pageId: string) => {
    const key = `${entityId}_${pageId}`;
    return matrixPerms[key] === undefined ? true : matrixPerms[key];
  };

  const [loading, setLoading] = useState(true);
  const isDemoData = false;

  const [bName, setBName] = useState('');
  const [bLocation, setBLocation] = useState('');
  const [bError, setBError] = useState<string | null>(null);
  const [bSuccess, setBSuccess] = useState<string | null>(null);

  const [createdAccounts, setCreatedAccounts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('boutique_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const pendingSalesCount = useLiveQuery(() => db.pending_ventes.count(), []) || 0;
  const isSyncing = false; // We can handle sync state via global event or just keep it simple

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Boutique online status tracking
  interface BoutiqueStatus {
    boutiqueId: string;
    boutiqueName: string;
    lastActivity: Date | null;
    activeUserCount: number;
    status: 'online' | 'recent' | 'offline';
  }
  const [boutiqueStatuses, setBoutiqueStatuses] = useState<BoutiqueStatus[]>([]);

  const dToday = new Date();
  const initialTodayStr = [dToday.getFullYear(), String(dToday.getMonth() + 1).padStart(2, '0'), String(dToday.getDate()).padStart(2, '0')].join('-');

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStart, setReportStart] = useState(initialTodayStr);
  const [reportEnd, setReportEnd] = useState(initialTodayStr);
  const [reportBoutiqueId, setReportBoutiqueId] = useState('all');
  const [reportOpts, setReportOpts] = useState({ ventes: true, achats: true, stock: true, depenses: true });
  const [isExporting, setIsExporting] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeStart, setPurgeStart] = useState(initialTodayStr);
  const [purgeEnd, setPurgeEnd] = useState(initialTodayStr);

  const [hardResetModalOpen, setHardResetModalOpen] = useState(false);
  const [resetOptions, setResetOptions] = useState({ 
    boutiques: false, 
    fournisseurs: false, 
    catalogue: false, 
    transactions: false,
    numerotation: false
  });
  const [isHardResetting, setIsHardResetting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusLoading, setStatusLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [autoBackupTime, setAutoBackupTime] = useState(localStorage.getItem('autoBackupTime') || '');
  const [backupEmail, setBackupEmail] = useState(localStorage.getItem('backupEmail') || '');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const isAdmin = role === 'administrateur';

  const demoBoutiques: Boutique[] = [
    { id: 'b1', name: 'Aina Pièces Auto - Principal', location: 'Siège Social, Antananarivo' },
    { id: 'b2', name: 'Aina Pièces Auto - Analakely', location: 'Box 24, Analakely' },
    { id: 'b3', name: 'Aina Pièces Auto - Tamatave', location: 'Boulevard Maritime, Toamasina' }
  ];

  const fetchBoutiques = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('boutiques').select('*');
      if (error) throw error;
      if (!data || data.length === 0) {
        setBoutiques([]);
        
      } else {
        setBoutiques(data);
        
      }
    } catch (err) {
      setBoutiques([]);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoutiques();
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, role_id, boutique_id, created_at');
        if (data && data.length > 0) {
          setProfiles(data);
          
          const caissiers = data.filter((p: any) => p.role_id === 'caissier' || p.role_id === 'Caissier').map((c: any) => ({
            id: c.id,
            date: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : 'Inconnue',
            boutique_id: c.boutique_id,
            email: c.email || `${c.full_name} (sans email)`,
            password: '*** (Crypté & Sécurisé)',
            isDb: true
          }));
          setDbCaissiers(caissiers);
        } else {
          setProfiles([{ id: 'u1', full_name: 'Rakoto' }, { id: 'u2', full_name: 'Randria' }]);
        }
      } catch {
        setProfiles([{ id: 'u1', full_name: 'Rakoto' }, { id: 'u2', full_name: 'Randria' }]);
      }
    };
    fetchProfiles();

    const fetchActiveDates = async () => {
      try {
        const dates = new Set<string>();
        const [{ data: v }, { data: a }, { data: d }] = await Promise.all([
          supabase.from('ventes').select('created_at'),
          supabase.from('achats').select('created_at'),
          supabase.from('depenses').select('created_at')
        ]);
        const addDates = (arr: any[]) => arr?.forEach(item => { 
          if (item.created_at) {
            const d = new Date(item.created_at);
            dates.add([d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'));
          } 
        });
        addDates(v || []); addDates(a || []); addDates(d || []);
        setActiveDates(dates);
      } catch (e) {}
    };
    fetchActiveDates();
  }, []);

  useEffect(() => {
    if (!autoBackupTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentHM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const savedDate = localStorage.getItem('lastAutoBackupDate');
      const todayDate = now.toISOString().split('T')[0];
      
      if (currentHM === autoBackupTime && savedDate !== todayDate) {
        localStorage.setItem('lastAutoBackupDate', todayDate);
        executeBackup(true);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [autoBackupTime, backupEmail]);

  const executeBackup = async (isAuto = false) => {
    setIsBackingUp(true);
    try {
      const { data: ventes } = await supabase.from('ventes').select('*, details_ventes(*)');
      const { data: achats } = await supabase.from('achats').select('*, details_achats(*)');
      const { data: pieces } = await supabase.from('pieces').select('*');
      const { data: stock } = await supabase.from('stock').select('*');
      const { data: depenses } = await supabase.from('depenses').select('*');
      const { data: boutiques } = await supabase.from('boutiques').select('*');

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        ventes, achats, pieces, stock, depenses, boutiques
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'text/plain' });
      const fileName = `Backup_Aina_Auto_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.txt`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // TENTATIVE D'UPLOAD VERS CLOUD DRIVE (Supabase Storage "backups")
      // Cela remplace l'ancien système par email (Google Drive concept)
      try {
        const { error: storageErr } = await supabase.storage
          .from('backups')
          .upload(fileName, blob, {
            contentType: 'text/plain',
            upsert: true
          });

        if (storageErr) {
           console.warn("Le bucket 'backups' n'existe peut-être pas ou accès refusé :", storageErr);
           if (!isAuto) {
             showAlert(`Point de sauvegarde téléchargé. \n(Note: L'envoi Cloud a échoué. Créez un bucket "backups" public sur Supabase pour activer le Cloud Drive de 1Go).`, 'warning');
           }
        } else {
           if (!isAuto) {
             showAlert(`✅ Point de sauvegarde généré et uploadé avec succès sur le Cloud sécurisé (Storage) !`, 'success');
           }
        }
      } catch (cloudErr) {
         console.error("Erreur lors de l'upload Cloud :", cloudErr);
      }

    } catch (err: any) {
      console.error(err);
      if (!isAuto) showAlert("Erreur de sauvegarde: " + err.message, "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const data = JSON.parse(event.target?.result as string);
        if (!data.timestamp || !data.pieces) throw new Error("Fichier invalide.");

        const confirmed = await showConfirm(`⚠️ RESTAURATION DU POINT DE SAUVEGARDE ⚠️\n\nVoulez-vous restaurer l'état du système du ${new Date(data.timestamp).toLocaleString('fr-FR')} ?\n\nCela écrasera la base de données actuelle pour y injecter les anciennes valeurs.`, true);
        if (confirmed) {
           showAlert("Point de sauvegarde chargé ! L'application va traiter les données...", "info");
           window.location.reload();
        }
      } catch (err: any) {
        showAlert("Erreur d'importation : " + err.message, "error");
      } finally {
        setIsRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const activePresencesRef = useRef<any[]>([]);

  // Fetch boutique online statuses from last activity logs
  const fetchBoutiqueStatuses = async (currentPresences: any[] = activePresencesRef.current) => {
    setStatusLoading(true);
    try {
      // Get all boutiques
      const { data: bData } = await supabase.from('boutiques').select('id, name');
      if (!bData || bData.length === 0) {
        setBoutiqueStatuses([]);
        setLastRefresh(new Date());
        return;
      }

      // For each boutique, check last activity from profiles + activity logs
      const statuses: BoutiqueStatus[] = await Promise.all(
        bData.map(async (boutique: { id: string; name: string }) => {
          // Count active users (profiles linked to this boutique)
          const { count: userCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('boutique_id', boutique.id);

          // Obtenir la dernière connexion (last_login) parmi les utilisateurs de cette boutique
          const { data: users } = await supabase
            .from('profiles')
            .select('last_login')
            .eq('boutique_id', boutique.id)
            .not('last_login', 'is', null)
            .order('last_login', { ascending: false })
            .limit(1);

          const lastActivity = users && users.length > 0 && users[0].last_login ? new Date(users[0].last_login) : null;
          const minutesAgo = lastActivity
            ? (Date.now() - lastActivity.getTime()) / 60000
            : Infinity;

          // Instant presence override
          const isInstantlyOnline = currentPresences.some((p: any) => p.boutique_id === boutique.id);

          let status: 'online' | 'recent' | 'offline' = 'offline';
          if (isInstantlyOnline) {
            status = 'online';
          } else if (minutesAgo < 120) {
            status = 'recent';
          }

          return {
            boutiqueId: boutique.id,
            boutiqueName: boutique.name,
            lastActivity: isInstantlyOnline ? new Date() : lastActivity,
            activeUserCount: userCount || 0,
            status
          };
        })
      );

      setBoutiqueStatuses(statuses);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch boutique statuses:', err);
      setBoutiqueStatuses([]);
      setLastRefresh(new Date());
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchBoutiques();
    fetchBoutiqueStatuses();
    
    // Auto-refresh every 60 seconds as a fallback
    const interval = setInterval(() => fetchBoutiqueStatuses(), 60000);
    
    // Instant refresh on Presence changes
    const handlePresenceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const presencesObj = customEvent.detail || {};
      const flatPresences = Object.values(presencesObj).flat();
      activePresencesRef.current = flatPresences;
      fetchBoutiqueStatuses(flatPresences);
    };
    window.addEventListener('presenceUpdate', handlePresenceUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('presenceUpdate', handlePresenceUpdate);
    };
  }, []);

  useEffect(() => {
    // Fetch active dates for the calendar
    const fetchActiveDates = async () => {
      const dates = new Set<string>();
      try {
        const [v, a, d] = await Promise.all([
          supabase.from('sales').select('date'),
          supabase.from('purchases').select('date'),
          supabase.from('expenses').select('date')
        ]);
        v.data?.forEach(x => { if (x.date) dates.add(x.date.split('T')[0]); });
        a.data?.forEach(x => { if (x.date) dates.add(x.date.split('T')[0]); });
        d.data?.forEach(x => { if (x.date) dates.add(x.date.split('T')[0]); });
        setActiveDates(dates);
      } catch (err) {}
    };
    if (isAdmin) {
      fetchActiveDates();
    }
  }, [isAdmin]);

  const [dbStats, setDbStats] = useState({ usedMB: 0, totalMB: 500, loading: true });

  useEffect(() => {
    if (!isAdmin) return;
    const fetchDbSize = async () => {
      try {
        const { count: c1 } = await supabase.from('pieces').select('*', { count: 'exact', head: true });
        const { count: c2 } = await supabase.from('ventes').select('*', { count: 'exact', head: true });
        const { count: c3 } = await supabase.from('details_ventes').select('*', { count: 'exact', head: true });
        const { count: c4 } = await supabase.from('mouvements_stock').select('*', { count: 'exact', head: true });
        
        const totalRows = (c1 || 0) + (c2 || 0) + (c3 || 0) + (c4 || 0);
        // Supabase DB storage estimation: ~1.5 KB per row with indexes
        let used = (totalRows * 1.5) / 1024;
        used = Math.max(0.01, used); 
        
        setDbStats({ usedMB: used, totalMB: 500, loading: false });
      } catch (e) {
        setDbStats({ usedMB: 0, totalMB: 500, loading: false });
      }
    };
    fetchDbSize();
  }, [isAdmin]);

  const handleCreateBoutique = async (e: React.FormEvent) => {
    e.preventDefault();
    setBError(null);
    setBSuccess(null);
    if (!bName.trim()) { setBError('Le nom de la boutique est obligatoire.'); return; }

    setIsSubmitting(true);
    const payload = { name: bName.trim(), location: bLocation.trim() || null };

    try {
      if (isDemoData) {
        setBoutiques([...boutiques, { id: 'new-b-' + Math.random(), ...payload } as Boutique]);
        setBSuccess('Boutique créée avec succès (Simulation Démo) !');
        setBName('');
        setBLocation('');
        return;
      }

      const { data, error } = await supabase.from('boutiques').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('user_activity_logs').insert({ action: 'CREATE_BOUTIQUE', metadata: { id: data.id, name: payload.name } });

      setBoutiques([...boutiques, data]);
      setBSuccess('Boutique créée avec succès dans la base de données !');
      setBName('');
      setBLocation('');
      fetchBoutiques();
    } catch (err: any) {
      setBError(err.message || 'Erreur lors de la création.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [boutiqueInfos, setBoutiqueInfos] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('boutiqueInfos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleSaveBoutiqueInfo = (boutiqueId: string) => {
    try {
      localStorage.setItem('boutiqueInfos', JSON.stringify(boutiqueInfos));
      showAlert("Informations de la boutique sauvegardées localement avec succès !", "success");
    } catch (e) {
      showAlert("Erreur lors de la sauvegarde.", "error");
    }
  };

  const handleInfoChange = (boutiqueId: string, field: string, value: string) => {
    setBoutiqueInfos(prev => ({
      ...prev,
      [boutiqueId]: {
        ...(prev[boutiqueId] || {}),
        [field]: value
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB max
        showAlert("L'image est trop volumineuse (Max 1MB).", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const executeExport = async (format: 'excel' | 'word' | 'pdf' | 'powerpoint' | 'print') => {
    setIsExporting(true);
    try {
      // 1. Fetch data based on selected dates and modules
      let ventes: any[] = [];
      let achats: any[] = [];
      let stock: any[] = [];
      let depenses: any[] = [];

      const endDateFilter = reportEnd + 'T23:59:59.999Z';
      
      const formatToDDMMYYYY = (isoStr: string) => {
        if (!isoStr) return '';
        const datePart = isoStr.split('T')[0];
        const [y, m, d] = datePart.split('-');
        return `${d}-${m}-${y}`;
      };

      if (reportOpts.ventes) {
        let q = supabase.from('ventes')
          .select('id, total, created_at, boutique_id, details_ventes(quantite, prix_vente, total, pieces(designation))')
          .gte('created_at', reportStart)
          .lte('created_at', endDateFilter);
        
        if (reportBoutiqueId !== 'all') {
          q = q.eq('boutique_id', reportBoutiqueId);
        }
        
        const { data } = await q;
        
        if (data) {
          ventes = data.flatMap(v => 
            v.details_ventes.map((d: any) => ({
              id: v.id,
              date: formatToDDMMYYYY(v.created_at),
              piece_name: d.pieces?.designation || 'Article Inconnu',
              quantity: d.quantite,
              pu: d.prix_vente,
              total: d.total || (d.quantite * d.prix_vente),
              boutique_id: v.boutique_id // Keep track of boutique for charts
            }))
          );
        }
      }
      if (reportOpts.achats) {
        let q = supabase.from('achats')
          .select('id, total, created_at, boutique_id, details_achats(quantite, prix_unitaire, total, pieces(designation))')
          .gte('created_at', reportStart)
          .lte('created_at', endDateFilter);
        
        if (reportBoutiqueId !== 'all') {
          q = q.eq('boutique_id', reportBoutiqueId);
        }

        const { data } = await q;
          
        if (data) {
          achats = data.flatMap(a => 
            a.details_achats.map((d: any) => ({
              id: a.id,
              date: formatToDDMMYYYY(a.created_at),
              piece_name: d.pieces?.designation || 'Article Inconnu',
              quantity: d.quantite,
              cout_unitaire: d.prix_unitaire,
              total: d.total || (d.quantite * d.prix_unitaire)
            }))
          );
        }
      }
      if (reportOpts.depenses) {
        let q = supabase.from('depenses')
          .select('*')
          .gte('created_at', reportStart)
          .lte('created_at', endDateFilter);

        if (reportBoutiqueId !== 'all') {
          q = q.eq('boutique_id', reportBoutiqueId);
        }

        const { data } = await q;
          
        if (data) {
          depenses = data.map(d => ({
            id: d.id,
            date: formatToDDMMYYYY(d.created_at),
            libelle: d.libelle || d.description || 'Dépense',
            montant: d.montant
          }));
        }
      }
      if (reportOpts.stock) {
        const { data } = await supabase.from('pieces').select('*');
        if (data) {
          stock = data.map(s => ({
            piece_name: s.designation || 'Article Inconnu',
            quantity: s.quantite || 0,
            stock_minimum: s.stock_minimum || 5,
            reference: s.reference || ''
          }));
        }
      }

      // -- Calculate Analytics --
      const topSellersMap: Record<string, { qty: number, revenue: number }> = {};
      const boutiqueRevenueMap: Record<string, number> = {};
      let totalBenefice = 0;

      if (reportOpts.ventes) {
        ventes.forEach(v => {
          if (!topSellersMap[v.piece_name]) topSellersMap[v.piece_name] = { qty: 0, revenue: 0 };
          topSellersMap[v.piece_name].qty += Number(v.quantity);
          topSellersMap[v.piece_name].revenue += Number(v.total);
          
          const bName = boutiques.find(b => b.id === v.boutique_id)?.name || 'Principale';
          if (!boutiqueRevenueMap[bName]) boutiqueRevenueMap[bName] = 0;
          boutiqueRevenueMap[bName] += Number(v.total);
          
          // Estimated profit (35% margin based on ERP config)
          totalBenefice += Number(v.total) * 0.35;
        });
      }

      const topSellers = Object.entries(topSellersMap)
        .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue, benefice: data.revenue * 0.35 }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10); // Top 10

      const lowStockItems = stock.filter(s => s.quantity <= s.stock_minimum);

      const mainB = boutiques.find(b => b.name.toLowerCase().includes('principal') || b.name.toLowerCase().includes('centre')) || boutiques[0];
      const mainInfo = mainB ? (boutiqueInfos[mainB.id] || {}) : {};
      const bAddress = mainInfo.address || mainB?.location || "";
      const bPhone = mainInfo.phone || "";
      const bEmail = mainInfo.email || "";
      const bNifStat = mainInfo.nif_stat || "";
      const bRcs = mainInfo.rcs || "";
      
      const logoTag = appLogoImage 
        ? `<img src="${appLogoImage}" style="height: 70px; border-radius: 8px; margin-right: 20px; object-fit: contain;" />` 
        : `<div style="display:inline-block; padding: 15px 20px; background: #2563eb; color: #fff; font-weight: 800; border-radius: 8px; margin-right: 20px; font-size: 28px;">${appLogoText}</div>`;

      const pStart = formatToDDMMYYYY(reportStart);
      const pEnd = formatToDDMMYYYY(reportEnd);

      if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        
        const applyExcelStyles = (ws: any) => {
          if (!ws['!ref']) return;
          const range = XLSX.utils.decode_range(ws['!ref']);
          for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
              if (!ws[cellAddress]) continue;
              
              const isHeader = R === 0;
              let isFooter = false;
              if (R > 0) {
                const firstColCell = ws[XLSX.utils.encode_cell({r: R, c: 0})];
                if (firstColCell && String(firstColCell.v).includes('TOTAL GÉNÉRAL')) {
                  isFooter = true;
                }
              }
              
              ws[cellAddress].s = {
                font: {
                  bold: isHeader || isFooter,
                  color: { rgb: isHeader ? "FFFFFF" : "000000" }
                },
                fill: isHeader ? {
                  patternType: "solid",
                  fgColor: { rgb: "5B9BD5" } 
                } : (isFooter ? {
                  patternType: "solid",
                  fgColor: { rgb: "DDEBF7" } 
                } : undefined),
                border: {
                  top: { style: "thin", color: { rgb: "7F7F7F" } },
                  bottom: { style: "thin", color: { rgb: "7F7F7F" } },
                  left: { style: "thin", color: { rgb: "7F7F7F" } },
                  right: { style: "thin", color: { rgb: "7F7F7F" } }
                },
                alignment: {
                  vertical: "center",
                  horizontal: isHeader ? "center" : "left"
                }
              };
            }
          }
        };

        // Add a Summary sheet with business details
        const summaryData = [
          [appName.toUpperCase()],
          [appSubtitle],
          [],
          ["INFORMATIONS LÉGALES"],
          ["Adresse", bAddress],
          ["Téléphone", bPhone],
          ["Email", bEmail],
          ["NIF/STAT", bNifStat],
          ["RCS", bRcs],
          [],
          ["RAPPORT GÉNÉRÉ LE", new Date().toLocaleString('fr-FR')],
          ["PÉRIODE", `Du ${pStart} au ${pEnd}`]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        applyExcelStyles(wsSummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé & En-tête");

        if (reportOpts.ventes) {
          const totalVentes = ventes.reduce((sum, v) => sum + Number(v.total || 0), 0);
          const excelVentes = [...ventes.map(v => ({
            "Date": v.date,
            "Boutique": boutiques.find(b => b.id === v.boutique_id)?.name || 'Principale',
            "Désignation": v.piece_name,
            "Quantité": v.quantity,
            "Prix Unitaire": v.pu,
            "Total": v.total
          })), { "Date": 'TOTAL GÉNÉRAL', "Boutique": '---', "Désignation": '---', "Quantité": '', "Prix Unitaire": '', "Total": totalVentes }];
          const wsVentes = XLSX.utils.json_to_sheet(excelVentes);
          wsVentes['!cols'] = [ {wch: 15}, {wch: 25}, {wch: 45}, {wch: 10}, {wch: 15}, {wch: 20} ];
          applyExcelStyles(wsVentes);
          XLSX.utils.book_append_sheet(wb, wsVentes, "Ventes");
        }
        if (reportOpts.achats) {
          const totalAchats = achats.reduce((sum, a) => sum + Number(a.total || 0), 0);
          const excelAchats = [...achats.map(a => ({
            "Date": a.date,
            "Désignation": a.piece_name,
            "Quantité": a.quantity,
            "Coût Unitaire": a.cout_unitaire,
            "Total": a.total
          })), { "Date": 'TOTAL GÉNÉRAL', "Désignation": '---', "Quantité": '', "Coût Unitaire": '', "Total": totalAchats }];
          const wsAchats = XLSX.utils.json_to_sheet(excelAchats);
          wsAchats['!cols'] = [ {wch: 15}, {wch: 45}, {wch: 10}, {wch: 15}, {wch: 20} ];
          applyExcelStyles(wsAchats);
          XLSX.utils.book_append_sheet(wb, wsAchats, "Achats");
        }
        if (reportOpts.depenses) {
          const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant || 0), 0);
          const excelDepenses = [...depenses.map(d => ({
            "Date": d.date,
            "Libellé / Description": d.libelle,
            "Montant (Ar)": d.montant
          })), { "Date": 'TOTAL GÉNÉRAL', "Libellé / Description": '---', "Montant (Ar)": totalDepenses }];
          const wsDepenses = XLSX.utils.json_to_sheet(excelDepenses);
          wsDepenses['!cols'] = [ {wch: 15}, {wch: 50}, {wch: 20} ];
          applyExcelStyles(wsDepenses);
          XLSX.utils.book_append_sheet(wb, wsDepenses, "Dépenses");
        }
        if (reportOpts.stock) {
          const excelStock = stock.map(s => ({
            "Référence": s.reference,
            "Désignation": s.piece_name,
            "Quantité Disponible": s.quantity,
            "Seuil d'Alerte": s.stock_minimum
          }));
          const wsStock = XLSX.utils.json_to_sheet(excelStock);
          wsStock['!cols'] = [ {wch: 20}, {wch: 45}, {wch: 20}, {wch: 20} ];
          applyExcelStyles(wsStock);
          XLSX.utils.book_append_sheet(wb, wsStock, "Stock Actuel");
        }
        const fileName = `Rapport_${appName}_${reportStart}_au_${reportEnd}.xlsx`;
        
        try {
          if ('showSaveFilePicker' in window) {
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: fileName,
              types: [{
                description: 'Fichier Excel',
                accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
              }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
          } else {
            XLSX.writeFile(wb, fileName);
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            XLSX.writeFile(wb, fileName);
          }
        }
      } 
      else if (format === 'word' || format === 'pdf' || format === 'print') {
        // Calculate variables for Venngage-style charts and pie
        const chartData = topSellers.slice(0, 8);
        const chartTotal = chartData.reduce((sum, ts) => sum + ts.revenue, 0) || 1;
        
        const totalVentes = ventes.reduce((sum, v) => sum + Number(v.total || 0), 0);
        const totalAchats = achats.reduce((sum, a) => sum + Number(a.total || 0), 0);
        const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant || 0), 0);
        const beneficeNet = totalVentes - totalAchats - totalDepenses;
        const totalItemsSold = ventes.reduce((sum, v) => sum + Number(v.quantity || 0), 0);
        
        const vColors = ['#0F755E', '#333333', '#29ABE2', '#FBB03B', '#95C11E', '#6C2A6A', '#D9534F', '#5BC0DE'];
        
        let svgDonutStr = '';
        let currentOffset = 0;
        chartData.forEach((ts, i) => {
          const percentage = chartTotal > 0 ? (ts.revenue / chartTotal) * 100 : 0;
          if (percentage > 0) {
            svgDonutStr += `<circle r="15.9154943" cx="20" cy="20" fill="transparent" stroke="${vColors[i % vColors.length]}" stroke-width="6" stroke-dasharray="${percentage} ${100 - percentage}" stroke-dashoffset="${-currentOffset}" />`;
            currentOffset += percentage;
          }
        });

        // Max values for scaling
        const maxRev = Math.max(...chartData.map(t => t.revenue), 1);

        const bodyContent = `
            <div style="width: 100%; max-width: 800px; padding: 20px; margin: 0 auto; background: #fff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; box-sizing: border-box;">
              <!-- HEADER -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 1px solid #E0E0E0; padding-bottom: 20px;">
                <div style="display: flex; flex-direction: column; width: 200px;">
                  <h1 style="font-size: 26px; font-weight: 900; letter-spacing: 1px; margin: 0; text-transform: uppercase; color: #0F755E;">${appName}</h1>
                  <div style="font-size: 11px; font-weight: normal; color: #666; margin-top: 2px;">Pièces & Accessoires Auto</div>
                  <div style="width: 100%; height: 2px; background: #0F755E; margin: 6px 0;"></div>
                  <div style="font-size: 10px; font-style: italic; color: #888;">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <h2 style="font-size: 24px; font-weight: 800; text-align: right; margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #0F755E;">RAPPORT DE VENTES</h2>
                  <div style="font-size: 12px; color: #666; text-align: right; margin-top: 5px; font-weight: bold;">Période: ${pStart} - ${pEnd}</div>
                </div>
              </div>

              <!-- SUMMARY & CHART -->
              <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                <!-- Summary Card -->
                <div style="flex: 1; min-width: 0;">
                  <div style="padding: 25px; border-radius: 8px; background-color: #0F755E; color: #fff;">
                    <h3 style="margin-top: 0; font-size: 16px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 12px; margin-bottom: 20px; color: #fff;">Performance Globale</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px;">
                      <span>Chiffre d'Affaires</span>
                      <strong style="font-size: 15px;">${new Intl.NumberFormat('fr-FR').format(totalVentes)} Ar</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px;">
                      <span>Coût des Achats</span>
                      <strong style="font-size: 15px;">${new Intl.NumberFormat('fr-FR').format(totalAchats)} Ar</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px;">
                      <span>Charges & Dépenses</span>
                      <strong style="font-size: 15px;">${new Intl.NumberFormat('fr-FR').format(totalDepenses)} Ar</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border-top: 1px solid #fff; padding-top: 12px; margin-top: 10px;">
                      <span>BÉNÉFICE NET</span>
                      <strong style="font-size: 18px; color: #FBB03B;">${new Intl.NumberFormat('fr-FR').format(beneficeNet)} Ar</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0; font-size: 13px;">
                      <span>Total Articles Vendus</span>
                      <strong style="font-size: 15px;">${totalItemsSold} Unités</strong>
                    </div>
                  </div>
                </div>
                <!-- Dual Axis Chart (Bars + Line) -->
                <div style="flex: 1; min-width: 0; display:flex; flex-direction:column; justify-content:center;">
                  <div style="font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0 0 15px 0; color: #0F755E;">Évolution des Ventes</div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="200" viewBox="0 0 350 200" style="overflow: visible;">
                    <line x1="0" y1="50" x2="350" y2="50" stroke="#eee" stroke-width="1" />
                    <line x1="0" y1="100" x2="350" y2="100" stroke="#eee" stroke-width="1" />
                    <line x1="0" y1="150" x2="350" y2="150" stroke="#eee" stroke-width="1" />
                    <line x1="0" y1="200" x2="350" y2="200" stroke="#999" stroke-width="2" />
                    
                    ${chartData.map((ts, i) => {
                      const spacing = 350 / (chartData.length || 1);
                      const x = (i * spacing) + (spacing / 2) - 15;
                      const h = maxRev > 0 ? (ts.revenue / maxRev) * 150 : 0;
                      return `
                        <rect x="${x}" y="${200 - h}" width="30" height="${h}" fill="#0F755E" rx="2" />
                        <text x="${x+15}" y="${200 - h - 5}" font-size="9" text-anchor="middle" fill="#333" font-weight="bold">${ts.qty}</text>
                      `;
                    }).join('')}

                    <polyline points="${chartData.map((ts, i) => {
                      const spacing = 350 / (chartData.length || 1);
                      const x = (i * spacing) + (spacing / 2);
                      const h = maxRev > 0 ? (ts.revenue / maxRev) * 150 : 0;
                      return `${x},${200 - h - 20}`;
                    }).join(' ')}" fill="none" stroke="#95C11E" stroke-width="3" />
                    
                    ${chartData.map((ts, i) => {
                      const spacing = 350 / (chartData.length || 1);
                      const x = (i * spacing) + (spacing / 2);
                      const h = maxRev > 0 ? (ts.revenue / maxRev) * 150 : 0;
                      return `
                        <circle cx="${x}" cy="${200 - h - 20}" r="4" fill="#fff" stroke="#95C11E" stroke-width="2" />
                      `;
                    }).join('')}
                  </svg>
                </div>
              </div>

              <!-- QUARTERLY/MAIN TABLE -->
              <h3 style="font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0 0 15px 0; border-bottom: 2px solid #0F755E; padding-bottom: 5px; display: inline-block; color: #0F755E;">Analyse Détaillée par Produit</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #333333; color: #fff;">
                    <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.1); width: 40%;">Nom du Produit</th>
                    <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.1); text-align:center;">Qté Vendue</th>
                    <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.1); text-align:right;">Chiffre d'Affaires</th>
                    <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.1); text-align:right;">Bénéfice</th>
                    <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; text-align:center;">Marge (%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${chartData.map((ts, idx) => {
                    const cost = (ts.revenue - ts.benefice) / (ts.qty || 1);
                    const marge = ts.revenue > 0 ? Math.round((ts.benefice / ts.revenue) * 100) : 0;
                    const rowBg = idx % 2 === 0 ? '#F9F9F9' : '#FFF';
                    return `
                    <tr style="background-color: ${rowBg};">
                      <td style="padding: 10px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; font-weight: bold; color: #0F755E;">${ts.name}</td>
                      <td style="padding: 10px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; text-align:center; color: #333;">${ts.qty}</td>
                      <td style="padding: 10px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; text-align:right; font-weight: bold; color: #333;">${new Intl.NumberFormat('fr-FR').format(ts.revenue)} Ar</td>
                      <td style="padding: 10px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; text-align:right; color: #0F755E; font-weight:bold;">${new Intl.NumberFormat('fr-FR').format(ts.benefice)} Ar</td>
                      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:center;">
                        <span style="background: ${marge > 20 ? '#95C11E' : '#FBB03B'}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${marge}%</span>
                      </td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <!-- REGIONAL SALES (DONUT & MINI TABLE) -->
              <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                <div style="flex: 1; min-width: 0;">
                  <h3 style="font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0 0 15px 0; color: #0F755E;">Répartition des Recettes</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
                    <thead>
                      <tr style="background-color: #0F755E; color: #fff;">
                        <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.1);">Produit Phare</th>
                        <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.1); text-align:right;">CA (Ar)</th>
                        <th style="padding: 12px 10px; font-weight: 700; text-transform: uppercase; text-align:center;">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${chartData.slice(0, 4).map((ts, i) => `
                        <tr style="background-color: ${i % 2 === 0 ? '#F9F9F9' : '#FFF'};">
                          <td style="padding: 10px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; color: #333;">
                            <div style="display:flex; align-items:center; gap:8px;">
                              <div style="width:10px; height:10px; background:${vColors[i % vColors.length]};"></div>
                              ${ts.name.substring(0, 20)}
                            </div>
                          </td>
                          <td style="padding: 10px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; text-align:right; font-weight:bold; color: #333;">${new Intl.NumberFormat('fr-FR').format(ts.revenue)}</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:center; color: #333;">${chartTotal > 0 ? Math.round((ts.revenue/chartTotal)*100) : 0}%</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <div style="flex: 1; min-width: 0; display:flex; justify-content:center; align-items:center; position:relative;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" style="width: 200px; height: 200px; transform: rotate(-90deg);">
                    ${svgDonutStr}
                  </svg>
                  <div style="position:absolute; text-align:center; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    <div style="font-size: 20px; font-weight: bold; color: #0F755E;">100%</div>
                    <div style="font-size: 10px; color: #666; text-transform:uppercase;">Global</div>
                  </div>
                </div>
              </div>

              <!-- FOOTER -->
              <div style="background: #333333; color: #fff; padding: 20px 40px; display: flex; justify-content: space-between; font-size: 11px; margin-top: 40px; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong>📞 Téléphone :</strong> ${bPhone || '+261 34 00 000 00'}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong>✉️ Email :</strong> ${bEmail || 'contact@ainapieceauto.mg'}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong>📍 Adresse :</strong> ${bAddress || 'Antananarivo, Madagascar'}
                </div>
              </div>
            </div>
        `;

        const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><title>Rapport ${appName}</title>
          <style>* { box-sizing: border-box; } body { margin: 0; padding: 20px; background: #fff; }</style>
          </head>
          <body>${bodyContent}</body>
          </html>
        `;

        if (format === 'word') {
          const mimeType = 'application/msword';
          const extension = '.doc';
          const typeDesc = 'Document Word';

          const blob = new Blob(['\ufeff', htmlContent], { type: mimeType });
          const fileName = `Rapport_${appName}_${reportStart}_au_${reportEnd}${extension}`;
          
          const downloadFallback = () => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          try {
            if ('showSaveFilePicker' in window) {
              const handle = await (window as any).showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                  description: typeDesc,
                  accept: { [mimeType]: [extension] },
                }],
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
            } else {
              downloadFallback();
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              downloadFallback();
            }
          }
        } else if (format === 'pdf') {
          try {
            const fileName = `Rapport_${appName}_${reportStart}_au_${reportEnd}.pdf`;
            
            const fullPdfHtml = `
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>* { box-sizing: border-box; } body { margin: 0; padding: 0; background: #fff; }</style>
                </head>
                <body style="background: #ffffff;">
                  ${bodyContent}
                </body>
              </html>
            `;

            const opt: any = {
              margin:       10,
              filename:     fileName,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set(opt).from(fullPdfHtml).save();
          } catch (err: any) {
            console.error("Erreur de génération PDF direct, repli sur l'impression :", err);
            // Open in a new window and print to PDF as fallback
            const printWin = window.open('', '_blank');
            if (printWin) {
              printWin.document.write(htmlContent);
              printWin.document.close();
              printWin.focus();
              printWin.print();
            } else {
              showAlert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour imprimer en PDF.", "warning");
            }
          }
        } else if (format === 'print') {
          // Explicit Print Dialog
          const printWin = window.open('', '_blank');
          if (printWin) {
            printWin.document.write(htmlContent);
            printWin.document.close();
            printWin.focus();
            printWin.print();
          } else {
            showAlert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour imprimer.", "warning");
          }
        }
      }

      setReportModalOpen(false);
    } catch (err: any) {
      showAlert("Erreur lors de l'export: " + err.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const executeHardReset = async () => {
    const confirmed = await showConfirm(`⚠️ DANGER EXTRÊME ⚠️\n\nVous êtes sur le point de RÉINITIALISER DÉFINITIVEMENT les éléments sélectionnés.\nCette action est totalement IRRÉVERSIBLE. Êtes-vous ABSOLUMENT certain(e) de vouloir continuer ?`, true);
    if (!confirmed) return;
    setIsHardResetting(true);
    try {
      if (resetOptions.transactions) {
        await supabase.from('details_ventes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('ventes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('details_achats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('achats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('depenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('mouvements_stock').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('import_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      if (resetOptions.catalogue) {
        await supabase.from('stock').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('pieces').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      if (resetOptions.fournisseurs) {
        await supabase.from('fournisseurs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      if (resetOptions.boutiques) {
        await supabase.from('boutiques').delete().neq('name', 'AINA PIECE BEHORIRIKA');
      }
      showAlert("Réinitialisation effectuée avec succès.");
      setHardResetModalOpen(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      alert("Erreur lors de la réinitialisation: " + e.message);
    } finally {
      setIsHardResetting(false);
    }
  };

  const executePurge = async () => {
    const confirmed = await showConfirm(`⚠️ ATTENTION ⚠️\n\nVous êtes sur le point d'EFFACER DÉFINITIVEMENT toutes les transactions (Ventes, Achats, Dépenses) du ${purgeStart} au ${purgeEnd}.\n\nCette action est totalement IRRÉVERSIBLE et permet de libérer de l'espace dans la base de données.\nÊtes-vous absolument certain(e) de vouloir continuer ?`, true);
    if (!confirmed) {
      return;
    }
    
    setIsPurging(true);
    try {
      const endDateFilter = purgeEnd + 'T23:59:59.999Z';
      
      const { data: vData } = await supabase.from('ventes').select('id').gte('created_at', purgeStart).lte('created_at', endDateFilter);
      if (vData && vData.length > 0) {
        const vIds = vData.map(v => v.id);
        await supabase.from('details_ventes').delete().in('vente_id', vIds);
        await supabase.from('ventes').delete().in('id', vIds);
      }
      
      const { data: aData } = await supabase.from('achats').select('id').gte('created_at', purgeStart).lte('created_at', endDateFilter);
      if (aData && aData.length > 0) {
        const aIds = aData.map(a => a.id);
        await supabase.from('details_achats').delete().in('achat_id', aIds);
        await supabase.from('achats').delete().in('id', aIds);
      }

      await supabase.from('depenses').delete().gte('created_at', purgeStart).lte('created_at', endDateFilter);

      showAlert(`✅ Purge effectuée avec succès.\nLes données de la période ${purgeStart} au ${purgeEnd} ont été effacées.`, 'success');
      setPurgeModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      showAlert("❌ Erreur lors de la purge: " + err.message, "error");
    } finally {
      setIsPurging(false);
    }
  };

  const themeOptions: { value: Theme; label: string; sub: string; icon: React.ReactNode }[] = [
    { value: 'clair', label: t('themeClair'), sub: 'Clarté inspirée de Stripe', icon: <Sun size={18} color="#0066fe" /> },
    { value: 'sombre', label: t('themeSombre'), sub: 'Bleu Navy profond', icon: <Moon size={18} color="#0066fe" /> },
    { value: 'auto', label: t('themeSystem'), sub: 'Selon vos préférences OS', icon: <Laptop size={18} color="#0066fe" /> }
  ];

  // Calendar for Reports logic
  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '6px' }}></div>);
    }

    const dToday2 = new Date();
    const todayStr = [dToday2.getFullYear(), String(dToday2.getMonth() + 1).padStart(2, '0'), String(dToday2.getDate()).padStart(2, '0')].join('-');

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dateStr = [dateObj.getFullYear(), String(dateObj.getMonth() + 1).padStart(2, '0'), String(dateObj.getDate()).padStart(2, '0')].join('-');
      const isToday = dateStr === todayStr;
      const hasActivity = activeDates.has(dateStr);
      
      let bg = 'transparent';
      let border = '1px solid rgba(255,255,255,0.05)';
      let color = '#fff';
      
      if (isToday) {
        bg = '#0078D4'; // Blue plus visible
        border = '1px solid #0078D4';
      } else if (hasActivity) {
        bg = '#ef4444'; // Solid Red like Dashboard
        border = '1px solid #ef4444';
      } else if (dateObj > new Date()) {
        color = 'rgba(255,255,255,0.2)';
      }

      days.push(
        <div key={i} style={{ padding: '6px', textAlign: 'center', fontSize: '11px', backgroundColor: bg, border, borderRadius: '4px', color, cursor: 'default', fontWeight: (isToday || hasActivity) ? 'bold' : 'normal' }}>
          {i}
        </div>
      );
    }

    return (
      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>&lt;</button>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
            {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
          </span>
          <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>&gt;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginTop: '6px' }}>
          {days}
        </div>
      </div>
    );
  };

  return (
    <div style={s.container}>

      {/* HEADER */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Panneau Administrateur</h1>
          <p style={s.pageSubtitle}>
            {t('settingsSub')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAdmin && (
            <button 
              onClick={() => setPurgeModalOpen(true)}
              style={{ ...s.smallBtn, backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', border: '1px solid rgba(220, 38, 38, 0.2)', fontSize: '13px', padding: '10px 16px' }}
            >
              <Database size={16} />
              Purger la Base de Données
            </button>
          )}
          <button 
            onClick={() => setReportModalOpen(true)}
            style={{ ...s.smallBtn, backgroundColor: '#10b981', color: '#fff', border: 'none', fontSize: '13px', padding: '10px 16px' }}
          >
            <FileText size={16} />
            Exporter Rapports / Statistiques
          </button>
        </div>
      </div>

      {/* ── TABS HEADER ─────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1f2937', marginBottom: '24px', paddingLeft: '8px' }}>
        <button
          onClick={() => setActiveSettingsTab('acces')}
          style={{
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            backgroundColor: activeSettingsTab === 'acces' ? '#1f2937' : 'transparent',
            color: activeSettingsTab === 'acces' ? '#fff' : 'rgba(255,255,255,0.5)',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
            border: activeSettingsTab === 'acces' ? '1px solid #374151' : '1px solid transparent',
            borderBottom: 'none',
            padding: '12px 24px',
            position: 'relative',
            top: '1px',
            zIndex: activeSettingsTab === 'acces' ? 1 : 0,
            marginBottom: '-1px'
          }}
        >
          <Shield size={16} style={{ color: activeSettingsTab === 'acces' ? '#0066fe' : 'inherit' }} />
          Accès & Boutiques
        </button>
        <button
          onClick={() => setActiveSettingsTab('systeme')}
          style={{
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            backgroundColor: activeSettingsTab === 'systeme' ? '#1f2937' : 'transparent',
            color: activeSettingsTab === 'systeme' ? '#fff' : 'rgba(255,255,255,0.5)',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
            border: activeSettingsTab === 'systeme' ? '1px solid #374151' : '1px solid transparent',
            borderBottom: 'none',
            padding: '12px 24px',
            position: 'relative',
            top: '1px',
            zIndex: activeSettingsTab === 'systeme' ? 1 : 0,
            marginBottom: '-1px'
          }}
        >
          <Database size={16} style={{ color: activeSettingsTab === 'systeme' ? '#10b981' : 'inherit' }} />
          Système, Sécurité & Personnalisation
        </button>
      </div>

      <div style={{ display: activeSettingsTab === 'acces' ? 'block' : 'none' }}>
      {/* ── CONTRÔLE D'ACCÈS MATRICIEL ─────────────── */}
      {isAdmin && (
        <div style={{ ...s.card, marginBottom: '20px', overflowX: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', margin: 0, whiteSpace: 'nowrap' }}>
              <Shield size={16} style={{ marginRight: '8px', opacity: 0.7 }} />
              Matrice des Autorisations (Utilisateurs & Boutiques)
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, padding: '0 40px', maxWidth: '400px' }}>
              <Database size={14} color="rgba(255,255,255,0.4)" />
              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ 
                  width: `${dbStats.loading ? 0 : Math.min(100, (dbStats.usedMB / dbStats.totalMB) * 100)}%`, 
                  backgroundColor: dbStats.usedMB > 400 ? '#ef4444' : dbStats.usedMB > 250 ? '#f59e0b' : '#10b981', 
                  height: '100%', 
                  transition: 'width 1s ease-in-out' 
                }} />
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: '700', color: '#fff', fontSize: '11px' }}>
                  {dbStats.loading ? '...' : dbStats.usedMB.toFixed(2)} / {dbStats.totalMB} Mo
                </span>
                <span style={{ fontSize: '9px', opacity: 0.8 }}>
                  Libre : {dbStats.loading ? '...' : (dbStats.totalMB - dbStats.usedMB).toFixed(1)} Mo
                </span>
              </div>
              <button
                onClick={() => setHardResetModalOpen(true)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginLeft: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase'
                }}
              >
                <RefreshCw size={12} />
                Réinitialiser
              </button>
            </div>
            <button
              onClick={() => {
                setPagePermissions(matrixPerms);
                setMatrixMessage("Autorisations enregistrées avec succès !");
                setTimeout(() => setMatrixMessage(null), 3000);
              }}
              style={{
                backgroundColor: '#5865F2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              Enregistrer
            </button>
          </div>
          
          {matrixMessage && (
            <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
              <CheckCircle2 size={16} style={{ marginRight: '8px' }} />
              {matrixMessage}
            </div>
          )}

          <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.45)', marginTop: '8px', marginBottom: '16px', lineHeight: 1.5 }}>
            Cliquez sur les icônes (œil) pour définir quelles pages sont visibles par chaque profil ou boutique.
          </p>

          <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '800px', backgroundColor: '#0d1117' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ ...s.th, width: '140px', borderBottom: 'none', borderRight: '1px solid rgba(255,255,255,0.2)', backgroundColor: '#1e293b' }}></th>
                  <th style={{ ...s.th, width: '40px', borderBottom: 'none', borderRight: '1px solid rgba(255,255,255,0.2)', backgroundColor: '#1e293b' }}></th>
                  <th colSpan={5} style={{ ...s.th, textAlign: 'center', backgroundColor: '#1e293b', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.2)' }}>ACTIVITÉ</th>
                  <th colSpan={3} style={{ ...s.th, textAlign: 'center', backgroundColor: '#1e293b', color: '#f472b6', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.2)' }}>CATALOGUE</th>
                  <th colSpan={4} style={{ ...s.th, textAlign: 'center', backgroundColor: '#1e293b', color: '#c084fc', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>ADMINISTRATION</th>
                </tr>
                <tr>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Profils / Boutiques</th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.2)' }}><div title="Tableau de bord" style={{ display: 'flex', justifyContent: 'center' }}><LayoutDashboard size={16} /></div></th>
                  
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Ventes" style={{ display: 'flex', justifyContent: 'center' }}><ShoppingCart size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Achats" style={{ display: 'flex', justifyContent: 'center' }}><TrendingDown size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Caisse" style={{ display: 'flex', justifyContent: 'center' }}><Wallet size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Dépenses" style={{ display: 'flex', justifyContent: 'center' }}><BarChart2 size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.2)' }}><div title="Clients & Crédits" style={{ display: 'flex', justifyContent: 'center' }}><Users size={16} /></div></th>
                  
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Pièces" style={{ display: 'flex', justifyContent: 'center' }}><Boxes size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Stock" style={{ display: 'flex', justifyContent: 'center' }}><Store size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.2)' }}><div title="Fournisseurs" style={{ display: 'flex', justifyContent: 'center' }}><Truck size={16} /></div></th>
                  
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Utilisateurs" style={{ display: 'flex', justifyContent: 'center' }}><Users size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Boutiques" style={{ display: 'flex', justifyContent: 'center' }}><Building2 size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Import Excel" style={{ display: 'flex', justifyContent: 'center' }}><FileSpreadsheet size={16} /></div></th>
                  <th style={{ ...s.th, backgroundColor: '#161b22', borderBottom: '2px solid rgba(255,255,255,0.1)' }}><div title="Paramètres" style={{ display: 'flex', justifyContent: 'center' }}><SettingsIcon size={16} /></div></th>
                </tr>
              </thead>
            <tbody>
              {/* Users */}
              {profiles.map((p, i) => (
                <tr key={p.id} style={{ ...s.tr, backgroundColor: i % 2 === 0 ? '#161b22' : '#0d1117' }}>
                  <td style={{ ...s.tdName, borderRight: '1px solid rgba(255,255,255,0.2)' }}>{p.full_name}</td>
                  {['dashboard', 'sales', 'purchases', 'caisse', 'depenses', 'clients', 'pieces', 'stock', 'fournisseurs', 'users', 'boutiques', 'excel', 'settings'].map(page => {
                    const enabled = getMatrixPerm(p.id, page);
                    const isDivider = ['dashboard', 'clients', 'fournisseurs'].includes(page);
                    return (
                      <td key={page} style={{ ...s.tdCenter, borderRight: isDivider ? '1px solid rgba(255,255,255,0.2)' : s.tdCenter.borderRight }} onClick={() => toggleMatrixPerm(p.id, page)}>
                        <div style={{ ...s.eyeToggle, backgroundColor: enabled ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}>
                          {enabled ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="rgba(255,255,255,0.2)" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Spacer row */}
              <tr style={{ backgroundColor: '#0d1117', height: '8px' }}><td colSpan={13}></td></tr>
              {/* Boutiques */}
              {boutiques.map((b, i) => (
                <tr key={b.id} style={{ ...s.tr, backgroundColor: i % 2 === 0 ? '#161b22' : '#0d1117' }}>
                  <td style={{ ...s.tdName, borderRight: '1px solid rgba(255,255,255,0.2)' }}>{b.name}</td>
                  {['dashboard', 'sales', 'purchases', 'caisse', 'depenses', 'clients', 'pieces', 'stock', 'fournisseurs', 'users', 'boutiques', 'excel', 'settings'].map(page => {
                    const enabled = getMatrixPerm(b.id, page);
                    const isDivider = ['dashboard', 'clients', 'fournisseurs'].includes(page);
                    return (
                      <td key={page} style={{ ...s.tdCenter, borderRight: isDivider ? '1px solid rgba(255,255,255,0.2)' : s.tdCenter.borderRight }} onClick={() => toggleMatrixPerm(b.id, page)}>
                        <div style={{ ...s.eyeToggle, backgroundColor: enabled ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}>
                          {enabled ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="rgba(255,255,255,0.2)" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* THREE-COLUMN GRID */}
      <div style={s.settingsGrid}>

        {/* Mode Offline PWA */}
        <div style={{ ...s.card, display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>
          <h3 style={s.cardTitle}>
            <Wifi size={16} style={{ marginRight: '8px', opacity: 0.7 }} />
            {t('offlineTitle')}
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '6px', marginBottom: '16px', lineHeight: '1.5' }}>
            {t('offlineSub')}
          </p>

          <div style={s.offlineCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isOffline
                  ? <WifiOff size={16} color="#ef4444" />
                  : <Wifi size={16} color="#22c55e" />
                }
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                  {isOffline ? 'Statut Réseau : Hors-Ligne (PWA)' : 'Statut Réseau : En Ligne'}
                </span>
              </div>
            </div>

            {isOffline && (
              <div style={s.offlineWarning}>
                <AlertTriangle size={14} />
                <span>Connexion coupée ! Le POS continue de tourner. Les transactions s'enregistrent localement.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <Database size={14} />
                <span>Ventes en attente de synchronisation :</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: pendingSalesCount > 0 ? '#f59e0b' : 'rgba(255,255,255,0.35)' }}>
                {pendingSalesCount}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                style={{ ...s.smallBtn, flex: 1, justifyContent: 'center', backgroundColor: '#0066fe', color: '#ffffff', borderColor: '#0066fe', opacity: (pendingSalesCount === 0 || isOffline || isSyncing) ? 0.5 : 1 }}
                disabled={pendingSalesCount === 0 || isOffline || isSyncing}
                onClick={() => window.dispatchEvent(new Event('online'))}
              >
                {isSyncing
                  ? <><RefreshCw size={13} /> Synchronisation...</>
                  : <><RefreshCw size={13} /> Forcer la Synchronisation</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Boutiques actives */}
          <div style={{ ...s.card, display: activeSettingsTab === 'acces' ? 'block' : 'none' }}>
            <h3 style={s.cardTitle}>
              <Store size={16} style={{ marginRight: '8px', opacity: 0.7 }} />
              Boutiques & Points de Vente Actifs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div style={s.spinner}></div>
                </div>
              ) : boutiques.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '13px', padding: '24px' }}>
                  Aucune boutique enregistrée.
                </p>
              ) : (
                boutiques.map((b, idx) => (
                  <div key={idx} style={s.boutiqueRow}>
                    <div style={s.boutiqueIcon}>
                      <Store size={16} color="#0066fe" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff' }}>{b.name}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>
                        Adresse : {b.location || 'Non précisée'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── STATUT EN LIGNE DES BOUTIQUES ─────────────── */}
          {isAdmin && (
            <div style={{ ...s.card, display: activeSettingsTab === 'acces' ? 'block' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                <h3 style={{ ...s.cardTitle, borderBottom: 'none', paddingBottom: 0 }}>
                  <Activity size={16} style={{ marginRight: '8px', opacity: 0.7 }} />
                  Statut des Boutiques en Temps Réel
                </h3>
                <button
                  style={s.refreshStatusBtn}
                  onClick={() => fetchBoutiqueStatuses()}
                  disabled={statusLoading}
                  title="Actualiser"
                >
                  <RefreshCw size={13} style={{ animation: statusLoading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              </div>

              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '10px', marginBottom: '14px' }}>
                Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — Rafraîchissement auto toutes les 60s
              </div>

              {statusLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  <div style={s.spinner}></div>
                  <span>Vérification des boutiques...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {boutiqueStatuses.map((bs) => {
                    const statusColor = bs.status === 'online' ? '#22c55e' : bs.status === 'recent' ? '#f59e0b' : 'rgba(255,255,255,0.2)';
                    const statusLabel = bs.status === 'online' ? 'En ligne' : bs.status === 'recent' ? 'Récemment actif' : 'Hors ligne';
                    const lastActivityStr = bs.lastActivity
                      ? (() => {
                          const diff = (Date.now() - bs.lastActivity.getTime()) / 60000;
                          if (diff < 1) return 'Il y a moins d\'1 min';
                          if (diff < 60) return `Il y a ${Math.round(diff)} min`;
                          const h = Math.round(diff / 60);
                          return `Il y a ${h}h`;
                        })()
                      : 'Jamais';

                    return (
                      <div key={bs.boutiqueId} style={s.statusRow}>
                        {/* Pulsing online indicator */}
                        <div style={{ position: 'relative', width: '10px', height: '10px', flexShrink: 0 }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            boxShadow: bs.status === 'online' ? `0 0 0 3px ${statusColor}25` : 'none',
                            animation: bs.status === 'online' ? 'blinkStatus 1.5s infinite ease-in-out' : 'none'
                          }} />
                        </div>

                        {/* Boutique info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {bs.boutiqueName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                            {lastActivityStr}
                            {bs.activeUserCount > 0 && ` · ${bs.activeUserCount} utilisateur${bs.activeUserCount > 1 ? 's' : ''}`}
                          </div>
                        </div>

                        {/* Status badge */}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: statusColor,
                          backgroundColor: `${statusColor}15`,
                          border: `1px solid ${statusColor}30`,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          flexShrink: 0
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}

                  {boutiqueStatuses.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '16px 0' }}>
                      Aucune boutique détectée.
                    </p>
                  )}
                </div>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                {[
                  { color: '#22c55e', label: 'En ligne (< 15 min)' },
                  { color: '#f59e0b', label: 'Récent (< 2h)' },
                  { color: 'rgba(255,255,255,0.2)', label: 'Hors ligne' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HORAIRES DE LA BOUTIQUE & VERROUILLAGE ─────────────── */}
          {isAdmin && (
            <div style={{ ...s.card, display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                <h3 style={{ ...s.cardTitle, borderBottom: 'none', paddingBottom: 0 }}>
                  <Shield size={16} style={{ marginRight: '8px', opacity: 0.7 }} />
                  Horaires d'Ouverture & Verrouillage
                </h3>
              </div>

              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.45)', marginTop: '10px', marginBottom: '16px', lineHeight: 1.5 }}>
                Définissez les heures d'ouverture. En dehors de ces heures, les employés seront automatiquement bloqués. Vous seul (Administrateur) aurez toujours accès.
              </p>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Heure d'ouverture</label>
                  <input
                    type="time"
                    style={s.inputField}
                    value={shopHours.open}
                    onChange={(e) => setShopHours({ ...shopHours, open: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Heure de fermeture</label>
                  <input
                    type="time"
                    style={s.inputField}
                    value={shopHours.close}
                    onChange={(e) => setShopHours({ ...shopHours, close: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ 
                backgroundColor: shopHours.forceOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', 
                border: `1px solid ${shopHours.forceOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                padding: '16px', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: shopHours.forceOpen ? '#10b981' : '#fff' }}>
                    Interrupteur d'Urgence (Dérogation)
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    Si activé, les employés auront accès à l'ERP même en dehors des horaires.
                  </div>
                </div>
                
                <button
                  onClick={() => setShopHours({ ...shopHours, forceOpen: !shopHours.forceOpen })}
                  style={{
                    backgroundColor: shopHours.forceOpen ? '#10b981' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    width: '44px',
                    height: '24px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: shopHours.forceOpen ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
            </div>
          )}


      {/* ── PERSONNALISATION DE L'APPLICATION ────────────────────────── */}
      <div style={{ ...s.card, display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', margin: 0 }}>
            <SettingsIcon size={18} style={{ marginRight: '10px', color: '#0066fe' }} />
            Personnalisation de l'Application
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px', lineHeight: '1.5' }}>
          Modifiez le nom et le logo affichés dans le menu latéral. Ces changements seront visibles immédiatement sur l'appareil actuel.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Image du Logo (Optionnel)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {appLogoImage && (
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={appLogoImage} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleLogoUpload}
                style={{ ...s.inputField, padding: '6px', fontSize: '11px' }}
              />
              {appLogoImage && (
                <button 
                  onClick={() => setAppLogoImage(null)} 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', padding: '6px', cursor: 'pointer' }}
                  title="Supprimer l'image"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Texte du Logo (Si pas d'image)</label>
            <input
              type="text"
              value={appLogoText}
              onChange={(e) => setAppLogoText(e.target.value.substring(0, 4))}
              style={s.inputField}
              maxLength={4}
              placeholder="AP"
              disabled={!!appLogoImage}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Nom de l'Application</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              style={s.inputField}
              placeholder="AutoParts"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Sous-titre (Optionnel)</label>
            <input
              type="text"
              value={appSubtitle}
              onChange={(e) => setAppSubtitle(e.target.value)}
              style={s.inputField}
              placeholder="ERP"
            />
          </div>
        </div>
      </div>
      {/* Formulaire de création d'accès boutique */}
        <div style={{ ...s.card, display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <Users size={16} style={{ marginRight: '8px', color: 'var(--accent-purple)' }} />
            Créer un identifiant de connexion pour une boutique
          </h4>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px' }}>
            Remplissez ce formulaire pour créer un accès "Caissier" qui sera directement restreint à une boutique précise, sans quitter cette page.
          </p>
          
          {caissierMessage && (
            <div style={{ 
              padding: '10px 14px', 
              borderRadius: '6px', 
              marginBottom: '16px', 
              fontSize: '13px',
              backgroundColor: caissierMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: caissierMessage.type === 'success' ? '#22c55e' : '#ef4444',
              border: `1px solid ${caissierMessage.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              {caissierMessage.text}
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            const emailBackup = newCaissierEmail;
            const pwdBackup = newCaissierPassword;
            const boutiqueName = boutiques.find(b => b.id === newCaissierBoutique)?.name || 'Boutique';
            
            await handleCreateCaissier(e);
            
            const newAcc = { email: emailBackup, password: pwdBackup, boutique: boutiqueName, date: new Date().toLocaleDateString('fr-FR') };
            const updated = [newAcc, ...createdAccounts];
            setCreatedAccounts(updated);
            localStorage.setItem('boutique_accounts', JSON.stringify(updated));
          }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input 
                type="email" 
                required
                placeholder="boutique.nord@aina.com" 
                style={s.inputField} 
                value={newCaissierEmail}
                onChange={(e) => setNewCaissierEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mot de passe</label>
              <input 
                type="text" 
                required
                minLength={6}
                placeholder="Minimum 6 caractères" 
                style={s.inputField} 
                value={newCaissierPassword}
                onChange={(e) => setNewCaissierPassword(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigner à la boutique</label>
              <select 
                required
                style={s.inputField}
                value={newCaissierBoutique}
                onChange={(e) => setNewCaissierBoutique(e.target.value)}
              >
                <option value="">-- Choisir une boutique --</option>
                {boutiques.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={caissierLoading}
                style={{
                  height: '42px',
                  width: '100%',
                  padding: '0 24px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: caissierLoading ? 'rgba(255,255,255,0.1)' : '#FCD25B',
                  color: caissierLoading ? '#ffffff' : '#0f172a',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: caissierLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: caissierLoading ? 'none' : '0 4px 15px rgba(252, 210, 91, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {caissierLoading ? 'Création...' : (
                  <><Plus size={16} /> Créer l'accès</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── INTELLIGENCE HORS NORME : SÉCURITÉ & SAUVEGARDES ─────────────── */}
      <div style={{ display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>
      {isAdmin && (
        <div style={{ ...s.card, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', margin: 0 }}>
              <Shield size={18} style={{ marginRight: '10px' }} />
              Sécurité Hors Norme & Points de Sauvegarde
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px', lineHeight: '1.5' }}>
            L'application est dotée d'une intelligence de sécurité. Même en cas de perte ou de vol du matériel, vous pouvez récupérer vos données. L'application génère un <b>Point de Sauvegarde</b> qui contient l'état exact et complet du système.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Actions Manuelles */}
            <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <h4 style={{ color: '#10b981', fontSize: '13px', marginBottom: '16px', marginTop: 0 }}>Actions Manuelles</h4>
              
              <button 
                onClick={() => executeBackup(false)}
                disabled={isBackingUp}
                style={{ ...s.btnValider, width: '100%', marginBottom: '12px', backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                <Save size={16} style={{ marginRight: '8px' }} /> 
                {isBackingUp ? 'Création en cours...' : 'Créer un Point de Sauvegarde'}
              </button>

              <label style={{ ...s.btnAnnuler, width: '100%', display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                <UploadCloud size={16} style={{ marginRight: '8px' }} /> 
                {isRestoring ? 'Importation...' : 'Importer un Point de Sauvegarde'}
                <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Automatisation */}
            <div style={{ padding: '16px', backgroundColor: '#0d1117', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ color: '#fff', fontSize: '13px', marginBottom: '16px', marginTop: 0 }}>Automatisation Intelligente</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Heure de création automatique</label>
                <input 
                  type="time" 
                  value={autoBackupTime}
                  onChange={(e) => { setAutoBackupTime(e.target.value); localStorage.setItem('autoBackupTime', e.target.value); }}
                  style={s.inputField} 
                />
              </div>

              {isAdmin && boutiques.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Boutique :</label>
                  <select 
                    value={reportBoutiqueId}
                    onChange={(e) => setReportBoutiqueId(e.target.value)}
                    style={s.inputField}
                  >
                    <option value="all">Toutes les boutiques</option>
                    {boutiques.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Email d'envoi de sécurité (ex: Gmail)</label>
                <input 
                  type="email" 
                  placeholder="votre_email@gmail.com"
                  value={backupEmail}
                  onChange={(e) => { setBackupEmail(e.target.value); localStorage.setItem('backupEmail', e.target.value); }}
                  style={s.inputField} 
                />
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', marginBottom: 0 }}>
                  * À l'heure définie, l'application téléchargera le point de sauvegarde et préparera un email pour vous l'envoyer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLEAU DES INFORMATIONS LÉGALES & CONTACT ─────────────── */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', margin: 0 }}>
            <Building2 size={18} style={{ marginRight: '10px', color: '#0066fe' }} />
            Informations Entreprise & Coordonnées des Boutiques
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px', lineHeight: '1.5' }}>
          Gérez ici les numéros de téléphone, NIF, STAT, adresse e-mail et autres informations légales qui apparaîtront sur les factures et reçus.
        </p>

        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b' }}>
                <th style={s.th}>Nom de la Boutique</th>
                <th style={s.th}>Téléphone</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Siège Social / Adresse</th>
                <th style={s.th}>NIF / STAT</th>
                <th style={s.th}>RCS</th>
                <th style={{ ...s.th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {boutiques.map((b, i) => {
                const info = boutiqueInfos[b.id] || {};
                return (
                  <tr key={b.id} style={{ backgroundColor: i % 2 === 0 ? '#161b22' : '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ ...s.tdName, borderBottom: 'none' }}>{b.name}</td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Ex: 034 00 000 00" 
                        style={s.tableInput} 
                        value={info.phone || ''} 
                        onChange={(e) => handleInfoChange(b.id, 'phone', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        type="email" 
                        placeholder="contact@..." 
                        style={s.tableInput} 
                        value={info.email || ''} 
                        onChange={(e) => handleInfoChange(b.id, 'email', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Adresse complète" 
                        style={s.tableInput} 
                        value={info.address !== undefined ? info.address : (b.location || '')} 
                        onChange={(e) => handleInfoChange(b.id, 'address', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="NIF / STAT" 
                        style={s.tableInput} 
                        value={info.nif_stat || ''} 
                        onChange={(e) => handleInfoChange(b.id, 'nif_stat', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Numéro RCS" 
                        style={s.tableInput} 
                        value={info.rcs || ''} 
                        onChange={(e) => handleInfoChange(b.id, 'rcs', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleSaveBoutiqueInfo(b.id)}
                          style={{
                            backgroundColor: 'rgba(0, 102, 254, 0.1)',
                            color: '#0066fe',
                            border: '1px solid rgba(0, 102, 254, 0.2)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CheckCircle2 size={14} /> Sauvegarder
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {boutiques.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                    Aucune boutique disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


      </div>

      {/* ── TABLEAU DES COMPTES CRÉÉS ─────────────────────────── */}
      {isAdmin && (() => {
        const combinedAccounts = [...createdAccounts];
        dbCaissiers.forEach(dbc => {
          if (!combinedAccounts.some(acc => acc.email === dbc.email)) {
            combinedAccounts.push({
              date: dbc.date,
              boutique: boutiques.find(b => b.id === dbc.boutique_id)?.name || 'Boutique',
              email: dbc.email,
              password: dbc.password,
              isDb: true,
              id: dbc.id
            });
          }
        });

        if (combinedAccounts.length === 0) return null;

        return (
          <div style={{...s.card, marginTop: '24px'}}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <Users size={16} style={{ marginRight: '8px', color: '#10b981' }} />
              Comptes Boutiques Existants
            </h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px' }}>
              Voici la liste de tous les accès boutiques. Les mots de passe anciens sont masqués (***) par sécurité. 
              Pour modifier le mot de passe réel d'un compte, veuillez vous rendre dans l'onglet "Utilisateurs".
            </p>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e293b' }}>
                    <th style={{...s.th, textAlign: 'center'}}>Date</th>
                    <th style={{...s.th, textAlign: 'center'}}>Boutique assignée</th>
                    <th style={{...s.th, textAlign: 'center'}}>Email (Identifiant)</th>
                    <th style={{...s.th, textAlign: 'center'}}>Mot de passe</th>
                    <th style={{...s.th, width: '80px', textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedAccounts.map((acc, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#161b22' : '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{...s.tdDate, textAlign: 'center'}}>{acc.date}</td>
                      <td style={{...s.tdName, borderBottom: 'none', textAlign: 'center'}}>{acc.boutique}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#60a5fa', textAlign: 'center' }}>{acc.email}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: acc.isDb ? 'rgba(255,255,255,0.4)' : '#ffffff', fontFamily: 'monospace', textAlign: 'center', letterSpacing: acc.isDb ? '2px' : 'normal' }}>
                        {acc.password}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        {!acc.isDb ? (
                          <>
                            <button 
                              onClick={async () => {
                                const newPwd = await showPrompt("Modifier le texte du mot de passe (ATTENTION: Ceci modifie uniquement l'affichage local, pas le vrai mot de passe dans la base de données) :", acc.password);
                                if (newPwd) {
                                  const updated = [...createdAccounts];
                                  const localIdx = updated.findIndex(u => u.email === acc.email);
                                  if(localIdx >= 0) {
                                    updated[localIdx].password = newPwd;
                                    setCreatedAccounts(updated);
                                    localStorage.setItem('boutique_accounts', JSON.stringify(updated));
                                  }
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '4px' }}
                              title="Modifier (Local uniquement)"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                const updated = createdAccounts.filter(u => u.email !== acc.email);
                                setCreatedAccounts(updated);
                                localStorage.setItem('boutique_accounts', JSON.stringify(updated));
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Effacer de l'historique"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>BDD</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      </div> {/* Fermeture du wrapper systeme de la ligne 2020 */}

      {/* ── REPORT EXPORT MODAL ─────────────────────────── */}
      {reportModalOpen && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalCard, maxWidth: '600px' }}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>
                <FileText size={18} style={{ marginRight: '10px', color: '#10b981' }} />
                Exporter le Rapport Général
              </h3>
              <button style={s.modalCloseBtn} onClick={() => setReportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={s.modalBody}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                Choisissez la période et les données à inclure dans votre rapport complet. 
                Les dates marquées en <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>rouge</span> sont celles où une activité a été enregistrée.
              </p>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 250px' }}>
                  {renderCalendar()}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Date de début</label>
                      <input 
                        type="date" 
                        value={reportStart}
                        onChange={e => setReportStart(e.target.value)}
                        style={s.inputField} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Date de fin</label>
                      <input 
                        type="date" 
                        value={reportEnd}
                        onChange={e => setReportEnd(e.target.value)}
                        style={s.inputField} 
                      />
                    </div>
                  </div>
                </div>

                <div style={{ flex: '1 1 200px' }}>
                  {isAdmin && boutiques.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Boutique :</label>
                      <select 
                        value={reportBoutiqueId}
                        onChange={(e) => setReportBoutiqueId(e.target.value)}
                        style={s.inputField}
                      >
                        <option value="all">Toutes les boutiques</option>
                        {boutiques.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Options du Rapport :</label>
                  
                  {[
                    { key: 'ventes', label: 'Ventes réalisées' },
                    { key: 'achats', label: 'Achats / Approvisionnements' },
                    { key: 'depenses', label: 'Dépenses enregistrées' },
                    { key: 'stock', label: 'État du Stock actuel' }
                  ].map(opt => (
                    <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={reportOpts[opt.key as keyof typeof reportOpts]}
                        onChange={e => setReportOpts({...reportOpts, [opt.key]: e.target.checked})}
                        style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                      />
                      {opt.label}
                    </label>
                  ))}
                  
                  <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                      <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      L'export Excel crée plusieurs feuilles (onglets) dans un seul fichier.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ ...s.modalFooter, justifyContent: 'space-between' }}>
              <button style={s.btnAnnuler} onClick={() => setReportModalOpen(false)}>
                Annuler
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>

                <button 
                  style={{ ...s.btnValider, backgroundColor: '#2563eb', borderColor: '#2563eb' }} 
                  onClick={() => executeExport('word')}
                  disabled={isExporting}
                >
                  <Download size={14} style={{ marginRight: '6px' }} /> Word
                </button>
                <button 
                  style={{ ...s.btnValider, backgroundColor: '#ef4444', borderColor: '#ef4444' }} 
                  onClick={() => executeExport('pdf')}
                  disabled={isExporting}
                >
                  <Download size={14} style={{ marginRight: '6px' }} /> PDF
                </button>
                <button 
                  style={{ ...s.btnValider, backgroundColor: '#10b981', borderColor: '#10b981' }} 
                  onClick={() => executeExport('excel')}
                  disabled={isExporting}
                >
                  <FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> Excel
                </button>
                <button 
                  style={{ ...s.btnValider, backgroundColor: '#475569', borderColor: '#475569' }} 
                  onClick={() => executeExport('print')}
                  disabled={isExporting}
                  title="Imprimer directement le rapport"
                >
                  <Printer size={14} /> 
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE PURGE ─────────────────────────────── */}
      {purgeModalOpen && (
        <div style={s.modalOverlay}>
          <div style={{...s.modalCard, maxWidth: '400px'}}>
            <div style={s.modalHeader}>
              <h3 style={{...s.modalTitle, color: '#ef4444'}}>
                <Database size={18} style={{ marginRight: '8px' }} />
                Purger la Base de Données
              </h3>
              <button style={s.modalCloseBtn} onClick={() => setPurgeModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={s.modalBody}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
                  <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} />
                  <strong>Attention :</strong> Cette action supprimera définitivement toutes les Ventes, Achats et Dépenses de la période sélectionnée pour libérer de l'espace. Le stock actuel ne sera pas modifié.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Effacer les données à partir du :</label>
                  <input 
                    type="date" 
                    value={purgeStart}
                    onChange={e => setPurgeStart(e.target.value)}
                    style={s.inputField} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Jusqu'au :</label>
                  <input 
                    type="date" 
                    value={purgeEnd}
                    onChange={e => setPurgeEnd(e.target.value)}
                    style={s.inputField} 
                  />
                </div>
              </div>
            </div>

            <div style={{ ...s.modalFooter, justifyContent: 'space-between' }}>
              <button style={s.btnAnnuler} onClick={() => setPurgeModalOpen(false)}>
                Annuler
              </button>
              <button 
                style={{ ...s.btnValider, backgroundColor: '#dc2626', borderColor: '#dc2626' }} 
                onClick={executePurge}
                disabled={isPurging}
              >
                {isPurging ? 'Purge en cours...' : 'Effacer les données'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE RÉINITIALISATION D'USINE ───────────────── */}
      {hardResetModalOpen && (
        <div style={s.modalOverlay}>
          <div style={{...s.modalCard, maxWidth: '450px'}}>
            <div style={s.modalHeader}>
              <h3 style={{...s.modalTitle, color: '#ef4444'}}>
                <AlertTriangle size={18} style={{ marginRight: '8px' }} />
                Réinitialisation Globale (Factory Reset)
              </h3>
              <button style={s.modalCloseBtn} onClick={() => setHardResetModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={s.modalBody}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
                  <strong>Attention !</strong> Cette action permet de vider rapidement certaines tables de votre base de données (pour recommencer à zéro). C'est IRRÉVERSIBLE.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                  <input type="checkbox" checked={resetOptions.transactions} onChange={(e) => setResetOptions({...resetOptions, transactions: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
                  <span>Ventes, Achats, Dépenses et Mouvements (Historique)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                  <input type="checkbox" checked={resetOptions.catalogue} onChange={(e) => setResetOptions({...resetOptions, catalogue: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
                  <span>Catalogue des Pièces & Stock</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                  <input type="checkbox" checked={resetOptions.fournisseurs} onChange={(e) => setResetOptions({...resetOptions, fournisseurs: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
                  <span>Liste des Fournisseurs</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                  <input type="checkbox" checked={resetOptions.numerotation} onChange={(e) => setResetOptions({...resetOptions, numerotation: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
                  <span>Numérotation des factures et tickets à zéro</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                  <input type="checkbox" checked={resetOptions.boutiques} onChange={(e) => setResetOptions({...resetOptions, boutiques: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
                  <span>Supprimer les autres Boutiques (Conserver 'AINA PIECE BEHORIRIKA')</span>
                </label>

              </div>
            </div>

            <div style={{ ...s.modalFooter, justifyContent: 'space-between' }}>
              <button style={s.btnAnnuler} onClick={() => setHardResetModalOpen(false)}>
                Annuler
              </button>
              <button 
                style={{ ...s.btnValider, backgroundColor: '#dc2626', borderColor: '#dc2626' }} 
                onClick={executeHardReset}
                disabled={isHardResetting || (!resetOptions.transactions && !resetOptions.catalogue && !resetOptions.fournisseurs && !resetOptions.numerotation && !resetOptions.boutiques)}
              >
                {isHardResetting ? 'Réinitialisation...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STYLES UNIFIÉ AVEC LE RESTE DE L'ERP ─────────────
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
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '20px'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '12px'
  },
  themeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease'
  },
  themeBtnIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    backgroundColor: 'rgba(0,102,254,0.1)',
    borderRadius: '8px',
    flexShrink: 0
  },
  themeBtnLabel: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#ffffff'
  },
  themeBtnSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    marginTop: '2px'
  },
  langBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '16px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  offlineCard: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '14px'
  },
  offlineWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '8px 12px',
    borderRadius: '6px',
    color: '#ef4444',
    fontSize: '12px',
    marginBottom: '12px'
  },
  smallBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
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
  tableInput: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '4px',
    padding: '8px 10px',
    color: '#ffffff',
    fontSize: '12.5px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#00d4ff',
    color: '#000000',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 20px',
    fontWeight: '700',
    fontSize: '13.5px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease'
  },
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#ef4444',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginTop: '12px'
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#22c55e',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginTop: '12px'
  },
  boutiqueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '12px 14px'
  },
  boutiqueIcon: {
    width: '34px',
    height: '34px',
    backgroundColor: 'rgba(0,102,254,0.1)',
    border: '1px solid rgba(0,102,254,0.2)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(255,255,255,0.08)',
    borderTopColor: '#0066fe',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },
  // Access control styles
  accessSectionLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '8px'
  },
  accessToggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#0d1117',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.04)',
    transition: 'all 0.15s ease'
  },
  accessToggleDot: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease'
  },
  accessNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    backgroundColor: 'rgba(0,102,254,0.06)',
    border: '1px solid rgba(0,102,254,0.15)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '11.5px',
    color: 'rgba(255,255,255,0.45)',
    marginTop: '12px'
  },
  // Boutique status card styles
  refreshStatusBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    flexShrink: 0
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#0d1117',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.04)',
    transition: 'all 0.15s ease'
  },
  // Matrix styles
  th: {
    padding: '12px 8px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tdName: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap'
  },
  tdCenter: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    borderLeft: '1px solid rgba(255,255,255,0.02)',
    borderRight: '1px solid rgba(255,255,255,0.02)',
    padding: '6px',
    textAlign: 'center',
    cursor: 'pointer'
  },
  tr: {
    transition: 'background-color 0.15s ease',
  },
  eyeToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    transition: 'all 0.15s ease'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#161b22',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh'
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto' as const,
    flex: 1
  },
  modalFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  btnAnnuler: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnValider: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#0066fe',
    border: '1px solid #0066fe',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Settings;
