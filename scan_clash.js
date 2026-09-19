const fs = require('fs');
const path = require('path');
const pluginsDir = path.join(__dirname, 'plugins');
let allPatterns = [];
let allAliases = [];
fs.readdirSync(pluginsDir).forEach(f => {
    if (f.endsWith('.js')) {
        const code = fs.readFileSync(path.join(pluginsDir, f), 'utf8');
        const regex = /cmd\(\s*\{([\s\S]*?)\}/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            const inner = match[1];
            
            const patMatch = inner.match(/pattern:\s*['"]([^'"]+)['"]/);
            const p = patMatch ? patMatch[1] : undefined;
            if (p) allPatterns.push({val: p, file: f});
            else allPatterns.push({val: 'undefined', file: f});
            
            const aliasMatch = inner.match(/alias:\s*\[(.*?)\]/);
            if (aliasMatch) {
                const arrStr = aliasMatch[1];
                const aliases = arrStr.match(/['"]([^'"]+)['"]/g) || [];
                aliases.forEach(a => allAliases.push({val: a.replace(/['"]/g, ''), file: f}));
            }
            const singleAliasMatch = inner.match(/alias:\s*['"]([^'"]+)['"]/);
            if (singleAliasMatch) {
                allAliases.push({val: singleAliasMatch[1], file: f});
            }
        }
    }
});

const pCount = {};
allPatterns.forEach(p => {
    if (!pCount[p.val]) pCount[p.val] = [];
    pCount[p.val].push(p.file);
});
for (let p in pCount) {
    if (pCount[p].length > 1) {
        console.log('DUP PATTERN:', p, pCount[p]);
    }
}

const aCount = {};
allAliases.forEach(a => {
    if (!aCount[a.val]) aCount[a.val] = [];
    aCount[a.val].push(a.file);
});
for (let a in aCount) {
    if (aCount[a].length > 1) {
        console.log('DUP ALIAS:', a, aCount[a]);
    }
}

allPatterns.forEach(p => {
    if (p.val !== 'undefined' && aCount[p.val]) {
        console.log('CLASH PATTERN/ALIAS:', p.val, 'Pattern in', p.file, 'Alias in', aCount[p.val]);
    }
});
