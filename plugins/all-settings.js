const { cmd } = require('../arslan');
const pgDB = require('../lib/database-pg');
const { updateUserConfigInPostgres } = pgDB;

// Helper function to update config in memory and database
const updateConfig = async (key, value, botNumber, config, customReply, conn) => {
    try {
        // 1. Ensure conn.userConfig is initialized safely if missing
        if (conn && !conn.userConfig) {
            conn.userConfig = { ...config };
        }

        // 2. Update in-memory config for the CURRENT SESSION ONLY
        if (conn && conn.userConfig) {
            conn.userConfig[key] = value;
        }
        
        // 3. Update in Database (Persistent)
        // We persist the session's configuration to DB
        const newConfig = { ...(conn?.userConfig || config) }; 
        newConfig[key] = value;
        
        await updateUserConfigInPostgres(botNumber, newConfig);
        
        // 4. Call custom reply function if provided, otherwise default message
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

// ============================================================
// 1. PRESENCE MANAGEMENT (Recording / Typing)
// ============================================================

cmd({
    pattern: "autorecording",
    alias: ["autorec", "arecording"],
    desc: "Enable/Disable auto recording simulation",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_RECORDING', 'true', botNumber, config, reply, conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_RECORDING', 'false', botNumber, config, reply, conn);
    } else {
        reply(`*Current: ${config.AUTO_RECORDING}*\n\n*Usage:*\n.autorecording on/off`);
    }
});

cmd({
    pattern: "autotyping",
    alias: ["autotype", "atyping"],
    desc: "Enable/Disable auto typing simulation",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_TYPING', 'true', botNumber, config, reply, conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_TYPING', 'false', botNumber, config, reply, conn);
    } else {
        reply(`*Current: ${config.AUTO_TYPING}*\n\n*Usage:*\n.autotyping on/off`);
    }
});

// ============================================================
// 3. GROUP MANAGEMENT (Welcome / Goodbye)
// ============================================================

cmd({
    pattern: "welcome",
    desc: "Enable/Disable welcome messages",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('WELCOME', 'true', botNumber, config, reply, conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('WELCOME', 'false', botNumber, config, reply, conn);
    } else {
        reply(`*Current: ${config.WELCOME}*\n\n*Usage:*\n.welcome on/off`);
    }
});

cmd({
    pattern: "goodbye",
    desc: "Enable/Disable goodbye messages",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('GOODBYE', 'true', botNumber, config, reply, conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('GOODBYE', 'false', botNumber, config, reply, conn);
    } else {
        reply(`*Current: ${config.GOODBYE}*\n\n*Usage:*\n.goodbye on/off`);
    }
});

// ============================================================
// 4. READ & STATUS MANAGEMENT
// ============================================================

cmd({
    pattern: "autoread",
    desc: "Enable/Disable auto read messages (Blue Tick)",
    category: "settings",
    react: "👀"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('READ_MESSAGE', 'true', botNumber, config, reply, conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('READ_MESSAGE', 'false', botNumber, config, reply, conn);
    } else {
        reply(`*Current: ${config.READ_MESSAGE}*\n\n*Usage:*\n.autoread on/off`);
    }
});

cmd({
    pattern: "autoviewsview",
    alias: ["avs", "statusseen", "astatus"],
    desc: "Auto view status updates",
    category: "settings",
    react: "😎"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_VIEW_STATUS', 'true', botNumber, config, reply, conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_VIEW_STATUS', 'false', botNumber, config, reply, conn);
    } else {
        reply(`*Current: ${config.AUTO_VIEW_STATUS}*\n\n*Usage:*\n.autoviewsview on/off`);
    }
});

cmd({
    pattern: "autolikestatus",
    alias: ["als"],
    desc: "Auto like status updates",
    category: "settings",
    react: "❤️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_LIKE_STATUS', 'true', botNumber, config, reply, conn);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_LIKE_STATUS', 'false', botNumber, config, reply, conn);
    } else {
        reply(`*Current: ${config.AUTO_LIKE_STATUS}*\n\n*Usage:*\n.autolikestatus on/off`);
    }
});

// ============================================================
// 5. SYSTEM (Mode & Prefix)
// ============================================================

cmd({
    pattern: "mode",
    desc: "Change bot mode (public/private/inbox)",
    category: "settings",
    react: "⚙️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("⚠️ 𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅");
    
    const mode = (args.join(' ') || '').toLowerCase().trim();
    const validModes = ['public', 'private', 'private_inbox'];
    
    // If no argument provided, show current mode status
    if (!mode) {
        const currentMode = conn.userConfig?.WORK_TYPE || config.WORK_TYPE || config.MODE || "public";
        const modeDisplay = currentMode.charAt(0).toUpperCase() + currentMode.slice(1).replace('_', ' ');
        return reply(`⚙️ 𝑪𝒖𝒓𝒓𝒆𝒏𝒕 𝑴𝒐𝒅𝒆 : ${modeDisplay}`);
    }

    if (validModes.includes(mode)) {
        // Normalize to canonical value
        let canonicalMode = mode;
        if (canonicalMode === 'inbox') canonicalMode = 'private_inbox';
        
        // Custom reply messages for each mode
        let modeIcon = "";
        let modeText = "";
        
        switch(canonicalMode) {
            case "private":
                modeIcon = "🔒";
                modeText = "Private";
                break;
            case "public":
                modeIcon = "🌐";
                modeText = "Public";
                break;
            case "private_inbox":
                modeIcon = "📥";
                modeText = "Private Inbox";
                break;
        }
        
        await updateConfig('WORK_TYPE', canonicalMode, botNumber, config, 
            () => reply(`${modeIcon} 𝑴𝒐𝒅𝒆 𝑼𝒑𝒅𝒂𝒕𝒆𝒅 — ${modeText}`), conn);
    } else {
        reply(`❌ 𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝑴𝒐𝒅𝒆\n*Usage:* .mode <${validModes.join('|')}>`);
    }
});

cmd({
    pattern: "setprefix",
    desc: "Change bot prefix",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*❌ Owner only command*");
    const newPrefix = args[0];

    if (newPrefix) {
        // Ensure prefix is short (single character or short string)
        if (newPrefix.length > 1 && newPrefix !== 'noprefix') return reply("*❌ Prefix must be short (e.g. . or ! or #)*");
        
        await updateConfig('PREFIX', newPrefix, botNumber, config, reply, conn);
    } else {
        reply(`*Current prefix: ${config.PREFIX}*\n\n*Usage:*\n.setprefix <. or ! or # or _ or - or noprefix>`);
    }
});
