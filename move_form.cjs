const fs = require('fs');

const file = 'src/pages/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = `        {/* Formulaire de création d'accès boutique */}`;
const endMarker = `          </form>\n        </div>`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find the form to extract.");
  process.exit(1);
}

let formBlock = content.substring(startIndex, endIndex);

// Remove the extracted block from its original location
content = content.substring(0, startIndex) + content.substring(endIndex);

// Prepare the new card to be inserted
const newCard = `        {/* Formulaire de création d'accès boutique */}
        <div style={{ ...s.card, display: activeSettingsTab === 'systeme' ? 'block' : 'none' }}>
${formBlock.replace(`        {/* Formulaire de création d'accès boutique */}\n        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>`, `          <div>`)}
        </div>\n`;

// Insert it into settingsGrid, right after Personnalisation
const insertTarget = `      {/* ── PERSONNALISATION DE L'APPLICATION ────────────────────────── */}`;
const insertTargetIndex = content.indexOf(insertTarget);

if (insertTargetIndex === -1) {
  console.error("Could not find insert target.");
  process.exit(1);
}

// We want to insert it after the end of Personnalisation card. Personnalisation ends right before the closing </div> of settingsGrid.
// Let's just insert it right BEFORE the </div> of settingsGrid.
const settingsGridEnd = `      </div>\n\n      {/* ── INTELLIGENCE HORS NORME : SÉCURITÉ & SAUVEGARDES ─────────────── */}`;
const gridEndIndex = content.indexOf(settingsGridEnd);

if (gridEndIndex === -1) {
  console.error("Could not find grid end.");
  process.exit(1);
}

content = content.substring(0, gridEndIndex) + newCard + content.substring(gridEndIndex);

fs.writeFileSync(file, content, 'utf8');
console.log("Moved successfully!");
