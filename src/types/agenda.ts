export interface AgendaItem {
  id: string;
  boutique_id: string;
  titre: string;
  description?: string;
  date_prevue: string;
  type: 'TACHE' | 'ENTREE_PREVUE' | 'DEPENSE_PREVUE';
  montant: number;
  statut: 'A_FAIRE' | 'TERMINE' | 'ANNULE';
  created_at: string;
  updated_at: string;
  cree_par?: string;
}

export interface DailyMovement {
  id: string;
  type: 'ENTREE' | 'SORTIE' | 'AGENDA';
  montant: number;
  motif: string;
  date: string;
  statut?: string;
}
