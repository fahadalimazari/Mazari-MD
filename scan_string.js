const fs = require('fs');
const path = require('path');
const pluginsDir = path.join(__dirname, 'plugins');
fs.readdirSync(pluginsDir).forEach(f => {
    if (f.endsWith('.js')) {
        const code = fs.readFileSync(path.join(pluginsDir, f), 'utf8');
        const regex = /alias:\s*(['"][^'"]+['"])/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            console.log('STRING ALIAS IN:', f, match[1]);
        }
    }
});
