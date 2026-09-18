const { cmd } = require('../arslan');

cmd({
    pattern: "prefix",
    desc: "Set bot prefix dynamically",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, reply, senderNumber, botNumber, isOwner }) => {
    if (!isOwner) return reply("🔒 𝑶𝒘𝒏𝒆𝒓 𝑶𝒏𝒍𝒚\n\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒇𝒐𝒓 𝒐𝒘𝒏𝒆𝒓 𝒐𝒏𝒍𝒚.");

    const newPrefix = args.join(" ").trim();
    
    if (newPrefix) {
        if (newPrefix.length > 0) {
            conn.userConfig.PREFIX = newPrefix;
            try {
                const { updateUserConfigInPostgres } = require('../lib/database-pg');
                await updateUserConfigInPostgres(botNumber, { PREFIX: newPrefix });
            } catch(e) {}
            return reply(`✅ 𝑷𝒓𝒆𝒇𝒊𝒙 𝑼𝒑𝒅𝒂𝒕𝒆𝒅\n\n> 𝑵𝒆𝒘 𝑷𝒓𝒆𝒇𝒊𝒙 : ${newPrefix}`);
        } else {
            return reply("⚠️ 𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝑷𝒓𝒆𝒇𝒊𝒙\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒆𝒏𝒕𝒆𝒓 𝒂 𝒗𝒂𝒍𝒊𝒅 𝒑𝒓𝒆𝒇𝒊𝒙.");
        }
    } else {
        conn.pendingPrefix = conn.pendingPrefix || new Map();
        conn.pendingPrefix.set(senderNumber, true);
        return reply("⚙️ 𝑷𝒓𝒆𝒇𝒊𝒙 𝑺𝒆𝒕𝒕𝒊𝒏𝒈\n\n> 𝑾𝒉𝒊𝒄𝒉 𝒑𝒓𝒆𝒇𝒊𝒙 𝒅𝒐 𝒚𝒐𝒖 𝒘𝒂𝒏𝒕 𝒕𝒐 𝒔𝒆𝒕?\n> 𝑬𝒙𝒂𝒎𝒑𝒍𝒆 : ! 𝒐𝒓 # 𝒐𝒓 $");
    }
});
