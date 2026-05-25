const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Settings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/<input[^>]+value=\{reportStart\}[^>]+\/>/g, `<DatePicker selected={new Date(reportStart)} onChange={(date: Date | null) => setReportStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportStart)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

content = content.replace(/<input[^>]+value=\{reportEnd\}[^>]+\/>/g, `<DatePicker selected={new Date(reportEnd)} onChange={(date: Date | null) => setReportEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportEnd)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

content = content.replace(/<input[^>]+value=\{purgeStart\}[^>]+\/>/g, `<DatePicker selected={new Date(purgeStart)} onChange={(date: Date | null) => setPurgeStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeStart)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

content = content.replace(/<input[^>]+value=\{purgeEnd\}[^>]+\/>/g, `<DatePicker selected={new Date(purgeEnd)} onChange={(date: Date | null) => setPurgeEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeEnd)} locale="fr" dateFormat="dd/MM/yyyy" className="form-input" highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]} customInput={<input style={s.inputField} />} />`);

fs.writeFileSync(filePath, content);
console.log('Done replacing DatePickers safely.');
