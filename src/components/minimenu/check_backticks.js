
const fs = require('fs');
const content = fs.readFileSync('BusinessAdminPanel.tsx', 'utf8');
const count = (content.match(/`/g) || []).length;
console.log('Total backticks:', count);
if (count % 2 !== 0) {
    console.log('ERROR: Unmatched backtick found!');
    // Find where the odd count starts
    let runningCount = 0;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        runningCount += (lines[i].match(/`/g) || []).length;
        if (runningCount % 2 !== 0) {
            console.log(`First odd backtick count reached at line ${i + 1}`);
            // Show a few lines
            console.log(lines.slice(i, i+3).join('\n'));
            break;
        }
    }
}
