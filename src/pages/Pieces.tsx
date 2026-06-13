import React, { useEffect, useState } from 'react';
import { showConfirm, showAlert } from '../utils/alerts';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { decodeAzertyBarcode } from '../utils/barcode';
import { getEAN13FromText } from '../utils/ean13';
import { 
  Plus, 
  X, 
  Search, 
  Edit, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Printer
} from 'lucide-react';

export interface PieceItem {
  id: string;
  piece_id?: string;
  reference: string;
  designation: string;
  marque: string;
  categorie: string;
  qte: number;
  achat: number;
  vente: number;
  stockStatus: 'OK' | 'Faible' | 'Rupture';
  code_barre?: string | null;
  compatibilite?: string;
  oem_number?: string;
  emplacement?: string;
  stock_minimum?: number;
  description?: string;
  lieu?: string;
  boutiquesIds?: string[];
  date_arrivage?: string;
}
const formatNum = (val: string | number | undefined | null) => {
  if (val === null || val === undefined || val === '') return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('fr-FR').format(parseInt(digits, 10)).replace(/\u202f/g, ' ');
};

const parseNum = (val: string | number | undefined | null) => {
  if (!val) return 0;
  return parseInt(String(val).replace(/\D/g, ''), 10) || 0;
};

export const Pieces: React.FC = () => {
  const { role, profile } = useAuth();
  
  const [pieces, setPieces] = useState<PieceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBoutique, setFilterBoutique] = useState('');
  const isDemoData = false;

  // Form / Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [printLabelPiece, setPrintLabelPiece] = useState<PieceItem | null>(null);

  // Inputs matching Nouvelle pièce screenshots 2 and 3
  const [reference, setReference] = useState('');
  const [codeBarre, setCodeBarre] = useState('');
  const [designation, setDesignation] = useState('');
  const [marque, setMarque] = useState('');
  const [categorie, setCategorie] = useState('');
  const [compatibilite, setCompatibilite] = useState('');
  const [oemNumber, setOemNumber] = useState('');
  const [emplacement, setEmplacement] = useState('');
  const [quantite, setQuantite] = useState('');
  const [stockMinimum, setStockMinimum] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [prixVente, setPrixVente] = useState('');
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  const [description, setDescription] = useState('');

  // Dropdown list options
  const [boutiques, setBoutiques] = useState<{ id: string; name: string }[]>([]);
  const [fournisseurs, setFournisseurs] = useState<{ id: string; nom: string }[]>([]);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = role === 'administrateur';

  const formatAr = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  };

  const fetchData = async () => {
    setLoading(true);

    const timeoutPromise = new Promise<any>((resolve) => 
      setTimeout(() => resolve({ isTimeout: true }), 15000)
    );

    const queryPromise = (async () => {
      const { data: piecesData, error: piecesErr } = await supabase.from('pieces').select('*');
      const { data: stockData } = await supabase.from('stock').select('*');
      const { data: suppliersData } = await supabase.from('piece_fournisseurs').select('*');
      
      const { data: listBoutiques } = await supabase.from('boutiques').select('id, name');
      const { data: listFournisseurs } = await supabase.from('fournisseurs').select('id, nom');

      if (listBoutiques) setBoutiques(listBoutiques);
      if (listFournisseurs) setFournisseurs(listFournisseurs);

      if (piecesErr) throw piecesErr;
      return { piecesData, stockData, suppliersData, listBoutiques };
    })();

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result && !result.isTimeout) {
        const { piecesData, stockData, suppliersData, listBoutiques } = result;
        const parsed: PieceItem[] = [];

        if (piecesData && piecesData.length > 0) {
          piecesData.forEach((item: any) => {
          const pieceStocks = stockData?.filter((s: any) => s.piece_id === item.id) || [];
          const spPrice = suppliersData?.find((s: any) => s.piece_id === item.id);
          const achatPrice = item.prix_achat || (spPrice ? Number(spPrice.prix_achat) : 0);
          const ventePrice = item.prix_vente || (achatPrice > 0 ? achatPrice * 1.5 : 0);

          if (pieceStocks.length === 0) {
            parsed.push({
              id: item.id,
              piece_id: item.id,
              reference: item.reference,
              designation: item.designation,
              marque: item.marque || '—',
              categorie: item.categorie || '—',
              qte: 0,
              achat: achatPrice,
              vente: ventePrice,
              stockStatus: 'Rupture',
              code_barre: item.code_barre || '',
              compatibilite: item.compatibilite || '',
              oem_number: item.oem_number || '',
              emplacement: '',
              stock_minimum: 5,
              description: item.description || '',
              lieu: '—',
              boutiquesIds: [],
              date_arrivage: item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '—'
            });
          } else {
            pieceStocks.forEach((s: any) => {
              const b = listBoutiques?.find((lb: any) => lb.id === s.boutique_id);
              const qty = Number(s.quantity_disponible || 0);
              const minStock = s.stock_minimum || 5;
              let status: 'OK' | 'Faible' | 'Rupture' = 'OK';
              if (qty === 0) status = 'Rupture';
              else if (qty <= minStock) status = 'Faible';

              parsed.push({
                id: `${item.id}-${s.boutique_id}`,
                piece_id: item.id,
                reference: item.reference,
                designation: item.designation,
                marque: item.marque || '—',
                categorie: item.categorie || '—',
                qte: qty,
                achat: achatPrice,
                vente: ventePrice,
                stockStatus: status,
                code_barre: item.code_barre || '',
                compatibilite: item.compatibilite || '',
                oem_number: item.oem_number || '',
                emplacement: s.emplacement || '',
                stock_minimum: minStock,
                description: item.description || '',
                lieu: b ? b.name : '—',
                boutiquesIds: [s.boutique_id],
                date_arrivage: item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '—'
              });
            });
          }
        });
        }

        setPieces(parsed);
        
      } else {
        setPieces([]);
      }
    } catch (err) {
      console.error('Error loading catalogue pieces, loading spectacular fallbacks:', err);
      setPieces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Chargement indépendant des boutiques et fournisseurs (sans dépendre du race de fetchData)
    (async () => {
      const { data: lb } = await supabase.from('boutiques').select('id, name');
      if (lb && lb.length > 0) setBoutiques(lb);
      const { data: lf } = await supabase.from('fournisseurs').select('id, nom');
      if (lf && lf.length > 0) setFournisseurs(lf);
    })();
  }, []);

  // Barcode Scanner Listener pour la recherche rapide dans le catalogue
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      const currentTime = Date.now();
      
      if (currentTime - lastKeyTime > 500) {
        barcodeBuffer = '';
      }
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
           e.preventDefault();
           e.stopPropagation();
           const scannedCode = decodeAzertyBarcode(barcodeBuffer).trim();
           barcodeBuffer = '';
           
const piece = pieces.find(p => 
              (p.code_barre && p.code_barre.trim() === scannedCode) || 
              (p.reference && p.reference.trim().toUpperCase() === scannedCode.toUpperCase()) ||
              (getEAN13FromText(p.code_barre || p.reference) === scannedCode)
            );
           if (piece) {
if (!isModalOpen) {
                setSearchQuery(piece.code_barre || piece.reference);
              } else {
               // Si on édite/crée déjà, et qu'on scanne une pièce existante, on pré-remplit juste le champ si on est dessus
               // Mais en global, mieux vaut laisser le champ ciblé faire son job.
             }
           } else {
             if (!isModalOpen) {
               // Pièce introuvable : on ouvre "Nouvelle pièce" et on pré-remplit
               setEditId(null);
               setReference('');
               setDesignation('');
               setMarque('');
               setCategorie('');
               setCompatibilite('');
               setOemNumber('');
               setEmplacement('');
               setQuantite('');
               setStockMinimum('');
               setPrixAchat('');
               setPrixVente('');
               setSelectedBoutique('GLOBAL');
               setSelectedFournisseur(fournisseurs[0]?.id || '');
               setDescription('');
               setErrorMsg(null);
               setSuccessMsg(null);
               setIsModalOpen(true);
               
               // Pré-remplir le code barres
               setCodeBarre(scannedCode);
             } else {
               // Modale déjà ouverte : remplir le code barres
               setCodeBarre(scannedCode);
             }
           }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, [isModalOpen, pieces, fournisseurs]);

  const handleOpenAddModal = () => {
    setEditId(null);
    setReference('');
    setCodeBarre('');
    setDesignation('');
    setMarque('');
    setCategorie('');
    setCompatibilite('');
    setOemNumber('');
    setEmplacement('');
    setQuantite('');
    setStockMinimum('');
    setPrixAchat('');
    setPrixVente('');
    setSelectedBoutique('GLOBAL');
    setSelectedFournisseur(fournisseurs[0]?.id || '');
    setDescription('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (piece: PieceItem) => {
    setEditId(piece.piece_id || piece.id);
    setReference(piece.reference);
    setCodeBarre(piece.code_barre || '');
    setDesignation(piece.designation);
    setMarque(piece.marque || '');
    setCategorie(piece.categorie || '');
    setCompatibilite(piece.compatibilite || '');
    setOemNumber(piece.oem_number || '');
    setEmplacement(piece.emplacement || '');
    setQuantite(piece.qte ? formatNum(piece.qte) : '');
    setStockMinimum(piece.stock_minimum ? formatNum(piece.stock_minimum) : '');
    setPrixAchat(piece.achat ? formatNum(piece.achat) : '');
    setPrixVente(piece.vente ? formatNum(piece.vente) : '');
    // Si la ligne correspond à une boutique spécifique, on la sélectionne
    if (piece.boutiquesIds && piece.boutiquesIds.length === 1) {
      setSelectedBoutique(piece.boutiquesIds[0]);
    } else if (boutiques.length > 0) {
      // Pour une pièce sans stock : sélectionner la 1ère boutique par défaut (plus sûr que GLOBAL)
      setSelectedBoutique(boutiques[0].id);
    } else {
      setSelectedBoutique('GLOBAL');
    }
    setSelectedFournisseur(fournisseurs[0]?.id || '');
    setDescription(piece.description || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !designation.trim()) {
      setErrorMsg("La référence et la pièce sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Toujours récupérer les boutiques en temps réel pour éviter les états périmés (race condition)
    const { data: currentBoutiques } = await supabase.from('boutiques').select('id, name');
    const activeBoutiques = (currentBoutiques && currentBoutiques.length > 0) ? currentBoutiques : boutiques;
    if (activeBoutiques.length > 0) setBoutiques(activeBoutiques); // sync le state aussi

    // Sécurité : si GLOBAL est sélectionné mais aucune boutique n'est chargée, bloquer l'enregistrement
    if (selectedBoutique === 'GLOBAL' && activeBoutiques.length === 0) {
      setErrorMsg("Impossible de déterminer les boutiques. Veuillez réessayer.");
      setIsSubmitting(false);
      return;
    }

    const payloadPiece = {
      reference: reference.toUpperCase().trim(),
      code_barre: codeBarre.trim() || null,
      designation: designation.trim(),
      marque: marque.trim() || null,
      categorie: categorie.trim() || null,
      compatibilite: compatibilite.trim() || null,
      oem_number: oemNumber.trim() || null,
      description: description.trim() || null,
      // ✅ FIX : sauvegarde les prix directement dans la table pieces
      // pour que Sales.tsx lise le bon prix sans dépendre d'un calcul approximatif
      prix_vente: parseNum(prixVente) || null,
      prix_achat: parseNum(prixAchat) || null,
    };

    try {
      if (isDemoData) {
        const qtyNum = parseNum(quantite);
        const minNum = parseNum(stockMinimum) || 5;
        let status: 'OK' | 'Faible' | 'Rupture' = 'OK';
        if (qtyNum === 0) status = 'Rupture';
        else if (qtyNum <= minNum) status = 'Faible';

        const newItem: PieceItem = {
          id: editId || 'mock-p-' + Math.random().toString(36).substring(7),
          reference: reference.toUpperCase().trim(),
          designation: designation.trim(),
          marque: marque.trim() || '—',
          categorie: categorie.trim() || '—',
          qte: qtyNum,
          achat: parseNum(prixAchat),
          vente: parseNum(prixVente),
          stockStatus: status,
          code_barre: codeBarre.trim(),
          compatibilite: compatibilite.trim(),
          oem_number: oemNumber.trim(),
          emplacement: emplacement.trim(),
          stock_minimum: minNum,
          description: description.trim()
        };

        if (editId) {
          setPieces(pieces.map(p => p.id === editId ? newItem : p));
        } else {
          setPieces([newItem, ...pieces]);
        }

        setSuccessMsg("Pièce enregistrée localement.");
        setTimeout(() => setIsModalOpen(false), 800);
        return;
      }

      if (editId) {
        // Update existing
        const { error } = await supabase
          .from('pieces')
          .update(payloadPiece)
          .eq('id', editId);
        if (error) throw error;

        // ✅ GLOBAL SPLIT : la quantité totale est divisée équitablement entre les boutiques.
        // Exemple : 40 unités avec 2 boutiques = 20 + 20 (total affiché = 40).
        // Les prix (achat/vente) restent identiques pour toutes les boutiques.
        if (selectedBoutique === 'GLOBAL' && activeBoutiques.length > 0) {
          const totalQty = parseNum(quantite);
          const qtyPerBoutique = Math.floor(totalQty / activeBoutiques.length);
          const remainder = totalQty % activeBoutiques.length; // le reste va à la 1ère boutique

          for (let i = 0; i < activeBoutiques.length; i++) {
            const b = activeBoutiques[i];
            const qtyForThisBoutique = qtyPerBoutique + (i === 0 ? remainder : 0);
            console.log('[Stock GLOBAL update] boutique:', b.name, 'qty:', qtyForThisBoutique);
            const { data: existStock } = await supabase
              .from('stock')
              .select('id')
              .eq('piece_id', editId)
              .eq('boutique_id', b.id)
              .maybeSingle();

            if (existStock) {
              const { error: stockErr } = await supabase.from('stock').update({
                quantity_disponible: qtyForThisBoutique,
                stock_minimum: parseNum(stockMinimum) || 5,
                emplacement: emplacement.trim() || null
              }).eq('id', existStock.id);
              if (stockErr) throw stockErr;
            } else {
              const { error: stockErr } = await supabase.from('stock').insert({
                piece_id: editId,
                boutique_id: b.id,
                quantity_disponible: qtyForThisBoutique,
                quantity_achetee: qtyForThisBoutique,
                stock_minimum: parseNum(stockMinimum) || 5,
                emplacement: emplacement.trim() || null
              });
              if (stockErr) throw stockErr;
            }
          }
        } else if (selectedBoutique && selectedBoutique !== 'GLOBAL') {
          console.log('[Stock specific] boutique_id:', selectedBoutique, 'qty:', parseNum(quantite));
          const { data: existStock } = await supabase
            .from('stock')
            .select('id')
            .eq('piece_id', editId)
            .eq('boutique_id', selectedBoutique)
            .maybeSingle();

          if (existStock) {
            console.log('[Stock] Mise à jour stock existant id:', existStock.id);
            const { error: stockErr } = await supabase.from('stock').update({
              quantity_disponible: parseNum(quantite),
              stock_minimum: parseNum(stockMinimum) || 5,
              emplacement: emplacement.trim() || null
            }).eq('id', existStock.id);
            if (stockErr) throw stockErr;
          } else {
            console.log('[Stock] Insertion nouveau stock pour pièce:', editId, 'boutique:', selectedBoutique);
            const { error: stockErr } = await supabase.from('stock').insert({
              piece_id: editId,
              boutique_id: selectedBoutique,
              quantity_disponible: parseNum(quantite),
              quantity_achetee: parseNum(quantite),
              stock_minimum: parseNum(stockMinimum) || 5,
              emplacement: emplacement.trim() || null
            });
            if (stockErr) throw stockErr;
          }
        }
        
        // Update piece_fournisseurs
        if (selectedFournisseur && parseNum(prixAchat) > 0) {
          await supabase.from('piece_fournisseurs').upsert({
            piece_id: editId,
            fournisseur_id: selectedFournisseur,
            prix_achat: parseNum(prixAchat)
          }, { onConflict: 'piece_id,fournisseur_id' });
        }
      } else {
        // Insert new piece
        const { data: newPiece, error: pieceErr } = await supabase
          .from('pieces')
          .insert(payloadPiece)
          .select('*')
          .single();

        if (pieceErr) throw pieceErr;

        // ✅ GLOBAL SPLIT en création : quantité divisée entre les boutiques.
        // Exemple : 40 avec 2 boutiques = 20 pour chaque. Total affiché = 40.
        if (selectedBoutique === 'GLOBAL') {
          const totalQty = parseNum(quantite);
          const qtyPerBoutique = Math.floor(totalQty / activeBoutiques.length);
          const remainder = totalQty % activeBoutiques.length;
          const stockInserts = activeBoutiques.map((b, i) => ({
            piece_id: newPiece.id,
            boutique_id: b.id,
            quantity_disponible: qtyPerBoutique + (i === 0 ? remainder : 0),
            quantity_achetee: qtyPerBoutique + (i === 0 ? remainder : 0),
            stock_minimum: parseNum(stockMinimum) || 5,
            emplacement: emplacement.trim() || null
          }));
          const { error: stockErr } = await supabase.from('stock').insert(stockInserts);
          if (stockErr) throw stockErr;
        } else if (selectedBoutique) {
          const { error: stockErr } = await supabase.from('stock').insert({
            piece_id: newPiece.id,
            boutique_id: selectedBoutique,
            quantity_disponible: parseNum(quantite),
            quantity_achetee: parseNum(quantite),
            stock_minimum: parseNum(stockMinimum) || 5,
            emplacement: emplacement.trim() || null
          });
          if (stockErr) throw stockErr;
        }

        // Insert piece supplier price
        if (selectedFournisseur && parseNum(prixAchat) > 0) {
          await supabase.from('piece_fournisseurs').insert({
            piece_id: newPiece.id,
            fournisseur_id: selectedFournisseur,
            prix_achat: parseNum(prixAchat)
          });
        }
      }

      setSuccessMsg("Pièce enregistrée avec succès.");
      await fetchData(); // attend le rechargement complet avant de fermer le modal
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("DB save error:", err);
      showAlert(`Erreur d'enregistrement : ${err.message || 'Erreur inconnue'}`, 'error');
      // On ne simule plus localement pour forcer à corriger l'erreur DB
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Voulez-vous vraiment supprimer cette pièce du catalogue ?", true);
    if (!confirmed) return;
    try {
      if (isDemoData) {
        setPieces(pieces.filter(p => p.id !== id));
        return;
      }

      const { error } = await supabase.from('pieces').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      showAlert("Erreur lors de la suppression : " + err.message, 'error');
    }
  };

  const filteredPieces = pieces.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return filterBoutique === '' || (p.boutiquesIds && p.boutiquesIds.includes(filterBoutique));
    }
    const matchesSearch = 
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.designation && p.designation.toLowerCase().includes(q)) ||
      (p.marque && p.marque.toLowerCase().includes(q)) ||
      (p.categorie && p.categorie.toLowerCase().includes(q)) ||
      (p.code_barre && p.code_barre.toLowerCase().includes(q));
      
    const matchesBoutique = filterBoutique === '' || (p.boutiquesIds && p.boutiquesIds.includes(filterBoutique));
    
    return matchesSearch && matchesBoutique;
  });

  const totalReferences = filteredPieces.length;
  const totalUnits = filteredPieces.reduce((acc, curr) => acc + curr.qte, 0);

  return (
    <div style={s.container}>
      
      {/* HEADER SECTION exactly matching reference screenshot */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Pièces automobiles</h1>
          <p style={s.pageSubtitle}>
            {totalReferences} références — {totalUnits} unités
          </p>
        </div>
        {isAdmin && (
          <button style={s.addBtn} onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Nouvelle pièce</span>
          </button>
        )}
      </div>

      {/* SEARCH BAR exactly matching reference screenshot */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={s.searchWrapper}>
          <Search size={16} style={s.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher par référence, pièce, marque..."
            style={s.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          style={{ ...s.searchInput, width: '250px', paddingLeft: '12px', cursor: 'pointer', appearance: 'auto' }}
          value={filterBoutique}
          onChange={(e) => setFilterBoutique(e.target.value)}
        >
          <option value="">Tous les professionnels (Boutiques)</option>
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* TABLE WRAPPER CONTAINER */}
      {loading ? (
        <div style={s.loadingWrapper}>
          <div style={s.spinner}></div>
          <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.45)', fontSize: '13.5px' }}>Chargement du catalogue...</p>
        </div>
      ) : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>RÉFÉRENCE</th>
                <th style={s.th}>PIÈCE</th>
                <th style={s.th}>MARQUE</th>
                <th style={s.th}>DATE D'ARRIVAGE</th>
                <th style={s.th}>LIEU</th>
                <th style={s.th}>QTÉ</th>
                <th style={s.th}>ACHAT</th>
                <th style={s.th}>VENTE</th>
                <th style={s.th}>STOCK</th>
                <th style={{ ...s.th, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPieces.map((piece) => (
                <tr key={piece.id} style={s.tr}>
                  <td style={{ ...s.td, fontWeight: '700', color: 'rgba(255, 255, 255, 0.45)' }}>{piece.reference}</td>
                  <td style={{ ...s.td, fontWeight: '700', color: '#0066fe' }}>{piece.designation}</td>
                  <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)' }}>{piece.marque}</td>
                  <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)' }}>{piece.date_arrivage}</td>
                  <td style={{ ...s.td, color: 'rgba(255,255,255,0.8)', fontSize: '12px', textTransform: 'uppercase' }}>{piece.lieu || '—'}</td>
                  <td style={{ ...s.td, fontWeight: '700' }}>{piece.qte}</td>
                  <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)' }}>{formatAr(piece.achat)}</td>
                  <td style={{ ...s.td, fontWeight: '700' }}>{formatAr(piece.vente)}</td>
                  
                  {/* Status badges matching reference screenshot 1 */}
                  <td style={s.td}>
                    {piece.stockStatus === 'OK' && (
                      <span style={s.badgeOk}>OK</span>
                    )}
                    {piece.stockStatus === 'Faible' && (
                      <span style={s.badgeWarning}>Faible</span>
                    )}
                    {piece.stockStatus === 'Rupture' && (
                      <span style={s.badgeDanger}>Rupture</span>
                    )}
                  </td>

                  {/* Actions buttons */}
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <div style={s.actionGroup}>
                      <button style={{ ...s.actionBtn, color: '#10b981' }} onClick={() => setPrintLabelPiece(piece)} title="Imprimer Étiquette">
                        <Printer size={14} />
                      </button>
                      <button style={s.actionBtn} onClick={() => handleOpenEditModal(piece)} title="Modifier">
                        <Edit size={14} />
                      </button>
                      {isAdmin && (
                        <button style={{ ...s.actionBtn, color: '#ef4444' }} onClick={() => handleDelete(piece.piece_id || piece.id)} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPieces.length === 0 && (
                <tr>
                  <td colSpan={9} style={s.emptyCell}>Aucune pièce trouvée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL OVERLAY: NOUVELLE PIÈCE ─────────────── */}
      {isModalOpen && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            
            {/* Header */}
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{editId ? "Modifier pièce" : "Nouvelle pièce"}</h3>
              <button style={s.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={s.modalBody}>
                
                {errorMsg && (
                  <div style={s.alertBox}>
                    <AlertCircle size={15} style={{ marginRight: '6px' }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div style={s.successBox}>
                    <CheckCircle2 size={15} style={{ marginRight: '6px' }} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Grid Inputs matching screenshot 2 and 3 */}
                <div style={s.modalGrid}>
                  
                  {/* Row 1 */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Référence *</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="ex: FILT-ESS-307"
                      required
                    />
                  </div>
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Pièce *</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="ex: Filtre à Essence"
                      required
                    />
                  </div>

                  {/* Row 2 */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Code-barres (Scan)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text"
                        style={{ ...s.inputField, flex: 1 }}
                        value={codeBarre}
                        onChange={(e) => setCodeBarre(decodeAzertyBarcode(e.target.value))}
                        placeholder="Scannez ou tapez le code"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Génération automatique d'un code EAN-13 valide
                          let code = '20'; // Préfixe 20 réservé pour usage interne en magasin
                          for (let i = 0; i < 10; i++) {
                            code += Math.floor(Math.random() * 10);
                          }
                          let sum = 0;
                          for (let i = 0; i < 12; i++) {
                            sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
                          }
                          const checksum = (10 - (sum % 10)) % 10;
                          setCodeBarre(code + checksum);
                        }}
                        style={{
                          backgroundColor: '#0066fe',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'background-color 0.2s ease',
                        }}
                        title="Générer un code-barres EAN-13 valide"
                      >
                        ⚡ Générer EAN-13
                      </button>
                    </div>
                  </div>
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Marque</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={marque}
                      onChange={(e) => setMarque(e.target.value)}
                      placeholder="ex: Bosch, Purflux..."
                    />
                  </div>

                  {/* Row 3 */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Catégorie</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={categorie}
                      onChange={(e) => setCategorie(e.target.value)}
                      placeholder="ex: Filtration, Freinage..."
                    />
                  </div>
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Numéro OEM</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={oemNumber}
                      onChange={(e) => setOemNumber(e.target.value)}
                      placeholder="ex: 1567.C6"
                    />
                  </div>

                  {/* Row 4 - Full Width Compatibilité véhicule */}
                  <div style={{ ...s.inputContainer, gridColumn: 'span 2' }}>
                    <label style={s.inputLabel}>Compatibilité véhicule</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={compatibilite}
                      onChange={(e) => setCompatibilite(e.target.value)}
                      placeholder="ex: Peugeot 307 1.6 16V, Citroen C4..."
                    />
                  </div>

                  {/* Row 5 */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Emplacement</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={emplacement}
                      onChange={(e) => setEmplacement(e.target.value)}
                      placeholder="ex: Étagère A-4"
                    />
                  </div>
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Quantité</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={quantite}
                      onChange={(e) => setQuantite(formatNum(e.target.value))}
                      placeholder=""
                    />
                  </div>

                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Stock minimum</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={stockMinimum}
                      onChange={(e) => setStockMinimum(formatNum(e.target.value))}
                      placeholder=""
                    />
                  </div>

                  {/* Row 7 */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Prix d'achat (Ar)</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={prixAchat}
                      onChange={(e) => setPrixAchat(formatNum(e.target.value))}
                      placeholder=""
                    />
                  </div>
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Prix de vente (Ar)</label>
                    <input 
                      type="text"
                      style={s.inputField}
                      value={prixVente}
                      onChange={(e) => setPrixVente(formatNum(e.target.value))}
                      placeholder=""
                    />
                  </div>

                  {/* Row 8 - Boutiques / Fournisseurs list */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Boutique</label>
                    <select
                      style={s.selectField}
                      value={selectedBoutique}
                      onChange={(e) => setSelectedBoutique(e.target.value)}
                    >
                      <option value="GLOBAL">GLOBAL (Toutes les boutiques)</option>
                      {boutiques.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Fournisseur principal</label>
                    <select
                      style={s.selectField}
                      value={selectedFournisseur}
                      onChange={(e) => setSelectedFournisseur(e.target.value)}
                    >
                      {fournisseurs.map((f) => (
                        <option key={f.id} value={f.id}>{f.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 9 - Full Width Description */}
                  <div style={{ ...s.inputContainer, gridColumn: 'span 2' }}>
                    <label style={s.inputLabel}>Description</label>
                    <textarea 
                      style={s.textareaField}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Entrez des détails supplémentaires sur l'utilisation de cette pièce..."
                      rows={3}
                    />
                  </div>

                </div>

              </div>

              {/* Modal Buttons */}
              <div style={s.modalFooter}>
                <button 
                  type="button"
                  style={s.btnAnnuler} 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  style={{ ...s.btnAnnuler, backgroundColor: '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <div style={{ ...s.spinner, width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px' }}></div> : null}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL D'IMPRESSION D'ÉTIQUETTE ─────────────── */}
      {printLabelPiece && (() => {
        const piece = printLabelPiece;
        const barcodeText = piece.code_barre || piece.reference;
        
        // Détecter dynamiquement le type de code-barres (EAN-13 si numérique)
        const isOnlyDigits = /^\d+$/.test(barcodeText);
        let bcid = 'code128';
        if (isOnlyDigits) {
          if (barcodeText.length === 12 || barcodeText.length === 13) {
            bcid = 'ean13';
          } else if (barcodeText.length === 8) {
            bcid = 'ean8';
          } else if (barcodeText.length === 11) {
            bcid = 'upca';
          }
        }
        
const ean13Code = getEAN13FromText(barcodeText);
        // scale=2 → ~5cm large sur imprimante 203dpi, height=25mm → ~3cm de barres
        const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=ean13&text=${encodeURIComponent(ean13Code)}&scale=3&height=25&includetext&textsize=12&textxalign=center`;
        const prixFormate = new Intl.NumberFormat('fr-FR').format(piece.vente);
        const nomCourt = piece.designation.length > 28 ? piece.designation.substring(0, 25) + '...' : piece.designation;

        // Impression intelligente dans une fenêtre dédiée — compatible toute imprimante thermique
        const handlePrintLabel = () => {
          const pw = window.open('', '_blank', 'width=320,height=480,menubar=no,toolbar=no,scrollbars=no');
          if (!pw) { window.print(); return; }
          pw.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Étiquette — ${nomCourt}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 58mm; background: #fff; }
    @page { size: 58mm 50mm; margin: 0; }
    .label {
      width: 58mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2mm 2mm 1mm 2mm;
      font-family: Arial, sans-serif;
      text-align: center;
      background: #fff;
    }
    .label-name { font-size: 8pt; font-weight: 900; text-transform: uppercase; line-height: 1.2; margin-bottom: 1mm; }
    .label-ref  { font-size: 7pt; color: #333; font-weight: 600; margin-bottom: 1.5mm; }
    /* BARCODE : exactement 5cm × 3cm */
    .label-img  { width: 50mm; height: 30mm; object-fit: fill; display: block; }
  </style>
</head>
<body>
  <div class="label">
    <div class="label-name">${nomCourt}</div>
    <div class="label-ref">Réf: ${piece.reference}</div>
    <img class="label-img" src="${barcodeUrl}" alt="Barcode"
      onload="window.focus(); window.print(); setTimeout(function(){ window.close(); }, 800);"
      onerror="window.focus(); window.print(); setTimeout(function(){ window.close(); }, 800);" />
  </div>
</body>
</html>`);
          pw.document.close();
        };

        return (
          <div style={s.modalOverlay}>
            <div style={{ ...s.modalCard, maxWidth: '400px' }}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitle}>🏷️ Étiquette Code-barres</h3>
                <button style={s.modalCloseBtn} onClick={() => setPrintLabelPiece(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Aperçu de l'étiquette */}
              <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', backgroundColor: '#0d1117' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aperçu étiquette (60mm × 40mm)</div>
                <div style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  width: '320px',
                  minHeight: '200px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxSizing: 'border-box'
                }}>
                  {/* Nom */}
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#000', lineHeight: '1.2', textTransform: 'uppercase', textAlign: 'center' }}>
                    {nomCourt}
                  </div>
                  {/* Référence */}
                  <div style={{ fontSize: '10px', color: '#555', fontWeight: '700' }}>
                    Réf: {piece.reference}
                  </div>
                  {/* Code-barres — proportions réelles 5cm × 3cm */}
                  <img
                    src={barcodeUrl}
                    alt="Code Barres"
                    style={{
                      width: '250px',   /* ~5cm à 96dpi */
                      height: '115px',  /* ~3cm à 96dpi */
                      objectFit: 'fill',
                      margin: '8px 0 4px',
                      imageRendering: 'crisp-edges',
                      display: 'block'
                    }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: '1.5' }}>
                  ✅ Compatible imprimante thermique 58mm / 80mm<br/>
                  🔍 Code: <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{barcodeText}</span>
                </div>
              </div>

              <div style={s.modalFooter}>
                <button style={s.btnAnnuler} onClick={() => setPrintLabelPiece(null)}>Fermer</button>
                <button
                  style={{ ...s.btnAnnuler, backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={handlePrintLabel}
                >
                  <Printer size={16} />
                  Imprimer l'étiquette
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

// ─── STYLES MATCHING THE REFERENCE PRECISELY ───────────
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0066fe',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 102, 254, 0.25)',
    transition: 'all 0.2s ease'
  },

  // Search input matching standard top bar search wrapper
  searchWrapper: {
    position: 'relative',
    maxWidth: '450px',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255, 255, 255, 0.35)',
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px 9px 38px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#161b22',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.15s ease'
  },

  // Premium glassmorphism table container
  tableWrapper: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '14px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.35)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    letterSpacing: '0.05em'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '14px 12px',
    fontSize: '13.5px',
    color: '#ffffff'
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13.5px'
  },

  // Status Badges
  badgeOk: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#ffffff',
    fontSize: '11.5px',
    fontWeight: '700',
    letterSpacing: '0.01em',
    textTransform: 'uppercase'
  },
  badgeWarning: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 12px',
    borderRadius: '6px',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: '11.5px',
    fontWeight: '700',
    letterSpacing: '0.01em',
    textTransform: 'uppercase'
  },
  badgeDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 12px',
    borderRadius: '6px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '11.5px',
    fontWeight: '700',
    letterSpacing: '0.01em',
    textTransform: 'uppercase'
  },

  // Actions Group
  actionGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.45)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },

  // Loading indicator
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px'
  },
  spinner: {
    width: '26px',
    height: '26px',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderTopColor: '#0066fe',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },

  // Modal styles exact match to screenshot 2 and 3
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.45)',
    cursor: 'pointer',
    padding: '2px'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
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
  selectField: {
    width: '100%',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13.5px',
    outline: 'none'
  },
  textareaField: {
    width: '100%',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13.5px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit'
  },

  // Alert panels
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#ef4444',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '16px'
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#22c55e',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '16px'
  },

  // Footer buttons
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    backgroundColor: '#0d1117'
  },
  btnAnnuler: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  btnValider: {
    backgroundColor: '#0066fe',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};
