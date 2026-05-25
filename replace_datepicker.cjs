const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Settings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Date de début in Report
content = content.replace(
  /<input\s*\n\s*type="date"\s*\n\s*className="form-input"\s*\n\s*value=\{reportStart\}\s*\n\s*onChange=\{e => setReportStart\(e.target.value\)\}\s*\n\s*style=\{\{ padding: '8px', fontSize: '14px', background: 'rgba\(15,23,42,0.4\)', border: '1px solid rgba\(255,255,255,0.05\)', color: '#fff', borderRadius: '6px' \}\}\s*\n\s*\/>/g,
  `<DatePicker
                        selected={new Date(reportStart)}
                        onChange={(date: Date | null) => setReportStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportStart)}
                        locale="fr"
                        dateFormat="dd/MM/yyyy"
                        className="form-input"
                        highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]}
                        style={{ padding: '8px', fontSize: '14px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', borderRadius: '6px' }}
                      />`
);

// Replace Date de fin in Report
content = content.replace(
  /<input\s*\n\s*type="date"\s*\n\s*className="form-input"\s*\n\s*value=\{reportEnd\}\s*\n\s*onChange=\{e => setReportEnd\(e.target.value\)\}\s*\n\s*style=\{\{ padding: '8px', fontSize: '14px', background: 'rgba\(15,23,42,0.4\)', border: '1px solid rgba\(255,255,255,0.05\)', color: '#fff', borderRadius: '6px' \}\}\s*\n\s*\/>/g,
  `<DatePicker
                        selected={new Date(reportEnd)}
                        onChange={(date: Date | null) => setReportEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : reportEnd)}
                        locale="fr"
                        dateFormat="dd/MM/yyyy"
                        className="form-input"
                        highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]}
                        style={{ padding: '8px', fontSize: '14px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', borderRadius: '6px' }}
                      />`
);

// Replace Date de début in Purge
content = content.replace(
  /<input\s*\n\s*type="date"\s*\n\s*className="form-input"\s*\n\s*value=\{purgeStart\}\s*\n\s*onChange=\{e => setPurgeStart\(e.target.value\)\}\s*\n\s*\/>/g,
  `<DatePicker
                      selected={new Date(purgeStart)}
                      onChange={(date: Date | null) => setPurgeStart(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeStart)}
                      locale="fr"
                      dateFormat="dd/MM/yyyy"
                      className="form-input"
                      highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]}
                    />`
);

// Replace Date de fin in Purge
content = content.replace(
  /<input\s*\n\s*type="date"\s*\n\s*className="form-input"\s*\n\s*value=\{purgeEnd\}\s*\n\s*onChange=\{e => setPurgeEnd\(e.target.value\)\}\s*\n\s*\/>/g,
  `<DatePicker
                      selected={new Date(purgeEnd)}
                      onChange={(date: Date | null) => setPurgeEnd(date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : purgeEnd)}
                      locale="fr"
                      dateFormat="dd/MM/yyyy"
                      className="form-input"
                      highlightDates={[{ "react-datepicker__day--highlighted-custom": Array.from(activeDates).map(d => new Date(d)) }]}
                    />`
);

fs.writeFileSync(filePath, content);
console.log('Done replacing DatePickers.');
