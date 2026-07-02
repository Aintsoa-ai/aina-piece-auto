import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { AgendaItem, DailyMovement } from '../types/agenda';
import { useAuth } from '../context/AuthContext';

export const useAgenda = (selectedDate: Date) => {
  const { profile, role } = useAuth();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [movements, setMovements] = useState<DailyMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalEntrees, setTotalEntrees] = useState(0);
  const [totalSorties, setTotalSorties] = useState(0);
  const [soldeCaisse, setSoldeCaisse] = useState(0);
  
  // Predictions / Alerts
  const [expectedExpenses, setExpectedExpenses] = useState(0);

  const fetchAgendaData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dateStr = selectedDate.toISOString().split('T')[0];

      // 1. Fetch Agenda items for the selected month/day
      let query = supabase.from('agenda').select('*');
      if (profile.boutique_id) {
        query = query.eq('boutique_id', profile.boutique_id);
      }
      const { data: agendaData, error: agendaError } = await query.order('date_prevue', { ascending: true });
      if (agendaError) throw agendaError;
      setItems(agendaData || []);

      // 2. Fetch today's Sales (Entrées)
      let salesQuery = supabase.from('ventes').select('id, total, created_at').gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      if (profile.boutique_id) salesQuery = salesQuery.eq('boutique_id', profile.boutique_id);
      const { data: salesData } = await salesQuery;

      // 3. Fetch today's Expenses (Sorties)
      let expensesQuery = supabase.from('depenses').select('id, montant, motif, created_at').gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      if (profile.boutique_id) expensesQuery = expensesQuery.eq('boutique_id', profile.boutique_id);
      const { data: expensesData } = await expensesQuery;

      // Build daily movements
      let dailyTotalIn = 0;
      let dailyTotalOut = 0;
      const allMovements: DailyMovement[] = [];

      salesData?.forEach(s => {
        dailyTotalIn += Number(s.total);
        allMovements.push({
          id: s.id,
          type: 'ENTREE',
          montant: Number(s.total),
          motif: 'Vente',
          date: s.created_at
        });
      });

      expensesData?.forEach(e => {
        dailyTotalOut += Number(e.montant);
        allMovements.push({
          id: e.id,
          type: 'SORTIE',
          montant: Number(e.montant),
          motif: `Dépense: ${e.motif}`,
          date: e.created_at
        });
      });

      // Fetch active caisse to get current balance
      let caisseQuery = supabase.from('caisse').select('*').eq('statut', 'OUVERT').limit(1);
      if (profile.boutique_id) caisseQuery = caisseQuery.eq('boutique_id', profile.boutique_id);
      const { data: caisseData } = await caisseQuery;
      
      let currentCaisse = 0;
      if (caisseData && caisseData.length > 0) {
        currentCaisse = Number(caisseData[0].montant_debut) + dailyTotalIn - dailyTotalOut;
      }
      setSoldeCaisse(currentCaisse);

      // Check expected expenses for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const futureExpenses = (agendaData || [])
        .filter(a => a.date_prevue === tomorrowStr && a.type === 'DEPENSE_PREVUE' && a.statut === 'A_FAIRE')
        .reduce((sum, item) => sum + Number(item.montant), 0);
        
      setExpectedExpenses(futureExpenses);
      
      setTotalEntrees(dailyTotalIn);
      setTotalSorties(dailyTotalOut);
      
      // Add agenda items of today to movements for timeline
      (agendaData || []).filter(a => a.date_prevue === dateStr).forEach(a => {
        allMovements.push({
          id: a.id,
          type: 'AGENDA',
          montant: Number(a.montant),
          motif: a.titre,
          date: new Date(`${a.date_prevue}T12:00:00Z`).toISOString(), // mock time
          statut: a.statut
        });
      });

      allMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMovements(allMovements);

    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de l'agenda.");
    } finally {
      setLoading(false);
    }
  }, [profile, selectedDate]);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  const addAgendaItem = async (item: Partial<AgendaItem>) => {
    try {
      const payload = {
        ...item,
        boutique_id: profile?.boutique_id,
        cree_par: profile?.id
      };
      const { error } = await supabase.from('agenda').insert([payload]);
      if (error) throw error;
      await fetchAgendaData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const updateAgendaItem = async (id: string, updates: Partial<AgendaItem>) => {
    try {
      const { error } = await supabase.from('agenda').update(updates).eq('id', id);
      if (error) throw error;
      await fetchAgendaData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteAgendaItem = async (id: string) => {
    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      await fetchAgendaData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    items,
    movements,
    totalEntrees,
    totalSorties,
    soldeCaisse,
    expectedExpenses,
    loading,
    error,
    addAgendaItem,
    updateAgendaItem,
    deleteAgendaItem,
    refresh: fetchAgendaData
  };
};
