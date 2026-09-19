const fs = require('fs');
const path = require('path');
function scanDir(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(scanDir(fullPath));
        } else if (file.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}
const files = scanDir('./plugins').concat(scanDir('./commands'));
files.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    const regex = /cmd\(\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        if (!match[1].includes('pattern:')) {
            console.log('NO PATTERN:', f, match[1].trim().split('\n')[0]);
        }
        if (match[1].includes('alive')) {
            console.log('ALIVE PATTERN:', f);
        }
        if (match[1].includes('kickall')) {
            console.log('KICKALL FOUND:', f);
        }
        if (match[1].includes('\"al\"') || match[1].includes('\'al\'')) {
            console.log('AL FOUND:', f);
        }
        if (match[1].includes('\"vid\"') || match[1].includes('\'vid\'')) {
            console.log('VID FOUND:', f);
        }

    }
});
