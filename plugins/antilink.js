// ============================================
// 🔗 ANTI-LINK - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 🔥 Auto delete links + Warn + Kick
// ============================================

const { cmd } = require('../arslan');
const config = require('../config');

// ─── ALLOWED DOMAINS ───
const ALLOWED_DOMAINS = [
    'whatsapp.com',
    'wa.me',
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'github.com',
    'google.com',
    'drive.google.com'
];

// ─── LINK PATTERNS ───
const LINK_PATTERNS = [
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
];

// ─── CHECK IF LINK IS ALLOWED ───
function isAllowedLink(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        return ALLOWED_DOMAINS.some(domain => hostname.includes(domain));
    } catch {
        return false;
    }
}

// ─── EXTRACT LINKS FROM TEXT ───
function extractLinks(text) {
    const links = [];
    for (const pattern of LINK_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                if (!links.includes(match)) {
                    links.push(match);
                }
            }
        }
    }
    return links;
}

// ============================================
// 📌 MAIN COMMAND
// ============================================
cmd({
    pattern: "antilink",
    alias: ["al", "nolink", "linkfilter"],
    desc: "🔗 Anti-Link System for groups",
    category: "admin",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args, prefix }) => {

    // ─── CHECK GROUP ───
    if (!isGroup) {
        return reply("⚠️ *𝑮𝒓𝒐𝒖𝒑𝒔 𝑶𝒏𝒍𝒚*\n𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔 𝒐𝒏𝒍𝒚.");
    }

    // ─── CHECK ADMIN PERMISSION ───
    if (!isAdmins && !isOwner) {
        return reply("🔒 *𝑨𝒅𝒎𝒊𝒏 𝑶𝒏𝒍𝒚*\n𝑨𝒅𝒎𝒊𝒏 𝒑𝒆𝒓𝒎𝒊𝒔𝒔𝒊𝒐𝒏 𝒊𝒔 𝒓𝒆𝒒𝒖𝒊𝒓𝒆𝒅.");
    }

    if (!isBotAdmins) {
        return reply("🛡️ *𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅*\n𝑴𝒂𝒌𝒆 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏 𝒇𝒊𝒓𝒔𝒕.");
    }

    // ─── INIT GLOBAL ───
    if (!global.ANTILINK_STATUS) global.ANTILINK_STATUS = {};
    if (!global.ANTILINK_ACTION) global.ANTILINK_ACTION = {};
    if (!global.ANTILINK_WARN) global.ANTILINK_WARN = {};
    if (!global.ANTILINK_WARN_TIMER) global.ANTILINK_WARN_TIMER = {};

    // ─── GET ARGUMENT ───
    const action = args[0]?.toLowerCase() || '';
    const actionType = args[1]?.toLowerCase() || 'warn';

    // ─── SHOW STATUS ───
    if (!action || (action !== 'on' && action !== 'off')) {
        const status = global.ANTILINK_STATUS[from] ? '𝑶𝑵' : '𝑶𝑭𝑭';
        const actionMode = global.ANTILINK_ACTION[from] || 'warn';
        
        return reply(`🔗 *𝑨𝒏𝒕𝒊𝑳𝒊𝒏𝒌 𝑺𝒕𝒂𝒕𝒖𝒔:* ${status} ⚡ *𝑨𝒄𝒕𝒊𝒐𝒏:* ${actionMode.toUpperCase()}
⚠️ ${prefix}antilink on warn — 𝑾𝒂𝒓𝒏 𝒐𝒏 𝒍𝒊𝒏𝒌𝒔
🗑️ ${prefix}antilink on delete — 𝑫𝒆𝒍𝒆𝒕𝒆 𝒍𝒊𝒏𝒌𝒔
🚷 ${prefix}antilink on kick — 𝑲𝒊𝒄𝒌 𝒖𝒔𝒆𝒓𝒔 𝒇𝒐𝒓 𝒍𝒊𝒏𝒌𝒔
🔕 ${prefix}antilink off — 𝑫𝒊𝒔𝒂𝒃𝒍𝒆 𝑨𝒏𝒕𝒊𝑳𝒊𝒏𝒌`);
    }

    // ─── TOGGLE ON ───
    if (action === 'on') {
        global.ANTILINK_STATUS[from] = true;
        global.ANTILINK_ACTION[from] = actionType || 'warn';
        
        const actionMsg = {
            'warn': '𝑾𝒂𝒓𝒏',
            'delete': '𝑫𝒆𝒍𝒆𝒕𝒆',
            'kick': '𝑲𝒊𝒄𝒌'
        }[actionType] || '𝑾𝒂𝒓𝒏';

        await reply(`🛡️ 𝑨𝒏𝒕𝒊𝑳𝒊𝒏𝒌 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅
⚡ 𝑨𝒄𝒕𝒊𝒐𝒏: ${actionMsg}`);

    // ─── TOGGLE OFF ───
    } else if (action === 'off') {
        global.ANTILINK_STATUS[from] = false;
        delete global.ANTILINK_ACTION[from];
        
        await reply(`🔕 𝑨𝒏𝒕𝒊𝑳𝒊𝒏𝒌 𝑫𝒆𝒂𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅
𝑳𝒊𝒏𝒌 𝒇𝒊𝒍𝒕𝒆𝒓𝒊𝒏𝒈 𝒊𝒔 𝒏𝒐𝒘 𝒅𝒊𝒔𝒂𝒃𝒍𝒆𝒅.`);
    }
});

// ============================================
// 📌 ANTI-LINK HANDLER (Auto)
// ============================================

// ─── LISTEN FOR MESSAGES ───
cmd({
    pattern: "antilink_handler",
    on: "body",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, senderNumber, reply }) => {

    // ─── SKIP IF NOT GROUP ───
    if (!isGroup) return;

    // ─── SKIP IF ANTI-LINK OFF ───
    if (!global.ANTILINK_STATUS?.[from]) return;

    // ─── SKIP IF BOT NOT ADMIN ───
    if (!isBotAdmins) return;

    // ─── SKIP ADMINS & OWNER ───
    if (isAdmins || isOwner) return;

    // ─── GET MESSAGE BODY ───
    const body = mek.message?.conversation || 
                 mek.message?.extendedTextMessage?.text || 
                 mek.message?.imageMessage?.caption ||
                 mek.message?.videoMessage?.caption || '';
    
    if (!body) return;

    // ─── CHECK FOR LINKS ───
    const links = extractLinks(body);
    if (links.length === 0) return;

    // ─── CHECK IF ALL LINKS ARE ALLOWED ───
    const hasDisallowedLink = links.some(link => !isAllowedLink(link));
    if (!hasDisallowedLink) return;

    // ─── GET ACTION ───
    const action = global.ANTILINK_ACTION[from] || 'warn';

    // ─── INIT WARN COUNT ───
    if (!global.ANTILINK_WARN[from]) global.ANTILINK_WARN[from] = {};
    if (!global.ANTILINK_WARN[from][senderNumber]) global.ANTILINK_WARN[from][senderNumber] = 0;

    // ─── CLEAR EXISTING TIMER IF ANY ───
    const timerKey = `${from}_${senderNumber}`;
    if (global.ANTILINK_WARN_TIMER[timerKey]) {
        clearTimeout(global.ANTILINK_WARN_TIMER[timerKey]);
        delete global.ANTILINK_WARN_TIMER[timerKey];
    }

    // ─── INCREMENT WARN ───
    global.ANTILINK_WARN[from][senderNumber]++;

    // ─── START 5-MINUTE EXPIRY TIMER ───
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    global.ANTILINK_WARN_TIMER[timerKey] = setTimeout(() => {
        // Timer expired - delete warning count
        delete global.ANTILINK_WARN[from][senderNumber];
        delete global.ANTILINK_WARN_TIMER[timerKey];
        console.log(`[AntiLink] Timer expired for ${senderNumber} in group ${from}`);
    }, fiveMinutes);

    // ─── WARN USER ───
    const warnCount = global.ANTILINK_WARN[from][senderNumber];
    const maxWarns = 3;
    const linkDisplay = links.slice(0, 2).join(', ') + (links.length > 2 ? ` (+${links.length - 2} more)` : '');
    
    const warnMsg = `🔗 𝑳𝒊𝒏𝒌 𝑫𝒆𝒕𝒆𝒄𝒕𝒆𝒅
⚠️ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒅𝒐𝒏'𝒕 𝒔𝒉𝒂𝒓𝒆 𝒍𝒊𝒏𝒌𝒔. 𝑾𝒂𝒓𝒏𝒊𝒏𝒈: ${warnCount}/${maxWarns}`;

    await conn.sendMessage(from, {
        text: warnMsg,
        mentions: [sender]
    }, { quoted: mek });

    // ─── DELETE MESSAGE ───
    try {
        await conn.sendMessage(from, {
            delete: mek.key
        });
        console.log(`[AntiLink] 🗑️ Deleted link message from ${senderNumber}`);
    } catch (e) {
        console.log('[AntiLink] Delete error:', e.message);
    }

    // ─── ACTION: KICK ───
    if (action === 'kick' && warnCount >= maxWarns) {
        try {
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, {
                text: `🚷 𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅
🚫 𝑹𝒆𝒑𝒆𝒂𝒕𝒆𝒅 𝒍𝒊𝒏𝒌 𝒗𝒊𝒐𝒍𝒂𝒕𝒊𝒐𝒏. 𝑾𝒂𝒓𝒏𝒊𝒏𝒈𝒔: ${warnCount}/${maxWarns}`,
                mentions: [sender]
            }, { quoted: mek });
            
            delete global.ANTILINK_WARN[from][senderNumber];
            if (global.ANTILINK_WARN_TIMER[timerKey]) {
                clearTimeout(global.ANTILINK_WARN_TIMER[timerKey]);
                delete global.ANTILINK_WARN_TIMER[timerKey];
            }
            console.log(`[AntiLink] 👢 Kicked ${senderNumber} for links`);
        } catch (e) {
            console.log('[AntiLink] Kick error:', e.message);
        }
    }
});

console.log('🔗 MAZARI-MD - AntiLink Plugin Loaded!');

