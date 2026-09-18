const { cmd } = require("../arslan");


//================= LEAKVIDEO 1 =================

cmd({
    pattern: "leakvideo",
    desc: "Send random leak video",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { reply, from, isGroup, isOwner }) => {

    try {
        if (isGroup || !isOwner) {
            return reply("🔒 𝑶𝒘𝒏𝒆𝒓 𝑰𝒏𝒃𝒐𝒙 𝑶𝒏𝒍𝒚\n\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒐𝒏𝒍𝒚 𝒂𝒗𝒂𝒊𝒍𝒂𝒃𝒍𝒆 𝒊𝒏 𝒕𝒉𝒆 𝒐𝒘𝒏𝒆𝒓 𝒊𝒏𝒃𝒐𝒙.");
        }

        await reply("⏳ 𝑽𝒊𝒅𝒆𝒐 𝑭𝒆𝒕𝒄𝒉𝒊𝒏𝒈\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕...");

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: `╭━━━〔 🎬 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷\n┃\n┃ 🎬 ✦ 𝑹𝑨𝑵𝑫𝑶𝑴 𝑽𝑰𝑫𝑬𝑶\n┃\n┃ ✅ ✦ 𝑽𝑰𝑫𝑬𝑶 𝑹𝑬𝑨𝑫𝒀\n┃\n┃ ⚡ ✦ 𝑬𝒏𝒋𝒐𝒚 𝒕𝒉𝒆 𝒗𝒊𝒅𝒆𝒐!\n┃\n╰━━━━━━━━━━━━━━━━━━━━⊷`,
            contextInfo: { mentionedJid: [m.sender] }
        });

    } catch (err) {
        console.log(err);
        reply("❌ 𝑽𝒊𝒅𝒆𝒐 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑽𝒊𝒅𝒆𝒐 𝒍𝒐𝒂𝒅 𝒏𝒂𝒉𝒊𝒏 𝒉𝒖𝒊.");
    }

});


//================= LEAKVIDEO 2 =================

cmd({
    pattern: "leakvideo2",
    desc: "Send random leak video 2",
    category: "download",
    react: "🔥",
    filename: __filename
}, async (conn, mek, m, { reply, from, isGroup, isOwner }) => {

    try {
        if (isGroup || !isOwner) {
            return reply("🔒 𝑶𝒘𝒏𝒆𝒓 𝑰𝒏𝒃𝒐𝒙 𝑶𝒏𝒍𝒚\n\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒐𝒏𝒍𝒚 𝒂𝒗𝒂𝒊𝒍𝒂𝒃𝒍𝒆 𝒊𝒏 𝒕𝒉𝒆 𝒐𝒘𝒏𝒆𝒓 𝒊𝒏𝒃𝒐𝒙.");
        }

        await reply("⏳ 𝑽𝒊𝒅𝒆𝒐 𝑭𝒆𝒕𝒄𝒉𝒊𝒏𝒈\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕...");

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos2";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: `╭━━━〔 🔥 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷\n┃\n┃ 🔥 ✦ 𝑹𝑨𝑵𝑫𝑶𝑴 𝑽𝑰𝑫𝑬𝑶 𝟐\n┃\n┃ ✅ ✦ 𝑽𝑰𝑫𝑬𝑶 𝑹𝑬𝑨𝑫𝒀\n┃\n┃ ⚡ ✦ 𝑬𝒏𝒋𝒐𝒚 𝒕𝒉𝒆 𝒗𝒊𝒅𝒆𝒐!\n┃\n╰━━━━━━━━━━━━━━━━━━━━⊷`,
            contextInfo: { mentionedJid: [m.sender] }
        });

    } catch (err) {
        console.log(err);
        reply("❌ 𝑽𝒊𝒅𝒆𝒐 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑽𝒊𝒅𝒆𝒐 𝒍𝒐𝒂𝒅 𝒏𝒂𝒉𝒊𝒏 𝒉𝒖𝒊.");
    }

});
