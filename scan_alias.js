const fs = require('fs');
const path = require('path');
const pluginsDir = path.join(__dirname, 'plugins');
fs.readdirSync(pluginsDir).forEach(f => {
    if (f.endsWith('.js')) {
        const c = fs.readFileSync(path.join(pluginsDir, f), 'utf8');
        if (c.includes('"al"') || c.includes("'al'")) console.log('AL:', f);
        if (c.includes('"alive"') || c.includes("'alive'")) console.log('ALIVE:', f);
        if (c.includes('"kickall"') || c.includes("'kickall'")) console.log('KICKALL:', f);
        if (c.includes('"vid"') || c.includes("'vid'")) console.log('VID:', f);
    }
});
