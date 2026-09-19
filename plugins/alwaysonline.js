const { cmd } = require('../arslan');
const { updateUserConfigInPostgres } = require('../lib/database-pg');

cmd({
    pattern: "alwaysonline",
    alias: ["ao", "alwayson"],
    desc: "Toggle always online presence",
    category: "owner",
    react: "🟢",
    filename: __filename
}, async (conn, mek, m, { reply, isCreator, senderNumber }) => {
    try {
        if (!isCreator) {
            return reply("⚠️ 𝑶𝒘𝒏𝒆𝒓 𝑶𝒏𝒍𝒚\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒓𝒆𝒔𝒆𝒓𝒗𝒆𝒅 𝒇𝒐𝒓 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒐𝒘𝒏𝒆𝒓.");
        }

        // Initialize userConfig if not present
        if (!conn.userConfig) conn.userConfig = {};

        // Toggle state
        const newState = !conn.userConfig.ALWAYS_ONLINE;
        conn.userConfig.ALWAYS_ONLINE = newState;

        // Save to DB (using the raw number for the session)
        const sessionId = conn.user.id.split(':')[0].split('@')[0];
        await updateUserConfigInPostgres(sessionId, conn.userConfig);

        // Apply presence right now
        if (newState) {
            await conn.sendPresenceUpdate('available');
            return reply("🟢 𝑨𝒍𝒘𝒂𝒚𝒔 𝑶𝒏𝒍𝒊𝒏𝒆\n> 𝑨𝒍𝒘𝒂𝒚𝒔 𝑶𝒏𝒍𝒊𝒏𝒆 𝒆𝒏𝒂𝒃𝒍𝒆𝒅.");
        } else {
            await conn.sendPresenceUpdate('unavailable');
            return reply("🔴 𝑨𝒍𝒘𝒂𝒚𝒔 𝑶𝒏𝒍𝒊𝒏𝒆\n> 𝑨𝒍𝒘𝒂𝒚𝒔 𝑶𝒏𝒍𝒊𝒏𝒆 𝒅𝒊𝒔𝒂𝒃𝒍𝒆𝒅.");
        }
    } catch (e) {
        console.error(e);
        reply("Error: " + e.message);
    }
});
