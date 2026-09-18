const { cmd } = require('../arslan');

cmd({
    pattern: "tagall",
    alias: ["gc_tagall", "mentionall"],
    desc: "Tag all members",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, {
    from, isGroup, reply, body, command, participants, isOwner, isAdmins
}) => {
    try {
        if (!isGroup) return reply("⚠️ 𝑮𝒓𝒐𝒖𝒑 𝑶𝒏𝒍𝒚\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒐𝒏𝒍𝒚 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔.");
        if (!isOwner && !isAdmins) return reply("⚠️ 𝑨𝒅𝒎𝒊𝒏 𝑨𝒄𝒄𝒆𝒔𝒔 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅\n> 𝑶𝒏𝒍𝒚 𝒂𝒅𝒎𝒊𝒏𝒔 𝒄𝒂𝒏 𝒖𝒔𝒆 𝒕𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅.");

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone!";

        // Ensure unique participants
        const uniqueParticipants = Array.from(new Map(participants.map(p => [p.id, p])).values());

        let text = `╭━━━〔 👑 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷\n┃\n┃ 📢 ✦ 𝑻𝑨𝑮 𝑨𝑳𝑳\n┃\n┃ 📝 ✦ 𝑴𝑬𝑺𝑺𝑨𝑮𝑬\n┃ ➜ ${message}\n┃\n`;
        
        uniqueParticipants.forEach((member, i) => {
            text += `┃ ♛ ${i + 1}. @${member.id.split('@')[0]}\n`;
        });
        
        text += `┃\n┃ 👥 ✦ 𝑻𝑶𝑻𝑨𝑳 : ${uniqueParticipants.length} 𝑴𝑬𝑴𝑩𝑬𝑹𝑺\n╰━━━━━━━━━━━━━━━━━━━━⊷`;
        
        await conn.sendMessage(from, {
            text: text,
            mentions: uniqueParticipants.map(p => p.id)
        }, { quoted: mek });

    } catch (err) {
        console.error("TagAll Error:", err);
        reply("❌ Error in tagall: " + err.message);
    }
});
