const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Settings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The generic replace function to replace <input type="date"... /> with DatePicker
// We know there are exactly 4 of these in Settings.tsx!

function replaceInput(str, varName) {
  const regex = new RegExp('<input\\\\s+type="date"\\\\s+value=\\\\{' + varName + '\\\\}\\\\s+onChange=\\\\{e => set' + varName.charAt(0).toUpperCase() + varName.slice(1) + '\\\\(e\\\\.target\\\\.value\\\\)\\\\}\\\\s+style=\\\\{s\\\\.inputField\\\\}\\\\s*\\\\/>', 'g');
  
  // Actually, let's just find "value={varName}" and replace the whole block manually
}

// Since regex is failing, let's do simple string split/join.
const startReportStr = `<input 
                        type="date" 
                        value={reportStart}
                        onChange={e => setReportStart(e.target.value)}
                        style={s.inputField} 
                      />`;
const endReportStr = `<input 
                        type="date" 
                        value={reportEnd}
                        onChange={e => setReportEnd(e.target.value)}
                        style={s.inputField} 
                      />`;
const startPurgeStr = `<input 
                    type="date" 
                    value={purgeStart}
                    onChange={e => setPurgeStart(e.target.value)}
                    style={s.inputField} 
                  />`;
const endPurgeStr = `<input 
                    type="date" 
                    value={purgeEnd}
                    onChange={e => setPurgeEnd(e.target.value)}
                    style={s.inputField} 
                  />`;

content = content.replace(startReportStr, `<DatePicker selected={new Date(reportStart)} onChange={(date: Date | null) => setReportStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportStart)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

content = content.replace(endReportStr, `<DatePicker selected={new Date(reportEnd)} onChange={(date: Date | null) => setReportEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportEnd)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

content = content.replace(startPurgeStr, `<DatePicker selected={new Date(purgeStart)} onChange={(date: Date | null) => setPurgeStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeStart)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

content = content.replace(endPurgeStr, `<DatePicker selected={new Date(purgeEnd)} onChange={(date: Date | null) => setPurgeEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeEnd)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

// Normalize CRLF
content = content.replace(/\\r\\n/g, '\\n');
// Try replacing without specific whitespace if the direct replace fails
content = content.replace(/<input[^>]+value=\{reportStart\}[^>]+\/>/g, `<DatePicker selected={new Date(reportStart)} onChange={(date: Date | null) => setReportStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportStart)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);
content = content.replace(/<input[^>]+value=\{reportEnd\}[^>]+\/>/g, `<DatePicker selected={new Date(reportEnd)} onChange={(date: Date | null) => setReportEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportEnd)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);
content = content.replace(/<input[^>]+value=\{purgeStart\}[^>]+\/>/g, `<DatePicker selected={new Date(purgeStart)} onChange={(date: Date | null) => setPurgeStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeStart)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);
content = content.replace(/<input[^>]+value=\{purgeEnd\}[^>]+\/>/g, `<DatePicker selected={new Date(purgeEnd)} onChange={(date: Date | null) => setPurgeEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeEnd)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);


fs.writeFileSync(filePath, content);
console.log('Replaced');
