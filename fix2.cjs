const fs = require('fs');
let c = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

if (!c.includes('Effacer Utilisateurs & Caissiers')) {
    const targetRegex = /(<span>Supprimer les autres Boutiques \(Conserver 'AINA PIECE BEHORIRIKA'\)<\/span>\s*<\/label>)/;
    c = c.replace(targetRegex, `$1\n\n                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#fff', cursor: 'pointer' }}>\n                  <input type="checkbox" checked={resetOptions.utilisateurs} onChange={(e) => setResetOptions({...resetOptions, utilisateurs: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />\n                  <span>Effacer Utilisateurs & Caissiers (Conserver Admin)</span>\n                </label>`);
    fs.writeFileSync('src/pages/Settings.tsx', c);
    console.log('Fixed with Regex');
} else {
    console.log('Already fixed');
}
