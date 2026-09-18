const { cmd } = require('../arslan');

cmd({
    pattern: "demote",
    alias: ["d", "diss", "dis", "disadmin"],
    desc: "Demote a group admin",
    category: "admin",
    react: "⬇️",
    filename: __filename
}, async (conn, mek, m, {
    from, isGroup, quoted, reply, mentionedJid, isOwner, isAdmins, isBotAdmins
}) => {
    try {
        if (!isGroup) return reply("⚠️ 𝑮𝒓𝒐𝒖𝒑𝒔 𝑶𝒏𝒍𝒚\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔 𝒐𝒏𝒍𝒚.");
        if (!isOwner && !isAdmins) return reply("⚠️ 𝑨𝒅𝒎𝒊𝒏 𝑨𝒄𝒄𝒆𝒔𝒔 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅\n> 𝑶𝒏𝒍𝒚 𝒂𝒅𝒎𝒊𝒏𝒔 𝒄𝒂𝒏 𝒖𝒔𝒆 𝒕𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅.");
        if (!isBotAdmins) return reply("⚠️ 𝑩𝒐𝒕 𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅\n> 𝑴𝒂𝒌𝒆 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏 𝒇𝒊𝒓𝒔𝒕.");

        let users = (mentionedJid && mentionedJid.length > 0) ? mentionedJid : [];
        if (users.length === 0 && quoted && quoted.sender) users = [quoted.sender];
        if (users.length === 0) {
            const msg = m.message;
            const ctx = msg?.extendedTextMessage?.contextInfo || msg?.imageMessage?.contextInfo || msg?.videoMessage?.contextInfo || msg?.audioMessage?.contextInfo || msg?.documentMessage?.contextInfo || msg?.stickerMessage?.contextInfo;
            if (ctx?.participant) users = [ctx.participant];
            else if (ctx?.mentionedJid) users = ctx.mentionedJid;
        }
        
        users = [...new Set(users.filter(u => u && u.includes('@')))];
        if (users.length === 0) return reply("⚠️ 𝑻𝒂𝒓𝒈𝒆𝒕 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅\n> 𝑴𝒆𝒏𝒕𝒊𝒐𝒏 𝒂 𝒖𝒔𝒆𝒓 𝒐𝒓 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒕𝒉𝒆𝒊𝒓 𝒎𝒆𝒔𝒔𝒂𝒈𝒆.");

        try {
            await conn.groupParticipantsUpdate(from, users, "demote");
            reply(`⬇️ 𝑫𝒆𝒎𝒐𝒕𝒆𝒅\n> 𝑨𝒅𝒎𝒊𝒏 𝒂𝒄𝒄𝒆𝒔𝒔 𝒓𝒆𝒎𝒐𝒗𝒆𝒅 𝒔𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚.`, { mentions: users });
        } catch (e) {
            reply("❌ Failed to demote: " + e.message);
        }
    } catch (err) {
        console.error("Demote Error:", err);
    }
});
