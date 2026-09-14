// ============================================
// 📸 ANTI-GC STATUS - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 🔒 Block Group Status messages in groups
// ============================================

const { cmd } = require('../arslan');
const config = require('../config');

// ─── TEMPORARY WARNING DATA (5-MINUTE EXPIRY) ───
// Format: GLOBAL_ANTIGC_WARN[groupId][userId] = count
// Format: GLOBAL_ANTIGC_WARN_TIMER[groupId][userId] = timerId
if (!global.GLOBAL_ANTIGC_WARN) global.GLOBAL_ANTIGC_WARN = {};
if (!global.GLOBAL_ANTIGC_WARN_TIMER) global.GLOBAL_ANTIGC_WARN_TIMER = {};
if (!global.ANTIGC_STATUS) global.ANTIGC_STATUS = {};

const FIVE_MINUTES = 5 * 60 * 1000;

// ─── CHECK IF SUDO/OWNER ───
async function isOwnerOrSudo(userId) {
    try {
        if (!userId || typeof userId !== 'string') return false;
        const isOwner = config.OWNER_NUMBER.some(num => 
            userId.startsWith(num) || userId.includes(num + '@')
        );
        return isOwner;
    } catch {
        return false;
    }
}

// ─── NORMALIZE JID ───
function normalizeJid(jid) {
    if (!jid || typeof jid !== 'string') return '';
    let str = jid;
    if (str.includes(':')) str = str.split(':')[0] + '@' + str.split('@')[1];
    if (!str.includes('@')) str += '@s.whatsapp.net';
    return str;
}

// ─── START 5-MINUTE EXPIRY TIMER ───
function startWarningTimer(groupId, userId) {
    const timerKey = `${groupId}_${userId}`;
    
    // Clear existing timer if any
    if (global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]) {
        clearTimeout(global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]);
        delete global.GLOBAL_ANTIGC_WARN_TIMER[timerKey];
    }
    
    // Start new timer
    global.GLOBAL_ANTIGC_WARN_TIMER[timerKey] = setTimeout(() => {
        // Delete warning count and timer entry
        if (global.GLOBAL_ANTIGC_WARN[groupId] && global.GLOBAL_ANTIGC_WARN[groupId][userId]) {
            delete global.GLOBAL_ANTIGC_WARN[groupId][userId];
        }
        delete global.GLOBAL_ANTIGC_WARN_TIMER[timerKey];
        console.log(`[AntiGCStatus] Warning timer expired for ${userId} in ${groupId}`);
    }, FIVE_MINUTES);
}

// ─── GET WARN COUNT ───
function getWarnCount(groupId, userId) {
    return global.GLOBAL_ANTIGC_WARN?.[groupId]?.[userId] || 0;
}

// ─── INCREMENT WARN COUNT ───
function incrementWarnCount(groupId, userId) {
    if (!global.GLOBAL_ANTIGC_WARN[groupId]) global.GLOBAL_ANTIGC_WARN[groupId] = {};
    global.GLOBAL_ANTIGC_WARN[groupId][userId] = (global.GLOBAL_ANTIGC_WARN[groupId][userId] || 0) + 1;
    return global.GLOBAL_ANTIGC_WARN[groupId][userId];
}

// ─── RESET WARN COUNT ───
function resetWarnCount(groupId, userId) {
    if (global.GLOBAL_ANTIGC_WARN[groupId]) {
        delete global.GLOBAL_ANTIGC_WARN[groupId][userId];
    }
    const timerKey = `${groupId}_${userId}`;
    if (global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]) {
        clearTimeout(global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]);
        delete global.GLOBAL_ANTIGC_WARN_TIMER[timerKey];
    }
}

// ============================================
// 📌 ANTI-GC STATUS COMMAND
// ============================================
cmd({
    pattern: "antigcstatus",
    alias: ["antigc", "gcstatus"],
    desc: "📸 Block Group Status messages in groups",
    category: "admin",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args }) => {

    // ─── CHECK GROUP ───
    if (!isGroup) {
        return reply("❌ 𝑮𝒓𝒐𝒖𝒑 𝑶𝒏𝒍𝒚 — 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒐𝒏𝒍𝒚 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔.");
    }

    // ─── CHECK ADMIN PERMISSION ───
    if (!isAdmins && !isOwner && !mek.key.fromMe) {
        return reply("🔒 𝑨𝒅𝒎𝒊𝒏 𝑶𝒏𝒍𝒚 — 𝒀𝒐𝒖 𝒏𝒆𝒆𝒅 𝒂𝒅𝒎𝒊𝒏 𝒑𝒆𝒓𝒎𝒊𝒔𝒔𝒊𝒐𝒏 𝒕𝒐 𝒖𝒔𝒆 𝒕𝒉𝒊𝒔.");
    }

    if (!isBotAdmins) {
        return reply("🛡️ 𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅 — 𝑷𝒍𝒆𝒂𝒔𝒆 𝒎𝒂𝒌𝒆 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏 𝒇𝒊𝒓𝒔𝒕.");
    }

    // ─── GET ARGUMENT ───
    const action = args[0]?.toLowerCase() || '';

    // ─── SHOW STATUS ───
    if (!action || (action !== 'del' && action !== 'warn' && action !== 'kick' && action !== 'off')) {
        const status = global.ANTIGC_STATUS[from] || false;
        const actionMode = status ? status.toUpperCase() : '𝑶𝑭𝑭';
        
        return reply(`📸 𝑨𝒏𝒕𝒊 𝑮𝑪 𝑺𝒕𝒂𝒕𝒖𝒔 📡 𝑺𝒕𝒂𝒕𝒖𝒔: ${actionMode}
𝑪𝒐𝒎𝒎𝒂𝒏𝒅𝒔:
🗑️ ${prefix}antigcstatus del — 𝑫𝒆𝒍𝒆𝒕𝒆 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔
⚠️ ${prefix}antigcstatus warn — 𝑾𝒂𝒓𝒏 (3 = 𝑲𝒊𝒄𝒌)
🚷 ${prefix}antigcstatus kick — 𝑰𝒏𝒔𝒕𝒂𝒏𝒕 𝑲𝒊𝒄𝒌
🔕 ${prefix}antigcstatus off — 𝑫𝒊𝒔𝒂𝒃𝒍𝒆`);
    }

    // ─── DEL MODE ───
    if (action === 'del') {
        global.ANTIGC_STATUS[from] = 'del';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊 𝑮𝑪 𝑺𝒕𝒂𝒕𝒖𝒔 🗑️ 𝑫𝒆𝒍𝒆𝒕𝒆 𝑴𝒐𝒅𝒆 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅`);
    }

    // ─── WARN MODE ───
    if (action === 'warn') {
        global.ANTIGC_STATUS[from] = 'warn';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊 𝑮𝑪 𝑺𝒕𝒂𝒕𝒖𝒔 ⚠️ 𝑾𝒂𝒓𝒏 𝑴𝒐𝒅𝒆 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅 — 3 𝒘𝒂𝒓𝒏𝒊𝒏𝒈𝒔 = 𝒌𝒊𝒄𝒌`);
    }

    // ─── KICK MODE ───
    if (action === 'kick') {
        global.ANTIGC_STATUS[from] = 'kick';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊 𝑮𝑪 𝑺𝒕𝒂𝒕𝒖𝒔 🚷 𝑲𝒊𝒄𝒌 𝑴𝒐𝒅𝒆 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅`);
    }

    // ─── OFF MODE ───
    if (action === 'off') {
        global.ANTIGC_STATUS[from] = false;
        return reply(`🔕 𝑨𝒏𝒕𝒊 𝑮𝑪 𝑺𝒕𝒂𝒕𝒖𝒔 📷 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝒇𝒊𝒍𝒕𝒆𝒓𝒊𝒏𝒈 𝒊𝒔 𝒏𝒐𝒘 𝒅𝒊𝒔𝒂𝒃𝒍𝒆𝒅.`);
    }
});

// ============================================
// 📌 ANTI-GC STATUS DETECTOR
// ============================================
cmd({
    pattern: "antigc_detector",
    on: "body",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, reply, quoted }) => {

    // ─── SKIP IF NOT GROUP ───
    if (!isGroup) return;

    // ─── SKIP IF ANTI-GC STATUS OFF ───
    if (!global.ANTIGC_STATUS?.[from]) return;

    // ─── SKIP IF BOT NOT ADMIN ───
    if (!isBotAdmins) return;

    // ─── SKIP ADMINS & OWNER ───
    if (isAdmins || isOwner || mek.key.fromMe) return;

    // ─── DETECT GROUP STATUS ───
    const msg = mek.message;
    let isGroupStatus = false;

    if (msg?.groupStatusMessage || msg?.groupStatusMessageV2) {
        isGroupStatus = true;
    } else if (msg?.extendedTextMessage?.contextInfo?.isGroupStatus) {
        isGroupStatus = true;
    } else if (msg?.imageMessage?.contextInfo?.isGroupStatus || msg?.videoMessage?.contextInfo?.isGroupStatus || msg?.audioMessage?.contextInfo?.isGroupStatus) {
        isGroupStatus = true;
    }

    if (!isGroupStatus) return;

    // ─── GET ACTION ───
    const action = global.ANTIGC_STATUS[from];

    // ─── DELETE MESSAGE ───
    try {
        await conn.sendMessage(from, {
            delete: mek.key
        });
        console.log(`[AntiGCStatus] 🗑️ Deleted group status from ${sender}`);
    } catch (e) {
        console.log('[AntiGCStatus] Delete error:', e.message);
    }

    // ─── KICK MODE: Instant kick ───
    if (action === 'kick') {
        try {
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, {
                text: `🚷 𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅 🚫 @${sender.split('@')[0]} — 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝒔𝒉𝒂𝒓𝒊𝒏𝒈 𝒊𝒔 𝒏𝒐𝒕 𝒂𝒍𝒍𝒐𝒘𝒆𝒅.`,
                mentions: [sender]
            });
            console.log(`[AntiGCStatus] 👢 Kicked ${sender}`);
        } catch (e) {
            console.log('[AntiGCStatus] Kick error:', e.message);
        }
        return;
    }

    // ─── WARN MODE: Warning logic ───
    if (action === 'warn') {
        // Increment warning count
        const warnCount = incrementWarnCount(from, sender);
        
        // Start 5-minute timer (resets on repeated violations)
        startWarningTimer(from, sender);

        // 3 warnings -> kick
        if (warnCount >= 3) {
            try {
                await conn.groupParticipantsUpdate(from, [sender], 'remove');
                await conn.sendMessage(from, {
                    text: `🚷 𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅 ⚠️ @${sender.split('@')[0]} — 3 𝒘𝒂𝒓𝒏𝒊𝒏𝒈𝒔 𝒇𝒐𝒓 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔.`,
                    mentions: [sender]
                });
                resetWarnCount(from, sender);
                console.log(`[AntiGCStatus] 👢 Kicked ${sender} after 3 warnings`);
            } catch (e) {
                console.log('[AntiGCStatus] Kick error:', e.message);
            }
            return;
        }

        // Send warning
        await conn.sendMessage(from, {
            text: `🔗 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝑫𝒆𝒕𝒆𝒄𝒕𝒆𝒅 ⚠️ @${sender.split('@')[0]} — 𝑾𝒂𝒓𝒏𝒊𝒏𝒈 ${warnCount}/3`,
            mentions: [sender]
        });
    }
});

console.log('📸 MAZARI-MD - AntiGCStatus Plugin Loaded!');
