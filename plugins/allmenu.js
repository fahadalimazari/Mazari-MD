const { cmd, commands } = require("../arslan");
const { getPrefix } = require('../lib/prefix');

// Unicode small letter mapping
const toSmallUnicode = (str) => {
    const mapping = {
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ꜰ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ',
        'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ϙ', 'R': 'ʀ', 'S': 'ꜱ', 'T': 'ᴛ',
        'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ',
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
        'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ϙ', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ',
        'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        ' ': ' '
    };
    return str.split('').map(c => mapping[c] || c).join('');
};

let cachedMenuText = null;
let cachedTotalCommands = 0;
let cachedImageBuffer = null;

cmd({
    pattern: "menu",
    alias: ["commandlist", "allmenu", "help", "m", "manu"],
    desc: "Fetch and display all available bot commands",
    category: "system",
    react: "🔱",
    filename: __filename,
}, async (conn, mek, m, { reply, config, prefix }) => {
    try {
        // Resolve the active prefix (use passed multi-session prefix or fallback to global)
        const activePrefix = prefix || getPrefix() || '.';
        
        if (!cachedImageBuffer) {
            try {
                const axios = require('axios');
                const response = await axios.get("https://files.catbox.moe/jtarms.png", { responseType: 'arraybuffer' });
                cachedImageBuffer = Buffer.from(response.data);
            } catch (e) {
                console.error("Failed to cache menu image:", e);
            }
        }

        if (!cachedMenuText) {
            let totalCommands = 0;
            let grouped = {};

            // Group commands by category
            for (const cmd of commands) {
                if (!cmd.pattern || !cmd.category || cmd.dontAddCommandList) continue;
                if (cmd.on && cmd.on !== 'body') continue;

                totalCommands++;
                if (!grouped[cmd.category]) grouped[cmd.category] = [];
                grouped[cmd.category].push(cmd.pattern);
            }

            let menuText = "";
            for (const cat in grouped) {
                menuText += `*╭─〔 ${toSmallUnicode(cat.toUpperCase())} 〕*\n`;
                const sortedCommands = grouped[cat].sort();
                for (let i = 0; i < sortedCommands.length; i++) {
                    const cmdName = sortedCommands[i];
                    if (i === sortedCommands.length - 1) {
                        menuText += `*│⬥└─ _${toSmallUnicode(cmdName)}_*\n`;
                    } else {
                        menuText += `*│⬥├─ _${toSmallUnicode(cmdName)}_*\n`;
                    }
                }
                menuText += `*╰─────────────┈⊷*\n`;
            }

            cachedMenuText = menuText;
            cachedTotalCommands = totalCommands;
        }

        // prefix is already passed dynamically from main.js
        const modeRaw = config.WORK_TYPE || 'public';
        const mode = modeRaw === 'private' ? 'ᴘʀɪᴠᴀᴛᴇ' : 'ᴘᴜʙʟɪᴄ';
        
        // Calculate bot uptime using process.uptime()
        const elapsedSeconds = Math.floor(process.uptime());
        const hours = Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        const time = `${hours}:${minutes}:${seconds}`;

        const caption = `
*╭━━━〔 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷*
*┃*
*┃ ✦ ${toSmallUnicode('HELLO')} @${m.sender.split('@')[0]}*
*┃*
*┃ ✦╭────〔 ${toSmallUnicode('BOT INFO')} 〕────⊷*
*┃ ✦│▸ ${toSmallUnicode('TOTAL COMMANDS')} : ${cachedTotalCommands}*
*┃ ✦│▸ ${toSmallUnicode('TIME')} : ${time}*
*┃ ✦│▸ ${toSmallUnicode('PREFIX')} : ${activePrefix}*
*┃ ✦│▸ ${toSmallUnicode('MODE')} : ${mode}*
*┃ ✦╰─────────────┈⊷*
*┃*
*╰━━━━━━━━━━━━━━━━━━━━⊷*
${cachedMenuText}
> ${toSmallUnicode('POWERED BY MAZARI-MD')}
`.trim();

        // Send menu with channel button
        await conn.sendMessage(m.chat, {
            image: cachedImageBuffer ? cachedImageBuffer : { url: "https://files.catbox.moe/jtarms.png" },
            caption: caption,
            buttons: [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📢 𝑽𝒊𝒆𝒘 𝑪𝒉𝒂𝒏𝒏𝒆𝒍",
                        url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B",
                        merchant_url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
                    })
                }
            ],
            contextInfo: {
                mentionedJid: [m.sender]
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("AllMenu Error:", err);
        reply("❌ Error while generating menu.");
    }
});