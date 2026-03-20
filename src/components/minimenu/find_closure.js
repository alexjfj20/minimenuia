
const fs = require('fs');
const path = 'BusinessAdminPanel.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

let depth = 0;
let foundStart = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('export function BusinessAdminPanel')) {
    foundStart = true;
    console.log(`Start found at line ${i + 1}`);
    // Account for the opening brace if it's on the same line
    const o = (line.match(/{/g) || []).length;
    const c = (line.match(/}/g) || []).length;
    depth = o - c;
    continue;
  }
  
  if (!foundStart) continue;

  const o = (line.match(/{/g) || []).length;
  const c = (line.match(/}/g) || []).length;
  
  const prevDepth = depth;
  depth += (o - c);
  
  if (depth === 0 && prevDepth > 0) {
    console.log(`Scope closed at line ${i + 1}: ${line.trim()}`);
  }
}
console.log('Finished search.');
