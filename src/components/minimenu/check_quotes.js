
const fs = require('fs');
const content = fs.readFileSync('BusinessAdminPanel.tsx', 'utf8');
const lines = content.split('\n');

let inBacktick = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Simplistic check for unmatched quotes on a single line, 
    // ignoring those inside other quotes or escaped.
    // This is hard with regex, so let's just count total per file first.
}

const singleQuotes = (content.match(/'/g) || []).length;
const doubleQuotes = (content.match(/"/g) || []).length;

console.log('Total single quotes:', singleQuotes);
console.log('Total double quotes:', doubleQuotes);
