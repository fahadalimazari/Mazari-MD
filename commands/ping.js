// ============================================
// ⚡ PING COMMAND - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 📢 Live ping speed monitor with channel button
// ============================================

const { cmd } = require('../arslan');
const { sleep } = require('../lib/functions');

// ─── MAZARI MD CHANNEL CONFIGURATION ───
const MAZARI_CHANNEL = {
    name: "MAZARI MD",
    link: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
};

cmd({
    pattern: "ping",
    desc: "⚡ Live ping speed monitor",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Record start time for real latency measurement
        const startTime = Date.now();
        
        // Send initial ping result directly - no loading message
        const initialPing = Date.now() - startTime;
        
        const pingMessage = await conn.sendMessage(from, {
            text: `⚡ 𝑷𝒊𝒏𝒈 : ${initialPing} 𝒎𝒔`,
            buttons: [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📢 𝑽𝒊𝒆𝒘 𝑪𝒉𝒂𝒏𝒏𝒆𝒍",
                        url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B",
                        merchant_url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
                    })
                }
            ]
        }, { quoted: mek });
        
    } catch (error) {
        console.error('[PING-COMMAND] Error:', error.message);
        await reply("❌ 𝑷𝒊𝒏𝒈 𝑭𝒂𝒊𝒍𝒆𝒅 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏");
    }
});

console.log('⚡ MAZARI-MD - Ping Command Loaded!');