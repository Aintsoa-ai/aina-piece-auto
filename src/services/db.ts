import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface Piece {
  id: string;
  reference: string;
  code_barre?: string | null;
  designation: string;
  prix_achat: number;
  prix_vente: number;
}

export interface Stock {
  id: string;
  piece_id: string;
  boutique_id: string;
  quantity_disponible: number;
}

export interface PendingVente {
  id: string; // uuid v4 local
  boutique_id: string;
  vendeur_id: string;
  client_nom: string;
  client_contact: string;
  status: string;
  statut_paiement?: string;
  client_id?: string;
  montant_paye?: number;
  total: number;
  created_at: string;
  details: {
    piece_id: string;
    quantite: number;
    prix_vente: number;
    total: number;
  }[];
}

export class AinaDatabase extends Dexie {
  pieces!: Table<Piece>;
  stock!: Table<Stock>;
  pending_ventes!: Table<PendingVente>;

  constructor() {
    super('AinaDatabase');
    this.version(1).stores({
      pieces: 'id, reference, designation',
      stock: 'id, piece_id, boutique_id, [piece_id+boutique_id]',
      pending_ventes: 'id, boutique_id, created_at'
    });
  }
}

export const db = new AinaDatabase();
