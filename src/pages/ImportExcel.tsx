import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../services/supabaseClient';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Play,
  X
} from 'lucide-react';

interface ExcelRow {
  reference: string;
  designation: string;
  marque?: string;
  categorie?: string;
  compatibilite?: string;
  oem_number?: string;
  description?: string;
  quantite_achetee?: number;
  quantite_disponible?: number;
  stock_minimum?: number;
  emplacement?: string;
  prix_achat?: number;
  prix_vente?: number;
  remise?: number;
  fournisseur?: string;
  date_arrivage?: string;
}

interface RowError {
  index: number;
  field: string;
  message: string;
}

const parseExcelNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return Number(String(val).replace(/\s/g, '').replace(',', '.')) || 0;
};

export const ImportExcel: React.FC = () => {
  const { activeBoutiqueId } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBoutique, setSelectedBoutique] = useState<string>('');
  const [availableBoutiques, setAvailableBoutiques] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    supabase.from('boutiques').select('id, name').then(({data}) => {
      if (data) setAvailableBoutiques(data);
    });
  }, []);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ExcelRow[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [progress, setProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [importStats, setImportStats] = useState({ inserted: 0, updated: 0, ignored: 0 });

  const [addNewOnly, setAddNewOnly] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setSuccessMsg(null);
    setErrorMsg(null);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

        const mappedRows: ExcelRow[] = rawRows.map((row) => ({
          reference: String(row.reference || row.Reference || row.REF || row.ref || '').trim() || 'VIDE',
          designation: String(row.designation || row.Designation || row.DESIGNATION || row.nom || '').trim(),
          marque: String(row.marque || row.Marque || row.MARQUE || row.brand || '').trim(),
          categorie: String(row.categorie || row.Categorie || row.category || '').trim(),
          compatibilite: String(row.compatibilite || row.vehicule || '').trim(),
          oem_number: String(row.oem || row.OEM || row.oem_number || '').trim(),
          description: String(row['historique vente(lieu et date)'] || row.description || '').trim(),
          quantite_achetee: parseExcelNumber(row.quantite_achetee || row.quantite || row.Nbr || 0),
          quantite_disponible: parseExcelNumber(row.quantite_disponible || row.disponible || row.Nbr || 0),
          stock_minimum: parseExcelNumber(row.stock_minimum || row.min || 5),
          emplacement: String(row.STOCK || row.emplacement || row.location || '').trim(),
          prix_achat: parseExcelNumber(row.PU || row.prix_achat || row.achat || 0),
          prix_vente: parseExcelNumber(row['PV estimer'] || row.PV || row.prix_vente || row.vente || 0),
          remise: parseExcelNumber(row.remise || 0),
          fournisseur: String(row.FOURNISSEUR || row.fournisseur || '').trim(),
          date_arrivage: String(row['date arrivage'] || '').trim(),
        }));

        validateData(mappedRows);
        setParsedData(mappedRows);
      } catch (err) {
        setErrorMsg('Impossible de lire le fichier Excel. Assurez-vous que le format est valide.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (rows: ExcelRow[]) => {
    const newErrors: RowError[] = [];
    rows.forEach((row, idx) => {
      if (!row.reference) newErrors.push({ index: idx + 1, field: 'Référence', message: 'La référence est obligatoire.' });
      if (!row.designation) newErrors.push({ index: idx + 1, field: 'Pièce', message: 'Le nom de la pièce est obligatoire.' });
      if (row.prix_achat && row.prix_achat < 0) newErrors.push({ index: idx + 1, field: 'Prix Achat', message: 'Le prix d\'achat ne peut pas être négatif.' });
    });
    setErrors(newErrors);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    let insertedCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;

    try {
      const targetBoutiqueId = selectedBoutique || activeBoutiqueId;
      if (!targetBoutiqueId) {
        throw new Error('Veuillez sélectionner une boutique de destination pour cet import.');
      }
      
      const boutiqueIds = targetBoutiqueId === 'toutes' 
        ? availableBoutiques.map(b => b.id) 
        : [targetBoutiqueId];

      const fournisseursCache: Record<string, string> = {};

      // 1. Pre-fetch and cache all fournisseurs to avoid race conditions during parallel insert
      const uniqueFournisseurs = Array.from(new Set(parsedData.map(r => r.fournisseur).filter(Boolean)));
      for (const f of uniqueFournisseurs) {
         const fName = f?.toUpperCase();
         if (fName && !fournisseursCache[fName]) {
            const { data: existingF } = await supabase.from('fournisseurs').select('id').ilike('nom', fName).maybeSingle();
            if (existingF) {
               fournisseursCache[fName] = existingF.id;
            } else {
               const { data: newF } = await supabase.from('fournisseurs').insert({ nom: f }).select('id').single();
               if (newF) fournisseursCache[fName] = newF.id;
            }
         }
      }

      // 1.5 Deduplicate rows by reference to safely allow parallel processing
      const refMap = new Map<string, ExcelRow>();
      for (const row of parsedData) {
         if (!row.reference || !row.designation) {
            ignoredCount++;
            continue;
         }
         const ref = row.reference;
         if (refMap.has(ref)) {
            const existing = refMap.get(ref)!;
            existing.quantite_achetee = (existing.quantite_achetee || 0) + (row.quantite_achetee || 0);
            existing.quantite_disponible = (existing.quantite_disponible || 0) + (row.quantite_disponible || 0);
         } else {
            refMap.set(ref, { ...row });
         }
      }
      const uniqueParsedData = Array.from(refMap.values());

      // 2. Process rows in chunks of 50 for massive speedup
      const chunkSize = 50;
      for (let i = 0; i < uniqueParsedData.length; i += chunkSize) {
        const chunk = uniqueParsedData.slice(i, i + chunkSize);

        await Promise.all(chunk.map(async (row) => {
          try {
            const { data: existingPiece } = await supabase.from('pieces').select('id').eq('reference', row.reference).maybeSingle();
            let pieceId = existingPiece?.id;

            if (existingPiece) {
              if (replaceExisting) {
                let updatePayload = { designation: row.designation, marque: row.marque, categorie: row.categorie, compatibilite: row.compatibilite, oem_number: row.oem_number, description: row.description, prix_achat: row.prix_achat, prix_vente: row.prix_vente };
                let { error: updErr } = await supabase.from('pieces').update(updatePayload).eq('id', pieceId);
                if (updErr && updErr.message.includes('prix_achat')) {
                   delete updatePayload.prix_achat;
                   delete updatePayload.prix_vente;
                   let { error: retryErr } = await supabase.from('pieces').update(updatePayload).eq('id', pieceId);
                   if (retryErr) throw retryErr;
                } else if (updErr) {
                   throw updErr;
                }
                updatedCount++;
              } else if (ignoreDuplicates) { ignoredCount++; continue; }
              else if (updateExisting) {
                let updatePayload = { designation: row.designation, marque: row.marque || undefined, categorie: row.categorie || undefined, prix_achat: row.prix_achat || undefined, prix_vente: row.prix_vente || undefined };
                let { error: updErr } = await supabase.from('pieces').update(updatePayload).eq('id', pieceId);
                if (updErr && updErr.message.includes('prix_achat')) {
                   delete updatePayload.prix_achat;
                   delete updatePayload.prix_vente;
                   let { error: retryErr } = await supabase.from('pieces').update(updatePayload).eq('id', pieceId);
                   if (retryErr) throw retryErr;
                } else if (updErr) {
                   throw updErr;
                }
                updatedCount++;
              }
            } else {
              let insertPayload = { reference: row.reference, designation: row.designation, marque: row.marque, categorie: row.categorie, compatibilite: row.compatibilite, oem_number: row.oem_number, description: row.description, prix_achat: row.prix_achat, prix_vente: row.prix_vente };
              let { data: newPiece, error: insertError } = await supabase.from('pieces').insert(insertPayload).select('id').single();
              
              if (insertError && insertError.message.includes('prix_achat')) {
                 delete insertPayload.prix_achat;
                 delete insertPayload.prix_vente;
                 let retry = await supabase.from('pieces').insert(insertPayload).select('id').single();
                 newPiece = retry.data;
                 insertError = retry.error;
              }

              if (insertError) {
                console.error("ERREUR D'INSERTION PIECE:", insertError);
                throw new Error("Ligne " + row.reference + " : " + insertError.message);
              }
              pieceId = newPiece?.id;
              insertedCount++;
            }

            if (pieceId) {
              for (const bId of boutiqueIds) {
                const { data: existingStock } = await supabase.from('stock').select('id, quantity_achetee, quantity_disponible').eq('piece_id', pieceId).eq('boutique_id', bId).maybeSingle();
                if (existingStock) {
                  if (replaceExisting) await supabase.from('stock').update({ quantity_achetee: row.quantite_achetee, quantity_disponible: row.quantite_disponible, stock_minimum: row.stock_minimum, emplacement: row.emplacement }).eq('id', existingStock.id);
                  else if (updateExisting) await supabase.from('stock').update({ quantity_achetee: (existingStock.quantity_achetee || 0) + (row.quantite_achetee || 0), quantity_disponible: (existingStock.quantity_disponible || 0) + (row.quantite_disponible || 0) }).eq('id', existingStock.id);
                } else {
                  await supabase.from('stock').insert({ piece_id: pieceId, boutique_id: bId, quantity_achetee: row.quantite_achetee, quantity_disponible: row.quantite_disponible, stock_minimum: row.stock_minimum, emplacement: row.emplacement });
                }
              }

              // Handle Fournisseur (using pre-cached IDs)
              if (row.fournisseur) {
                const fName = row.fournisseur.toUpperCase();
                const fournisseurId = fournisseursCache[fName];
                
                if (fournisseurId) {
                  const { data: existingLink } = await supabase.from('piece_fournisseurs').select('id').eq('piece_id', pieceId).eq('fournisseur_id', fournisseurId).maybeSingle();
                  if (!existingLink) {
                    await supabase.from('piece_fournisseurs').insert({ piece_id: pieceId, fournisseur_id: fournisseurId, prix_achat: row.prix_achat });
                  }
                }
              }
            }
          } catch (e: any) {
             console.error("Row import error", e);
             throw e;
          }
        }));
        
        setProgress(Math.round((Math.min(i + chunkSize, uniqueParsedData.length) / uniqueParsedData.length) * 100));
      }

      await supabase.from('import_logs').insert({ fichier_name: fileName || 'excel_upload', statut: 'SUCCESS', details: { inserted: insertedCount, updated: updatedCount, ignored: ignoredCount } });

      setImportStats({ inserted: insertedCount, updated: updatedCount, ignored: ignoredCount });
      setParsedData([]);
      setFileName(null);
      setProgress(0);
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'importation.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>

      {/* HEADER */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Import Excel</h1>
          <p style={s.pageSubtitle}>Chargez votre catalogue de pièces depuis un fichier Excel</p>
        </div>
      </div>

      {/* UPLOAD ZONE */}
      <div style={s.card}>

        {/* Card Header */}
        <div style={s.cardHeader}>
          <div style={s.iconBox}>
            <FileSpreadsheet size={22} color="#0066fe" />
          </div>
          <div>
            <h2 style={s.cardTitle}>Charger votre catalogue existant</h2>
            <p style={s.cardSubtitle}>Gagnez du temps en important automatiquement vos fichiers Excel sans ressaisie manuelle.</p>
          </div>
        </div>

        {/* Drop Zone or File Selected Bar */}
        {parsedData.length === 0 ? (
          <div
            style={{
              ...s.dropZone,
              borderColor: dragActive ? '#0066fe' : 'rgba(255,255,255,0.08)',
              backgroundColor: dragActive ? 'rgba(0, 102, 254, 0.04)' : 'rgba(255,255,255,0.01)'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: '16px' }} />
            <h3 style={s.dropTitle}>Faites glisser votre fichier Excel ici</h3>
            <p style={s.dropSubtitle}>Ou cliquez pour parcourir vos dossiers (.xlsx, .xls)</p>
            <button style={s.chooseBtn} type="button">Choisir un fichier</button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls" onChange={handleFileChange} />
          </div>
        ) : (
          <div style={s.fileSelectedBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={20} color="#22c55e" />
              <span style={s.fileName}>{fileName}</span>
              <span style={s.rowCountBadge}>{parsedData.length} lignes lues</span>
            </div>
            <button style={s.changeFichierBtn} onClick={() => { setParsedData([]); setFileName(null); setErrors([]); }}>
              Changer de fichier
            </button>
          </div>
        )}

        {/* Alerts */}
        {successMsg && (
          <div style={s.successAlert}>
            <CheckCircle2 size={16} color="#22c55e" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div style={s.errorAlert}>
            <AlertCircle size={16} color="#ef4444" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview and Options (when file loaded) */}
        {parsedData.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>

            {/* Options de doublons */}
            <div>
              <h3 style={s.sectionTitle}>Options de gestion des doublons</h3>
              <div style={s.optionsGrid}>
                {[
                  { label: 'Mettre à jour les données existantes', sub: 'Ajoute les quantités Excel au stock existant et met à jour le nom.', value: updateExisting, onChange: (v: boolean) => { setUpdateExisting(v); if (v) { setIgnoreDuplicates(false); setReplaceExisting(false); } } },
                  { label: 'Remplacer les données existantes', sub: 'Écrase entièrement le stock et les champs de la pièce par les valeurs Excel.', value: replaceExisting, onChange: (v: boolean) => { setReplaceExisting(v); if (v) { setUpdateExisting(false); setIgnoreDuplicates(false); setAddNewOnly(false); } } },
                  { label: 'Ignorer les doublons', sub: 'Ne traite pas les pièces déjà présentes en base de données.', value: ignoreDuplicates, onChange: (v: boolean) => { setIgnoreDuplicates(v); if (v) { setUpdateExisting(false); setReplaceExisting(false); } } },
                  { label: 'Ajouter uniquement les nouvelles données', sub: 'Crée les nouvelles fiches sans affecter les fiches existantes.', value: addNewOnly, onChange: (v: boolean) => { setAddNewOnly(v); if (v) setReplaceExisting(false); } },
                ].map((opt, i) => (
                  <label key={i} style={s.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={opt.value}
                      onChange={(e) => opt.onChange(e.target.checked)}
                      style={{ accentColor: '#0066fe', width: '15px', height: '15px', marginTop: '2px', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Choix de la Boutique */}
            <div>
              <h3 style={s.sectionTitle}>Boutique de destination</h3>
              <div style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>
                  Sélectionnez la boutique dans laquelle le stock de ces pièces sera ajouté ou mis à jour.
                </p>
                <select
                  style={{ backgroundColor: '#161b22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '6px', fontSize: '13.5px', width: '100%', outline: 'none' }}
                  value={selectedBoutique || activeBoutiqueId}
                  onChange={(e) => setSelectedBoutique(e.target.value)}
                >
                  <option value="" disabled>-- Choisir une boutique --</option>
                  <option value="toutes">Toutes les boutiques (Import Global)</option>
                  {availableBoutiques.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div style={s.auditPanel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <AlertCircle size={16} color="#f59e0b" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>Rapport d'Audit — {errors.length} anomalie(s)</span>
                </div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {errors.map((err, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                      <span style={s.auditBadge}>Ligne {err.index}</span>
                      <span style={{ fontWeight: '700', color: '#ffffff' }}>[{err.field}]</span>
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Preview Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={s.sectionTitle}>Aperçu des données à importer</h3>
                
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '300px' }}>
                    <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#0066fe', transition: 'width 0.2s ease' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>{progress}%</span>
                  </div>
                ) : (
                  <button
                    style={{ ...s.importBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    onClick={handleImport}
                    disabled={loading}
                  >
                    <Play size={15} />
                    <span>Lancer l'importation</span>
                  </button>
                )}
              </div>

              <div style={s.tableWrapper}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Référence', 'Pièce', 'Marque', 'Fournisseur', 'Qté Achetée', 'Qté Restante', 'Prix Achat', 'PV Estimé', 'Emplacement'].map((col) => (
                        <th key={col} style={s.th}>{col.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 50).map((row, idx) => {
                      const hasFatal = !row.reference || !row.designation;
                      return (
                        <tr key={idx} style={{ ...s.tr, backgroundColor: hasFatal ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                          <td style={{ ...s.td, fontWeight: '700', color: hasFatal ? '#ef4444' : 'rgba(255,255,255,0.45)' }}>{row.reference || 'MANQUANT'}</td>
                          <td style={{ ...s.td, fontWeight: '700', color: '#0066fe' }}>{row.designation || 'NOM MANQUANT'}</td>
                          <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)' }}>{row.marque || '—'}</td>
                          <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)' }}>{row.fournisseur || '—'}</td>
                          <td style={s.td}>{row.quantite_achetee}</td>
                          <td style={s.td}>{row.quantite_disponible}</td>
                          <td style={s.td}>{row.prix_achat ? `${row.prix_achat.toLocaleString('fr-FR')} Ar` : '—'}</td>
                          <td style={s.td}>{row.prix_vente ? `${row.prix_vente.toLocaleString('fr-FR')} Ar` : '—'}</td>
                          <td style={{ ...s.td, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{row.emplacement || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 50 && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: '10px' }}>
                  ... Et {parsedData.length - 50} autres lignes non affichées dans l'aperçu.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Importation terminée</h3>
              <button style={s.modalCloseBtn} onClick={() => setShowSuccessModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={32} color="#22c55e" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0, textAlign: 'center' }}>
                  Base de données mise à jour !
                </h2>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
                  Les données de votre fichier Excel ont été intégrées avec succès dans l'ERP.<br/>
                  Les catalogues, stocks et fournisseurs sont à jour.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%', marginTop: '10px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>{importStats.inserted}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '4px' }}>Créés</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e' }}>{importStats.updated}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '4px' }}>Mis à jour</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#94a3b8' }}>{importStats.ignored}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '4px' }}>Ignorés</div>
                  </div>
                </div>

                <button 
                  style={{ ...s.importBtn, width: '100%', marginTop: '10px' }} 
                  onClick={() => setShowSuccessModal(false)}
                >
                  Fermer
                </button>
              </div>
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
  card: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '24px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '20px',
    marginBottom: '24px'
  },
  iconBox: {
    width: '46px',
    height: '46px',
    backgroundColor: 'rgba(0, 102, 254, 0.1)',
    border: '1px solid rgba(0, 102, 254, 0.2)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff'
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    marginTop: '4px'
  },
  dropZone: {
    border: '2px dashed rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dropTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px'
  },
  dropSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: '20px'
  },
  chooseBtn: {
    backgroundColor: '#161b22',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  fileSelectedBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '12px 16px'
  },
  fileName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff'
  },
  rowCountBadge: {
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    padding: '2px 10px',
    borderRadius: '999px'
  },
  changeFichierBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.7)',
    padding: '7px 14px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer'
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#22c55e',
    fontSize: '13px',
    marginTop: '16px'
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '13px',
    marginTop: '16px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '12px'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px',
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '16px'
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer'
  },
  auditPanel: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '8px',
    padding: '16px'
  },
  auditBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '700',
    fontSize: '11px'
  },
  importBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0066fe',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    minWidth: '180px',
    justifyContent: 'center'
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  tableWrapper: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden',
    maxHeight: '360px',
    overflowY: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '13px 18px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.35)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    backgroundColor: '#0d1117'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  td: {
    padding: '12px 18px',
    fontSize: '13px',
    color: '#ffffff'
  },
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
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
    overflow: 'hidden',
    animation: 'fadeIn 0.2s ease-out'
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
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }
};

export default ImportExcel;
