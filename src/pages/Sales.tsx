import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Printer, AlertCircle, Plus, Search, CheckCircle2, X, ShoppingCart, User, ArrowRight, TrendingUp } from 'lucide-react';
import { db } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface SaleItem {
  id: string;
  date: string;
  piece_name: string;
  piece_ref?: string;
  vendeur: string;
  boutique_name?: string;
  quantity: number;
  pu: number;
  total: number;
  benefice: number;
}

interface CartItem {
  piece: PieceItem;
  quantity: number;
}

interface PieceItem {
  id: string; // This is the stock_id
  piece_id?: string; // This is the actual piece_id
  reference: string;
  code_barre?: string | null;
  designation: string;
  marque: string;
  prix_vente: number;
  quantity_disponible: number;
  prix_achat: number;
}

export const Sales: React.FC = () => {
  const { t } = useSettings();
  const { profile, role } = useAuth();
  
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [pieces, setPieces] = useState<PieceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isDemoData = false;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [vendeurName, setVendeurName] = useState<string>('');
  const [selectedBoutique, setSelectedBoutique] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Receipt Modal
  const [receiptSale, setReceiptSale] = useState<SaleItem | null>(null);
  const [dbBoutiques, setDbBoutiques] = useState<any[]>([]);
  const [boutiqueInfos, setBoutiqueInfos] = useState<Record<string, any>>({});

  // Pixel perfect Mock Sales matching screenshot 1
  const demoSales: SaleItem[] = [
    {
      id: 's1',
      date: '19/05/2026 16:57',
      piece_name: 'Filtre à huile',
      piece_ref: 'FH-001',
      vendeur: 'Jean Employé',
      quantity: 5,
      pu: 38000,
      total: 190000,
      benefice: 65000
    },
    {
      id: 's2',
      date: '20/05/2026 16:57',
      piece_name: 'Plaquettes de frein avant',
      piece_ref: 'PF-022',
      vendeur: 'Marie Caisse',
      quantity: 2,
      pu: 125000,
      total: 245000,
      benefice: 75000
    },
    {
      id: 's3',
      date: '21/05/2026 16:57',
      piece_name: 'Batterie 60Ah',
      piece_ref: 'BT-60A',
      vendeur: 'Marie Caisse',
      quantity: 1,
      pu: 450000,
      total: 450000,
      benefice: 130000
    },
    {
      id: 's4',
      date: '21/05/2026 16:57',
      piece_name: 'Courroie de distribution',
      piece_ref: 'CD-120',
      vendeur: 'Jean Employé',
      quantity: 3,
      pu: 145000,
      total: 435000,
      benefice: 150000
    }
  ];

  // Pixel perfect Mock pieces matching screenshot 2
  const demoPieces: PieceItem[] = [
    {
      id: 'p1',
      reference: 'FH-001',
      designation: 'Filtre à huile',
      marque: 'Bosch',
      prix_vente: 38000,
      quantity_disponible: 45,
      prix_achat: 25000
    },
    {
      id: 'p2',
      piece_id: 'real-piece-2',
      reference: 'PF-022',
      designation: 'Plaquettes de frein avant',
      marque: 'Brembo',
      prix_vente: 125000,
      quantity_disponible: 12,
      prix_achat: 87500
    },
    {
      id: 'p3',
      reference: 'BG-105',
      designation: "Bougie d'allumage",
      marque: 'NGK',
      prix_vente: 14000,
      quantity_disponible: 3,
      prix_achat: 9000
    },
    {
      id: 'p4',
      reference: 'AM-307',
      designation: 'Amortisseur arrière',
      marque: 'Monroe',
      prix_vente: 265000,
      quantity_disponible: 0,
      prix_achat: 195000
    }
  ];

  // Format utility
  const formatAr = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' Ar';
  };

  const fetchSalesAndStock = async () => {
    setLoading(true);
    
    // Safety Promise.race to guarantee immediate load
    const timeoutPromise = new Promise<any>((resolve) => 
      setTimeout(() => resolve({ isTimeout: true }), 15000)
    );

    const queryPromise = (async () => {
      // 1. Fetch Sales
      let salesQuery = supabase
        .from('ventes')
        .select(`
          *, 
          details_ventes(*, pieces(designation, reference)), 
          profiles(full_name),
          boutiques(name)
        `)
        .order('created_at', { ascending: false });

      if (role !== 'administrateur' && profile?.boutique_id) {
        salesQuery = salesQuery.eq('boutique_id', profile.boutique_id);
      }

      const { data: salesData } = await salesQuery;

      // 2. Fetch Active Stock & Pieces
      const { data: stockData } = await supabase
        .from('stock')
        .select('*, pieces(*)');

      // 3. Fetch purchase prices to compute exact benefit
      const { data: pfData } = await supabase
        .from('piece_fournisseurs')
        .select('piece_id, prix_achat');

      // 4. Fetch boutiques
      const { data: bData } = await supabase.from('boutiques').select('*');

      return { salesData, stockData, pfData, bData };
    })();

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result && !result.isTimeout) {
        // Map purchase prices for benefit computation
        const pMap: Record<string, number> = {};
        if (result.pfData) {
          result.pfData.forEach((item: any) => {
            pMap[item.piece_id] = Number(item.prix_achat);
          });
        }

        // Parse sales
        const parsedSales: SaleItem[] = [];
        if (result.salesData) {
          result.salesData.forEach((s: any) => {
            const dateStr = new Date(s.created_at).toLocaleString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
            const vendeur = s.profiles?.full_name || 'Inconnu';
            const boutiqueName = s.boutiques?.name || 'Aina Principale';

            if (s.details_ventes && s.details_ventes.length > 0) {
              // Sort details by their ID or creation order so the first chosen is always first
              const sortedDetails = [...s.details_ventes].sort((a: any, b: any) => {
                if (a.created_at && b.created_at) return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                if (a.id && b.id) return a.id > b.id ? 1 : -1;
                return 0;
              });

              sortedDetails.forEach((detail: any, index: number) => {
                const pieceName = detail?.pieces?.designation || 'Pièce Automobile';
                const pAchat = pMap[detail?.piece_id] || (detail?.prix_vente || 10000) * 0.7;
                const qty = detail?.quantite || 1;
                const totalVal = detail?.total || (detail?.prix_vente ? detail.prix_vente * qty : 0);
                const benef = totalVal - (pAchat * qty);

                parsedSales.push({
                  id: `${s.id}-detail-${index}`, // Ensure unique ID for React mapping
                  date: dateStr,
                  piece_name: pieceName,
                  piece_ref: detail?.pieces?.reference || '',
                  vendeur: vendeur,
                  boutique_name: boutiqueName,
                  quantity: qty,
                  pu: detail?.prix_vente || (totalVal / qty),
                  total: totalVal,
                  benefice: benef > 0 ? benef : totalVal * 0.35
                });
              });
            } else if (s.total > 0) {
              // Fallback for sales that have a total but no details_ventes
              parsedSales.push({
                id: s.id,
                date: dateStr,
                piece_name: 'Vente (Sans détails)',
                piece_ref: '---',
                vendeur: vendeur,
                boutique_name: boutiqueName,
                quantity: 1,
                pu: s.total,
                total: s.total,
                benefice: s.total * 0.35
              });
            }
          });
        }

        const parsedPieces: PieceItem[] = [];
        if (result.stockData) {
          result.stockData.forEach((st: any) => {
            const pAchat = st.pieces?.prix_achat || pMap[st.piece_id] || 10000;
            parsedPieces.push({
              id: st.id, // stock id
              piece_id: st.piece_id, // actual piece id
              reference: st.pieces?.reference || 'REF-UNK',
              code_barre: st.pieces?.code_barre || null,
              designation: st.pieces?.designation || 'Pièce',
              marque: st.pieces?.marque || 'Origine',
              prix_vente: st.pieces?.prix_vente || pAchat * 1.4,
              quantity_disponible: st.quantity_disponible || 0,
              prix_achat: pAchat
            });
          });
        }

        setSales(parsedSales);
        setPieces(parsedPieces);
        if (result.bData) {
          setDbBoutiques(result.bData);
          if (result.bData.length > 0 && (!selectedBoutique || selectedBoutique === 'Centre')) {
            setSelectedBoutique(result.bData[0].id);
          }
        }

      } else {
        // Fallback to empty on timeout
        setSales([]);
        setPieces([]);
      }
    } catch (err) {
      console.error('Error fetching sales, loading mocks:', err);
      setSales([]);
      setPieces([]);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndStock();
    try {
      const saved = localStorage.getItem('boutiqueInfos');
      if (saved) setBoutiqueInfos(JSON.parse(saved));
    } catch {}

    // Écoute en temps réel des nouvelles ventes (Auto-actualisation)
    const channel = supabase
      .channel('ventes_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ventes' }, (payload) => {
        // Petit délai (1 seconde) pour laisser le temps à l'application caissier 
        // d'insérer les "details_ventes" après avoir inséré la "vente" principale.
        setTimeout(() => {
          fetchSalesAndStock();
        }, 1000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Barcode Scanner Listener
  useEffect(() => {
    if (!isModalOpen) return;

    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      const currentTime = Date.now();
      
      // If time between keystrokes is more than 50ms, it's human typing (reset buffer)
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = '';
      }
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
           e.preventDefault();
           e.stopPropagation();
           const scannedCode = barcodeBuffer;
           barcodeBuffer = '';
           
           const piece = pieces.find(p => p.code_barre === scannedCode || p.reference === scannedCode);
           if (piece) {
             handleAddToCart(piece);
             setSearchQuery('');
           } else {
             setErrorMsg(`Code-barres introuvable : ${scannedCode}`);
           }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, [isModalOpen, pieces]);

  // Filter pieces based on search inside modal
  const filteredPieces = pieces.filter(p => 
    p.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.marque.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code_barre && p.code_barre.includes(searchQuery))
  );

  // Triggered when "+ Nouvelle vente" is clicked
  const handleOpenModal = () => {
    setCart([]);
    setSearchQuery('');
    setVendeurName(profile?.full_name || 'Vendeur Inconnu');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleAddToCart = (piece: PieceItem) => {
    if (piece.quantity_disponible <= 0) {
      setErrorMsg("Cette pièce est en rupture de stock.");
      return;
    }
    setErrorMsg(null);
    setCart(prev => {
      const existing = prev.find(item => item.piece.id === piece.id);
      if (existing) {
        if (existing.quantity >= piece.quantity_disponible) {
          setErrorMsg(`Quantité maximum atteinte pour ${piece.designation}.`);
          return prev;
        }
        return prev.map(item => item.piece.id === piece.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { piece, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (pieceId: string, delta: number) => {
    setErrorMsg(null);
    setCart(prev => prev.map(item => {
      if (item.piece.id === pieceId) {
        const newQ = item.quantity + delta;
        if (newQ > item.piece.quantity_disponible) {
          setErrorMsg(`Stock insuffisant pour ${item.piece.designation}.`);
          return item;
        }
        if (newQ < 1) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (pieceId: string) => {
    setCart(prev => prev.filter(item => item.piece.id !== pieceId));
  };

  // Perform Sale registration
  const handleValiderVente = async () => {
    if (cart.length === 0) {
      setErrorMsg("Le panier est vide.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    let calculatedTotal = 0;
    
    cart.forEach(item => {
        const pVente = item.piece.prix_vente || item.piece.prix_achat * 1.5 || 0;
        calculatedTotal += pVente * item.quantity;
    });

    const boutiqueIdToUse = profile?.boutique_id || selectedBoutique || null;

    try {
      if (!navigator.onLine) {
        throw new Error("offline");
      }

      // 1. Fetch current active caisse or first caisse to attach if exists
      const { data: caisseData } = await supabase
        .from('caisse')
        .select('id')
        .eq('statut', 'OUVERT')
        .limit(1);
        
      const activeCaisseId = caisseData && caisseData.length > 0 ? caisseData[0].id : null;

      // 2. Insert main vente
      const { data: newVente, error: venteErr } = await supabase
        .from('ventes')
        .insert({
          total: calculatedTotal,
          caissier_id: profile?.id || null,
          boutique_id: boutiqueIdToUse || null
        })
        .select('*')
        .single();

      if (venteErr) throw venteErr;

      // 3. Insert details_ventes
      const detailsToInsert = cart.map(item => ({
          vente_id: newVente.id,
          piece_id: item.piece.piece_id || item.piece.id, // Use actual piece_id, fallback to id
          quantite: item.quantity,
          prix_vente: item.piece.prix_vente || item.piece.prix_achat * 1.5 || 0,
          remise: 0,
          total: (item.piece.prix_vente || item.piece.prix_achat * 1.5 || 0) * item.quantity
      }));

      const { error: detailsErr } = await supabase
        .from('details_ventes')
        .insert(detailsToInsert);

      if (detailsErr) throw detailsErr;

      // 4. Update stock & log movement for each
      for (const item of cart) {
          const newStockQty = item.piece.quantity_disponible - item.quantity;
          await supabase.from('stock').update({ quantity_disponible: newStockQty }).eq('id', item.piece.id);
          
          await supabase.from('mouvements_stock').insert({
            stock_id: item.piece.id,
            type: 'SORTIE',
            quantite: item.quantity,
            utilisateur_id: profile?.id || null,
            commentaire: `Vente client - Vendeur: ${vendeurName}`
          });
      }

      setSuccessMsg("Vente enregistrée avec succès !");
      fetchSalesAndStock();
      setIsModalOpen(false);

    } catch (err: any) {
      console.warn("Réseau indisponible, enregistrement local (IndexedDB) pour la PWA :", err);
      
      const offlineSaleId = uuidv4();
      
      await db.pending_ventes.add({
        id: offlineSaleId,
        boutique_id: boutiqueIdToUse || '',
        vendeur_id: profile?.id || '',
        client_nom: 'Client Divers',
        client_contact: '',
        status: 'COMPLETED',
        total: calculatedTotal,
        created_at: new Date().toISOString(),
        details: cart.map(item => ({
          piece_id: item.piece.piece_id || item.piece.id,
          quantite: item.quantity,
          prix_vente: item.piece.prix_vente || item.piece.prix_achat * 1.5 || 0,
          total: (item.piece.prix_vente || item.piece.prix_achat * 1.5 || 0) * item.quantity
        }))
      });

      // Mettre à jour visuellement le stock local dans l'état (simulation locale)
      const simulatedSales = cart.map((item, index) => {
        const pVente = item.piece.prix_vente || item.piece.prix_achat * 1.5 || 0;
        return {
          id: `${offlineSaleId}-sim-${index}`,
          date: new Date().toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          piece_name: item.piece.designation,
          piece_ref: item.piece.reference,
          vendeur: vendeurName,
          boutique_name: 'Boutique (Hors-Ligne)',
          quantity: item.quantity,
          pu: pVente,
          total: pVente * item.quantity,
          benefice: (pVente * item.quantity) - ((item.piece.prix_achat || 0) * item.quantity)
        } as SaleItem;
      });

      setSales([...simulatedSales, ...sales]);
      
      // Update local state pieces stock
      setPieces(prev => prev.map(p => {
        const inCart = cart.find(c => (c.piece.piece_id || c.piece.id) === (p.piece_id || p.id));
        if (inCart) {
          return { ...p, quantity_disponible: p.quantity_disponible - inCart.quantity };
        }
        return p;
      }));

      setSuccessMsg("Mode Hors-Ligne: Vente sécurisée localement. Synchronisation prévue au retour réseau.");
      setTimeout(() => setIsModalOpen(false), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Print function
  const triggerPrintReceipt = (sale: SaleItem) => {
    setReceiptSale(sale);
  };



  // Calculates global metrics
  const totalSalesCount = sales.length;
  const totalSalesVal = sales.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div style={s.container}>
      
      {/* HEADER SECTION exactly matching reference */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Ventes</h1>
          <p style={s.pageSubtitle}>
            {totalSalesCount} ventes — total {formatAr(totalSalesVal)}
          </p>
        </div>
        <button style={s.addBtn} onClick={handleOpenModal}>
          <Plus size={16} />
          <span>Nouvelle vente</span>
        </button>
      </div>

      {/* SALES LIST CONTAINER */}
      <div style={s.cardWrapper}>
        <div style={s.tableContainer}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>DATE</th>
                {role === 'administrateur' && <th style={s.th}>BOUTIQUE</th>}
                <th style={s.th}>PIÈCE</th>
                <th style={s.th}>VENDEUR</th>
                <th style={{ ...s.th, textAlign: 'center' }}>QTÉ</th>
                <th style={s.th}>PU</th>
                <th style={s.th}>TOTAL</th>
                <th style={s.th}>BÉNÉF.</th>
                <th style={{ ...s.th, width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === 'administrateur' ? 9 : 8} style={s.loadingCell}>
                    <div style={s.spinner}></div>
                    <p style={{ marginTop: '10px', color: 'rgba(255,255,255,0.45)' }}>Chargement des ventes...</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={role === 'administrateur' ? 9 : 8} style={s.emptyCell}>Aucune vente enregistrée.</td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} style={s.tr}>
                    <td style={s.tdDate}>{sale.date}</td>
                    {role === 'administrateur' && (
                      <td style={{ ...s.tdPiece, color: '#FCD25B', fontWeight: 'bold' }}>{sale.boutique_name}</td>
                    )}
                    <td style={s.tdPiece}>{sale.piece_name}</td>
                    <td style={s.tdVendeur}>{sale.vendeur}</td>
                    <td style={s.tdQty}>{sale.quantity}</td>
                    <td style={s.tdPu}>{formatAr(sale.pu)}</td>
                    <td style={s.tdTotal}>{formatAr(sale.total)}</td>
                    <td style={s.tdBenef}>{formatAr(sale.benefice)}</td>
                    <td style={s.tdAction}>
                      <button 
                        style={s.printBtn} 
                        onClick={() => triggerPrintReceipt(sale)}
                        title="Imprimer le ticket"
                      >
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL OVERLAY: NOUVELLE VENTE ─────────────────── */}
      {isModalOpen && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            
            {/* Header */}
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Nouvelle vente</h3>
              <button style={s.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Inner Content */}
            <div style={s.modalBody}>
              
              <div style={{ display: 'flex', gap: '20px', flexDirection: 'row' }}>
                
                {/* LEFT PANE: Search and List */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '50%' }}>
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Rechercher une pièce</label>
                    <div style={s.searchFieldWrapper}>
                      <Search size={16} style={s.searchFieldIcon} />
                      <input 
                        type="text"
                        placeholder="Référence, nom, marque..."
                        style={s.searchFieldInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Scrollable list exact layout matching image 2 */}
                  <div style={s.pieceListScroll}>
                    {filteredPieces.map((piece) => {
                      const isOutOfStock = piece.quantity_disponible <= 0;
                      return (
                        <div 
                          key={piece.id} 
                          style={{
                            ...s.pieceItemRow,
                            opacity: isOutOfStock ? 0.45 : 1,
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => !isOutOfStock && handleAddToCart(piece)}
                        >
                          {/* Left text */}
                          <div>
                            <div style={s.pieceItemTitle}>{piece.designation}</div>
                            <div style={s.pieceItemSub}>{piece.reference} - {piece.marque}</div>
                          </div>
                          {/* Right text */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={s.pieceItemPrice}>{formatAr(piece.prix_vente)}</div>
                            <div style={{
                              ...s.pieceItemStock,
                              color: isOutOfStock ? '#ef4444' : 'rgba(255,255,255,0.45)'
                            }}>
                              Stock : {piece.quantity_disponible}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT PANE: Cart & Details */}
                <div style={{ flex: 1, ...s.detailConfigBox }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Panier Actuel</span>
                    <span style={{ fontSize: '13px', color: '#0066fe' }}>{cart.reduce((sum, item) => sum + item.quantity, 0)} article(s)</span>
                  </h4>
                  
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cart.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '30px', fontSize: '13px' }}>Le panier est vide. Cliquez sur les pièces à gauche pour les ajouter.</div>
                    ) : (
                      cart.map(item => (
                        <div key={item.piece.id} style={s.selectionSummaryCard}>
                          <div style={{ flex: 1 }}>
                            <div style={s.selectionTitle}>{item.piece.designation}</div>
                            <div style={s.selectionRef}>{item.piece.reference} - {formatAr(item.piece.prix_vente)}</div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button style={{...s.qtyBtn, width: '22px', height: '22px', fontSize: '14px'}} onClick={() => handleUpdateCartQuantity(item.piece.id, -1)}>-</button>
                            <span style={{ color: '#fff', fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                            <button style={{...s.qtyBtn, width: '22px', height: '22px', fontSize: '14px'}} onClick={() => handleUpdateCartQuantity(item.piece.id, 1)}>+</button>
                            <button style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: '5px', cursor: 'pointer' }} onClick={() => handleRemoveFromCart(item.piece.id)}><X size={14} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

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



                  {/* Vendeur Config */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Vendeur / Caissier</label>
                    <input 
                      type="text"
                      style={{...s.inputField, backgroundColor: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed'}}
                      value={vendeurName}
                      disabled
                    />
                  </div>

                  {/* Boutique Config */}
                  <div style={s.inputContainer}>
                    <label style={s.inputLabel}>Boutique de départ</label>
                    <select 
                      style={s.selectInput}
                      value={selectedBoutique}
                      onChange={(e) => setSelectedBoutique(e.target.value)}
                    >
                      {dbBoutiques.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Calculations Preview */}
                  <div style={s.totalPreviewLine}>
                    <div style={s.previewLabel}>Total à payer :</div>
                    <div style={s.previewVal}>{formatAr(cart.reduce((sum, item) => sum + (item.piece.prix_vente * item.quantity), 0))}</div>
                  </div>

                </div>

              </div>
            </div>

            {/* Modal Buttons matches screenshot 2 perfectly */}
            <div style={s.modalFooter}>
              <button 
                style={s.btnAnnuler} 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                style={{
                  ...s.btnValider,
                  opacity: (cart.length === 0 || isSubmitting) ? 0.5 : 1
                }} 
                onClick={handleValiderVente}
                disabled={cart.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Enregistrement..." : "Valider l'encaissement"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── RECEIPT MODAL PRINT ─────────────────────────── */}
      {receiptSale && (() => {
        const matchingDbBoutique = dbBoutiques.find(b => b.id === selectedBoutique) || dbBoutiques[0];

        const currentInfo = matchingDbBoutique ? boutiqueInfos[matchingDbBoutique.id] || {} : {};

        const bName = matchingDbBoutique ? matchingDbBoutique.name : "AINA PIECE AUTO";
        const bAddress = currentInfo.address !== undefined ? currentInfo.address : (matchingDbBoutique?.location || "Analakely, Antananarivo");
        const bPhone = currentInfo.phone || "";
        const bEmail = currentInfo.email || "";
        const bNifStat = currentInfo.nif_stat || "";
        const bRcs = currentInfo.rcs || "";

        // Re-extract the original sale ID (before the '-detail-x' suffix) to find matching receipt items
        const originalSaleId = receiptSale.id.split('-detail-')[0].split('-sim-')[0];
        const itemsInSale = sales.filter(s => s.id.startsWith(originalSaleId));
        const totalAmount = itemsInSale.reduce((sum, item) => sum + item.total, 0);

        return (
          <div style={s.modalOverlay}>
            <div style={s.receiptCard}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitle}>Aperçu du Ticket</h3>
                <button style={s.modalCloseBtn} onClick={() => setReceiptSale(null)}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={s.receiptPrintArea}>
                <div style={s.thermalTicket} className="print-area">
                  <div style={s.ticketTitle}>{bName}</div>
                  {bAddress && <div style={s.ticketAddress}>{bAddress}</div>}
                  {bNifStat && <div style={s.ticketAddress}>NIF : {bNifStat}</div>}
                  {bEmail && <div style={s.ticketAddress}>Email : {bEmail}</div>}
                  {bPhone && <div style={s.ticketAddress}>Téléphone : {bPhone}</div>}
                  <div style={{ margin: '10px 0' }}></div>
                  <div style={s.ticketCenterText}>{receiptSale.date}</div>
                  <div style={{ ...s.ticketCenterText, fontWeight: 'bold' }}>OPÉRATION : VENTE</div>
                  <div style={{ ...s.ticketCenterText, fontWeight: 'bold' }}>Ticket N° {receiptSale.id.substring(0,6).toUpperCase()}</div>
                  
                  <div style={s.ticketAsterisks}>******************************</div>
                  
                  <div style={s.ticketHeaderRow}>
                    <div style={{ flex: 1, textAlign: 'left', fontWeight: 'bold' }}>ARTICLE</div>
                    <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold' }}>QTÉ</div>
                    <div style={{ width: '60px', textAlign: 'right', fontWeight: 'bold' }}>Prix (Ar)</div>
                    <div style={{ width: '60px', textAlign: 'right', fontWeight: 'bold' }}>Total</div>
                  </div>
                  <div style={s.ticketDashed}>------------------------------------------</div>
                  
                  {itemsInSale.map((item, idx) => (
                    <div key={idx} style={s.ticketItemRow}>
                      <div style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.piece_name}
                      </div>
                      <div style={{ width: '40px', textAlign: 'center' }}>{item.quantity}</div>
                      <div style={{ width: '60px', textAlign: 'right' }}>{new Intl.NumberFormat('fr-FR').format(item.pu)}</div>
                      <div style={{ width: '60px', textAlign: 'right' }}>{new Intl.NumberFormat('fr-FR').format(item.total)}</div>
                    </div>
                  ))}

                  <div style={s.ticketSolidLine}></div>
                  
                  <div style={s.ticketTotalRow}>
                    <div style={{ fontWeight: 'bold' }}>TOTAL :</div>
                    <div style={{ fontWeight: 'bold' }}>{formatAr(totalAmount)}</div>
                  </div>
                  <div style={s.ticketSolidLine}></div>
                  
                  <div style={s.ticketPaymentRow}>
                    <div>Espèces</div>
                    <div>{formatAr(totalAmount)}</div>
                  </div>
                  <div style={s.ticketPaymentRow}>
                    <div>À rendre</div>
                    <div>0 Ar</div>
                  </div>
                  
                  <div style={{ ...s.ticketTotalRow, marginTop: '10px' }}>
                    <div style={{ fontWeight: 'bold' }}>NOMBRE ARTICLES : {itemsInSale.reduce((acc, curr) => acc + curr.quantity, 0)}</div>
                  </div>
                  
                  <div style={s.ticketAsterisks}>******************************</div>
                  
                  {/* Simulate a Barcode Visually */}
                  <div style={s.barcodeContainer}>
                    <div style={s.barcodeBars}>
                      {Array.from({ length: 45 }).map((_, i) => (
                        <div key={i} style={{ 
                          width: `${Math.floor(Math.random() * 3) + 1}px`, 
                          height: '40px', 
                          backgroundColor: '#000',
                          marginRight: `${Math.floor(Math.random() * 2)}px`
                        }}></div>
                      ))}
                    </div>
                    <div style={s.barcodeText}>
                      REC-{receiptSale.id.substring(0,4).toUpperCase()}-{receiptSale.date.replace(/[^0-9]/g, '')}
                    </div>
                  </div>

                  <div style={s.ticketFooter}>
                    <strong>{bName}</strong> vous remercie de votre visite<br/>
                    et espère vous revoir bientôt ......
                  </div>
                </div>
              </div>

              <div style={s.modalFooter}>
                <button style={s.btnAnnuler} onClick={() => setReceiptSale(null)}>
                  Fermer
                </button>
                <button style={s.btnValider} onClick={handlePrint}>
                  <Printer size={14} style={{ marginRight: '6px' }} />
                  Imprimer
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
    gap: '24px',
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
  cardWrapper: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '14px 20px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    letterSpacing: '0.05em'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'background-color 0.2s ease',
    backgroundColor: 'transparent'
  },
  tdDate: {
    padding: '16px 20px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)'
  },
  tdPiece: {
    padding: '16px 20px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff'
  },
  tdVendeur: {
    padding: '16px 20px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.65)'
  },
  tdQty: {
    padding: '16px 20px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center'
  },
  tdPu: {
    padding: '16px 20px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  tdTotal: {
    padding: '16px 20px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff'
  },
  tdBenef: {
    padding: '16px 20px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#22c55e' // Neon Green Benefit
  },
  tdAction: {
    padding: '16px 20px',
    textAlign: 'right'
  },
  printBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.35)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    transition: 'all 0.15s ease'
  },
  loadingCell: {
    padding: '60px',
    textAlign: 'center'
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: '13px'
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderTopColor: '#0066fe',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },

  // Modal styles exact match to screenshot 2
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
    maxWidth: '850px',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  searchFieldWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchFieldIcon: {
    position: 'absolute',
    left: '12px',
    color: 'rgba(255, 255, 255, 0.35)'
  },
  searchFieldInput: {
    width: '100%',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '10px 12px 10px 36px',
    color: '#ffffff',
    fontSize: '13.5px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  pieceListScroll: {
    maxHeight: '260px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingRight: '4px'
  },
  pieceItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    transition: 'background-color 0.15s ease'
  },
  pieceItemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff'
  },
  pieceItemSub: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '2px'
  },
  pieceItemPrice: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff'
  },
  pieceItemStock: {
    fontSize: '11px',
    marginTop: '2px'
  },

  // Selected config details pane
  detailConfigBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  selectionSummaryCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: 'rgba(0, 102, 254, 0.08)',
    border: '1px dashed rgba(0, 102, 254, 0.3)',
    borderRadius: '6px'
  },
  selectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff'
  },
  selectionRef: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '2px'
  },
  changeSelectionBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer'
  },
  qtyControlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '4px',
    width: 'fit-content'
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600
  },
  qtyLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    minWidth: '24px',
    textAlign: 'center'
  },
  stockIndicator: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.35)'
  },
  selectInput: {
    width: '100%',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13.5px',
    outline: 'none'
  },
  totalPreviewLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    border: '1px solid rgba(34, 197, 94, 0.15)',
    borderRadius: '6px',
    marginTop: '4px'
  },
  previewLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)'
  },
  previewVal: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#22c55e'
  },

  // Alert and success
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#ef4444',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px'
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#22c55e',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px'
  },

  // Footer Buttons matching visual perfectly
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
  },

  // Thermal Receipt card
  receiptCard: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
    overflow: 'hidden'
  },
  receiptPrintArea: {
    padding: '20px',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'center'
  },
  thermalTicket: {
    color: '#000000',
    backgroundColor: '#ffffff',
    fontFamily: 'monospace',
    width: '100%',
    padding: '10px 5px',
    fontSize: '12px'
  },
  ticketTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    marginBottom: '4px'
  },
  ticketAddress: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#000',
    lineHeight: '1.4'
  },
  ticketCenterText: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#000',
    lineHeight: '1.4'
  },
  ticketAsterisks: {
    textAlign: 'center',
    fontSize: '12px',
    margin: '10px 0',
    letterSpacing: '2px',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  ticketDashed: {
    textAlign: 'center',
    fontSize: '12px',
    margin: '4px 0',
    letterSpacing: '1px',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  ticketHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    marginBottom: '2px',
    padding: '0 2px'
  },
  ticketItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    marginBottom: '4px',
    padding: '0 2px'
  },
  ticketSolidLine: {
    borderTop: '2px solid #000',
    margin: '8px 0'
  },
  ticketTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    padding: '0 2px'
  },
  ticketPaymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginTop: '4px',
    padding: '0 2px'
  },
  barcodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '15px'
  },
  barcodeBars: {
    display: 'flex',
    height: '45px',
    justifyContent: 'center',
    width: '100%',
    padding: '0 20px'
  },
  barcodeText: {
    fontSize: '10px',
    fontWeight: 'bold',
    marginTop: '4px',
    letterSpacing: '1px'
  },
  ticketFooter: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '11.5px',
    lineHeight: '1.4'
  }
};
