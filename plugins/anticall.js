const { cmd } = require('../arslan');
const pgDB = require('../lib/database-pg');
const { updateUserConfigInPostgres } = pgDB;

// Helper function to update config in memory and database
const updateConfig = async (key, value, botNumber, config, customReply, conn) => {
    try {
        if (conn && !conn.userConfig) {
            conn.userConfig = { ...config };
        }
        if (conn && conn.userConfig) {
            conn.userConfig[key] = value;
        }
        
        const newConfig = { ...(conn?.userConfig || config) }; 
        newConfig[key] = value;
        
        await updateUserConfigInPostgres(botNumber, newConfig);
        
        if (typeof customReply === 'function') {
            return customReply();
        } else {
            return customReply(`✅ *${key}* has been updated to: *${value}*`);
        }
    } catch (e) {
        console.error(e);
        return (typeof customReply === 'function' ? 
                () => customReply("❌ Error while saving to database.") :
                customReply("❌ Error while saving to database."));
    }
};

cmd({
    pattern: "anticall",
    alias: ["ac", "antical"],
    desc: "Auto reject calls",
    category: "owner",
    react: "📵"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    // Only real Owner or Sudo can toggle
    if (!isOwner) return reply("⚠️ 𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('ANTI_CALL', 'true', botNumber, config, () => reply(`🟢 𝑨𝒏𝒕𝒊-𝑪𝒂𝒍𝒍\n> 𝑨𝒏𝒕𝒊-𝒄𝒂𝒍𝒍 𝒆𝒏𝒂𝒃𝒍𝒆𝒅.`), conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('ANTI_CALL', 'false', botNumber, config, () => reply(`🔴 𝑨𝒏𝒕𝒊-𝑪𝒂𝒍𝒍\n> 𝑨𝒏𝒕𝒊-𝒄𝒂𝒍𝒍 𝒅𝒊𝒔𝒂𝒃𝒍𝒆𝒅.`), conn);
    } else {
        const current = conn.userConfig?.ANTI_CALL || config.ANTI_CALL || "false";
        reply(`*Current Status:* ${current === 'true' ? 'ON' : 'OFF'}\n\n*Usage:*\n.anticall on\n.anticall off`);
    }
});
