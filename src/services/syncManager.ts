import { supabase } from './supabaseClient';
import { db } from './db';
import type { PendingVente } from './db';

// Met à jour la copie locale du catalogue et des stocks depuis Supabase
export const syncDown = async (boutiqueId?: string) => {
  if (!navigator.onLine) return false;

  try {
    // 1. Fetch Pieces
    const { data: piecesData, error: piecesErr } = await supabase
      .from('pieces')
      .select('id, reference, designation, prix_achat, prix_vente');
    
    if (piecesErr) throw piecesErr;
    
    // 2. Fetch Stock (pour toutes les boutiques ou juste la boutique connectée)
    let stockQuery = supabase
      .from('stock')
      .select('id, piece_id, boutique_id, quantity_disponible');
      
    if (boutiqueId) {
      stockQuery = stockQuery.eq('boutique_id', boutiqueId);
    }
    
    const { data: stockData, error: stockErr } = await stockQuery;
    
    if (stockErr) throw stockErr;

    // Utilisation de transactions Dexie pour assurer l'intégrité
    await db.transaction('rw', db.pieces, db.stock, async () => {
      // On vide les tables avant d'insérer les nouvelles données
      await db.pieces.clear();
      await db.stock.clear();
      
      if (piecesData) {
        await db.pieces.bulkAdd(piecesData);
      }
      if (stockData) {
        await db.stock.bulkAdd(stockData);
      }
    });

    console.log('[SyncManager] Catalogue et Stock synchronisés localement.');
    return true;
  } catch (error) {
    console.error('[SyncManager] Erreur lors du syncDown:', error);
    return false;
  }
};

// Pousse les ventes hors-ligne vers Supabase
export const syncUp = async () => {
  if (!navigator.onLine) return false;

  try {
    const pendingVentes = await db.pending_ventes.toArray();
    
    if (pendingVentes.length === 0) {
      return true; // Rien à synchroniser
    }

    console.log(`[SyncManager] Début de synchronisation de ${pendingVentes.length} ventes hors-ligne.`);

    const isValidUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

    for (const vente of pendingVentes) {
      // 1. Insérer la vente principale
      const { data: insertedVente, error: venteErr } = await supabase
        .from('ventes')
        .insert({
          boutique_id: isValidUUID(vente.boutique_id) ? vente.boutique_id : null,
          caissier_id: isValidUUID(vente.vendeur_id) ? vente.vendeur_id : null,
          statut_paiement: vente.statut_paiement || 'PAYE',
          client_id: vente.client_id || null,
          montant_paye: vente.montant_paye !== undefined ? vente.montant_paye : vente.total,
          total: vente.total,
          created_at: vente.created_at
        })
        .select()
        .single();
        
      if (venteErr) {
        console.error('[SyncManager] Erreur insertion vente:', venteErr);
        alert(`Erreur de synchronisation (Vente principale) : ${venteErr.message || JSON.stringify(venteErr)}`);
        continue; // Passe à la vente suivante en cas d'erreur
      }

      // 2. Préparer et insérer les détails
      if (insertedVente && vente.details.length > 0) {
        const detailsToInsert = vente.details.map(d => ({
          vente_id: insertedVente.id,
          piece_id: d.piece_id,
          quantite: d.quantite,
          prix_vente: d.prix_vente,
          remise: 0,
          total: d.total
        }));

        const { error: detailsErr } = await supabase
          .from('details_ventes')
          .insert(detailsToInsert);
          
        if (detailsErr) {
          console.error('[SyncManager] Erreur insertion détails_ventes:', detailsErr);
          alert(`Erreur de synchronisation (Détails) : ${detailsErr.message || JSON.stringify(detailsErr)}`);
          // Delete the incomplete main sale to retry later
          await supabase.from('ventes').delete().eq('id', insertedVente.id);
          continue; // Stop processing this sale, retry later
        }
      }

      // 4. Si tout est réussi, on supprime la vente locale de la file d'attente
      await db.pending_ventes.delete(vente.id);
    }
    
    // 5. SYNCHRONISATION DES ACHATS HORS-LIGNE
    const pendingAchats = await db.pending_achats.toArray();
    for (const achat of pendingAchats) {
      const { data: insertedAchat, error: achatErr } = await supabase
        .from('achats')
        .insert({
          fournisseur_id: achat.fournisseur_id,
          boutique_id: isValidUUID(achat.boutique_id) ? achat.boutique_id : null,
          utilisateur_id: isValidUUID(achat.utilisateur_id) ? achat.utilisateur_id : null,
          total: achat.total,
          created_at: achat.created_at
        })
        .select()
        .single();

      if (achatErr) {
        console.error('[SyncManager] Erreur insertion achat:', achatErr);
        continue;
      }

      if (insertedAchat && achat.details.length > 0) {
        const detailsToInsert = achat.details.map(d => ({
          achat_id: insertedAchat.id,
          piece_id: d.piece_id,
          quantite: d.quantite,
          prix_unitaire: d.prix_unitaire,
          remise: d.remise,
          total: d.total
        }));
        await supabase.from('details_achats').insert(detailsToInsert);
      }
      await db.pending_achats.delete(achat.id);
    }

    // 6. SYNCHRONISATION DES DÉPENSES HORS-LIGNE
    const pendingDepenses = await db.pending_depenses.toArray();
    for (const depense of pendingDepenses) {
      const { error: depErr } = await supabase.from('depenses').insert({
        motif: depense.motif,
        montant: depense.montant,
        boutique_id: isValidUUID(depense.boutique_id) ? depense.boutique_id : null,
        utilisateur_id: isValidUUID(depense.utilisateur_id) ? depense.utilisateur_id : null,
        created_at: depense.created_at
      });
      if (!depErr) {
        await db.pending_depenses.delete(depense.id);
      }
    }

    console.log('[SyncManager] Synchronisation complète (Ventes, Achats, Dépenses) terminée avec succès.');
    // Re-synchroniser les stocks vers le local après l'upload
    await syncDown(pendingVentes[0]?.boutique_id || pendingAchats[0]?.boutique_id);
    return true;
  } catch (error: any) {
    console.error('[SyncManager] Erreur générale lors du syncUp:', error);
    alert(`Erreur générale SyncUp : ${error.message || JSON.stringify(error)}`);
    return false;
  }
};

// Listener global
export const initSyncListeners = (boutiqueId?: string) => {
  window.addEventListener('online', () => {
    console.log('[SyncManager] Connexion rétablie. Lancement du SyncUp...');
    syncUp();
  });
  
  // Faire un syncDown initial au chargement de l'app si on est en ligne
  if (navigator.onLine) {
    syncDown(boutiqueId);
    syncUp(); // Au cas où des ventes étaient restées bloquées
  }
};
