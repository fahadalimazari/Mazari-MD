const { cmd } = require('../arslan');
const { updateUserConfigInPostgres } = require('../lib/database-pg');

// ==================== SETSUDO COMMAND ====================
cmd({
    pattern: "setsudo",
    desc: "Add user to sudo list",
    category: "owner",
    react: "🛡️",
    filename: __filename
}, async (conn, mek, m, { reply, mentionedJid, quoted, realOwner, botNumber }) => {
    try {
        if (!realOwner) return reply("⚠️ 𝑶𝒘𝒏𝒆𝒓 𝑶𝒏𝒍𝒚\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒓𝒆𝒔𝒆𝒓𝒗𝒆𝒅 𝒇𝒐𝒓 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒐𝒘𝒏𝒆𝒓.");
        
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
        
        let targetNum = users[0].split('@')[0].split(':')[0];
        
        if (!conn.userConfig) conn.userConfig = {};
        if (!Array.isArray(conn.userConfig.SUDO)) conn.userConfig.SUDO = [];
        
        if (conn.userConfig.SUDO.includes(targetNum)) {
            return reply(`⚠️ 𝑨𝒍𝒓𝒆𝒂𝒅𝒚 𝑺𝒖𝒅𝒐\n> @${targetNum} 𝒊𝒔 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒂 𝒔𝒖𝒅𝒐 𝒖𝒔𝒆𝒓.`, { mentions: [users[0]] });
        }
        
        conn.userConfig.SUDO.push(targetNum);
        await updateUserConfigInPostgres(botNumber, { SUDO: conn.userConfig.SUDO });
        
        reply(`🛡️ 𝑺𝒖𝒅𝒐 𝑨𝒅𝒅𝒆𝒅\n> 𝑺𝒖𝒅𝒐 𝒂𝒄𝒄𝒆𝒔𝒔 𝒈𝒓𝒂𝒏𝒕𝒆𝒅.`);
    } catch (e) {
        console.error("SetSudo Error:", e);
        reply("❌ Error: " + e.message);
    }
});

// ==================== DELSUDO COMMAND ====================
cmd({
    pattern: "delsudo",
    desc: "Remove user from sudo list",
    category: "owner",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, { reply, mentionedJid, quoted, realOwner, botNumber }) => {
    try {
        if (!realOwner) return reply("⚠️ 𝑶𝒘𝒏𝒆𝒓 𝑶𝒏𝒍𝒚\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒓𝒆𝒔𝒆𝒓𝒗𝒆𝒅 𝒇𝒐𝒓 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒐𝒘𝒏𝒆𝒓.");
        
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
        
        let targetNum = users[0].split('@')[0].split(':')[0];
        
        if (!conn.userConfig || !Array.isArray(conn.userConfig.SUDO) || !conn.userConfig.SUDO.includes(targetNum)) {
            return reply(`⚠️ 𝑵𝒐𝒕 𝑺𝒖𝒅𝒐\n> @${targetNum} 𝒊𝒔 𝒏𝒐𝒕 𝒊𝒏 𝒕𝒉𝒆 𝒔𝒖𝒅𝒐 𝒍𝒊𝒔𝒕.`, { mentions: [users[0]] });
        }
        
        conn.userConfig.SUDO = conn.userConfig.SUDO.filter(num => num !== targetNum);
        await updateUserConfigInPostgres(botNumber, { SUDO: conn.userConfig.SUDO });
        
        reply(`🗑️ 𝑺𝒖𝒅𝒐 𝑹𝒆𝒎𝒐𝒗𝒆𝒅\n> 𝑺𝒖𝒅𝒐 𝒂𝒄𝒄𝒆𝒔𝒔 𝒓𝒆𝒗𝒐𝒌𝒆𝒅.`);
    } catch (e) {
        console.error("DelSudo Error:", e);
        reply("❌ Error: " + e.message);
    }
});

// ==================== SUDOLIST COMMAND ====================
cmd({
    pattern: "sudolist",
    desc: "View sudo list",
    category: "owner",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { reply, isOwner }) => {
    try {
        // Only owner and sudo can view the list (effectiveIsOwner covers both)
        if (!isOwner) return reply("⚠️ 𝑶𝒘𝒏𝒆𝒓 𝑶𝒏𝒍𝒚\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒓𝒆𝒔𝒆𝒓𝒗𝒆𝒅 𝒇𝒐𝒓 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒐𝒘𝒏𝒆𝒓.");
        
        if (!conn.userConfig || !Array.isArray(conn.userConfig.SUDO) || conn.userConfig.SUDO.length === 0) {
            return reply(`🛡️ 𝑺𝒖𝒅𝒐 𝑳𝒊𝒔𝒕\n> 𝑵𝒐 𝒔𝒖𝒅𝒐 𝒖𝒔𝒆𝒓𝒔 𝒂𝒅𝒅𝒆𝒅.`);
        }
        
        let sudoUsers = conn.userConfig.SUDO;
        let text = `🛡️ 𝑺𝒖𝒅𝒐 𝑳𝒊𝒔𝒕\n\n`;
        
        sudoUsers.forEach((num, i) => {
            text += `♛ ${i + 1}. +${num}\n`;
        });
        
        text += `\n👥 𝑻𝒐𝒕𝒂𝒍 : ${sudoUsers.length}`;
        
        reply(text);
    } catch (e) {
        console.error("SudoList Error:", e);
        reply("❌ Error: " + e.message);
    }
});
