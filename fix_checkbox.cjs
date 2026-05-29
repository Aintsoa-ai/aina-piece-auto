const fs = require('fs');
let c = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const t = '<label style={{ display: \'flex\', alignItems: \'center\', gap: \'10px\', fontSize: \'13px\', color: \'#fff\', cursor: \'pointer\' }}>\n                  <input type="checkbox" checked={resetOptions.boutiques} onChange={(e) => setResetOptions({...resetOptions, boutiques: e.target.checked})} style={{ width: \'16px\', height: \'16px\', accentColor: \'#ef4444\' }} />\n                  <span>Supprimer les autres Boutiques (Conserver \'AINA PIECE BEHORIRIKA\')</span>\n                </label>';

const r = t + '\n\n                <label style={{ display: \'flex\', alignItems: \'center\', gap: \'10px\', fontSize: \'13px\', color: \'#fff\', cursor: \'pointer\' }}>\n                  <input type="checkbox" checked={resetOptions.utilisateurs} onChange={(e) => setResetOptions({...resetOptions, utilisateurs: e.target.checked})} style={{ width: \'16px\', height: \'16px\', accentColor: \'#ef4444\' }} />\n                  <span>Effacer Utilisateurs & Caissiers (Conserver Admin)</span>\n                </label>';

c = c.replace(t, r);
fs.writeFileSync('src/pages/Settings.tsx', c);
