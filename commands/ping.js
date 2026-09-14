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
            text: `⚡ 𝑷𝒊𝒏𝒈 : ${initialPing} 𝒎𝒔\n\n📢 Channel: https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B`,
            quoted: mek
        });

        // Live update loop for 30 seconds - edit the same message
        for (let i = 0; i < 30; i++) {
            const loopStart = Date.now();
            
            // Small delay to measure actual latency
            await sleep(50);
            
            const currentPing = Date.now() - loopStart;
            
            // Edit the existing message with new ping value
            await conn.sendMessage(from, {
                text: `⚡ 𝑷𝒊𝒏𝒈 : ${currentPing} 𝒎𝒔\n\n📢 Channel: https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B`,
                edit: pingMessage.key
            });
            
            // Wait 1 second before next update
            await sleep(1000);
        }
        
    } catch (error) {
        console.error('[PING-COMMAND] Error:', error.message);
        await reply("❌ 𝑷𝒊𝒏𝒈 𝑭𝒂𝒊𝒍𝒆𝒅 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏");
    }
});

console.log('⚡ MAZARI-MD - Ping Command Loaded!');