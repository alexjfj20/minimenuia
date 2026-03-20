
const fs = require('fs');
const path = 'c:\\minimenuia\\minimenuia\\src\\components\\minimenu\\BusinessAdminPanel.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

let openBraces = 0;
let closeBraces = 0;

for (let i = 0; i < 4000; i++) {
  const line = lines[i];
  if (line === undefined) break;
  const o = (line.match(/{/g) || []).length;
  const c = (line.match(/}/g) || []).length;
  openBraces += o;
  closeBraces += c;
  if (openBraces === closeBraces && openBraces > 0 && i > 272) {
    console.log(`Balanced at line ${i + 1}: ${line.trim()}`);
  }
}
console.log(`Total Open (up to 4000): ${openBraces}, Total Close: ${closeBraces}`);
