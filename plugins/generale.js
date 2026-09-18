const { cmd, commands } = require('../arslan');
const config = require('../config');
const os = require('os');

// =================================================================
// ⏳ COMMANDE UPTIME
// =================================================================
cmd({
    pattern: "uptime",
    alias: ["up"],
    desc: "Vérifier l'uptime et la RAM",
    category: "general",
    react: "🟢",
    filename: __filename
},
async(conn, mek, m, { from, reply, myquoted }) => {
    try {
        // 1. Calcul Uptime
        let sec = process.uptime();
        let d = Math.floor(sec / (3600 * 24));
        let h = Math.floor((sec % (3600 * 24)) / 3600);
        let min = Math.floor((sec % 3600) / 60);
        let s = Math.floor(sec % 60);
        
        // 2. Calcul Mémoire (RAM)
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
        const usedMem = (totalMem - freeMem).toFixed(0);

        // 3. Message Final Stylé
        const pingMsg = `🟢 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 𝑼𝑷𝑻𝑰𝑴𝑬\n\n> ⏳ 𝑼𝒑𝒕𝒊𝒎𝒆 : ${d}𝒅 ${h}𝒉 ${min}𝒎 ${s}𝒔\n> 💾 𝑹𝑨𝑴 : ${usedMem}MB / ${totalMem}MB`;

        await conn.sendMessage(from, { text: pingMsg }, { quoted: myquoted || mek });

    } catch (e) {
        reply("Error: " + e.message);
    }
});


// =================================================================
// 👑 COMMANDE OWNER (Carte de visite)
// =================================================================
cmd({
    pattern: "owner",
    desc: "Contacter le créateur",
    category: "owner",
    react: "👑",
    filename: __filename
},
async(conn, mek, m, { from, myquoted }) => {
    const ownerNumber = config.OWNER_NUMBER;
    
    // Création d'une vCard (Fiche contact)
    const vcard = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  'FN:MAZARI-MD (Owner)\n' +
                  'ORG:MAZARI-MD Corp;\n' +
                  `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n` +
                  'END:VCARD';

    await conn.sendMessage(from, {
        contacts: {
            displayName: 'MAZARI-MD',
            contacts: [{ vcard }]
        }
    }, { quoted: myquoted || mek });
});
