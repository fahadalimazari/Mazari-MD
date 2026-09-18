const { cmd } = require("../arslan");
const config = require("../config");

cmd({
    pattern: "alive2",
    desc: "Check if the bot is active.",
    category: "owner",
    react: "💡",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        const pushname = m.pushName || "User";
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
        const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        let sec = process.uptime();
        const runtimeHours = Math.floor(sec / 3600);
        const runtimeMinutes = Math.floor((sec % 3600) / 60);
        const runtimeSeconds = Math.floor(sec % 60);

        const formattedInfo = `╭━━━〔 🤖 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷
┃
┃ 👋 ✦ 𝑯𝒊 ${pushname}
┃
┃ 🕒 ✦ 𝑻𝑰𝑴𝑬 : ${currentTime}
┃ 📅 ✦ 𝑫𝑨𝑻𝑬 : ${currentDate}
┃ ⏳ ✦ 𝑼𝑷𝑻𝑰𝑴𝑬 : ${runtimeHours}h ${runtimeMinutes}m ${runtimeSeconds}s
┃
┃ 🟢 ✦ 𝑨𝑳𝑰𝑽𝑬 & 𝑹𝑬𝑨𝑫𝒀
┃ 🤖 ✦ 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 𝑰𝑺 𝑶𝑵𝑳𝑰𝑵𝑬
┃
┃ ⚡ ✦ 𝑬𝒏𝒋𝒐𝒚 𝒕𝒉𝒆 𝒔𝒆𝒓𝒗𝒊𝒄𝒆!
┃
╰━━━━━━━━━━━━━━━━━━━━⊷`;

        // Check if ALIVE_IMG is globally defined
        const imgUrl = typeof ALIVE_IMG !== 'undefined' ? ALIVE_IMG : (config.ALIVE_IMG || "https://files.catbox.moe/jtarms.png");

        await conn.sendMessage(from, {
            image: { url: imgUrl },
            caption: formattedInfo,
            contextInfo: {
                mentionedJid: [m.sender]
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Error in alive command: ", error);
        
        const errorMessage = `❌ 𝑨𝒍𝒊𝒗𝒆 𝑪𝒉𝒆𝒄𝒌 𝑭𝒂𝒊𝒍𝒆𝒅\n\n> 🛠️ 𝑬𝒓𝒓𝒐𝒓 : ${error.message}\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.`;
        return reply(errorMessage);
    }
});
