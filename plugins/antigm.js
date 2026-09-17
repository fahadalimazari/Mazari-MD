// ============================================
// 📸 ANTI-GC STATUS - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 🔒 Block Group Status messages in groups
// ============================================

const { cmd } = require('../arslan');
const config = require('../config');

// ─── TEMPORARY WARNING DATA (10-MINUTE EXPIRY) ───
// Format: GLOBAL_ANTIGC_WARN[sessionId][groupId][userId] = count
// Format: GLOBAL_ANTIGC_WARN_TIMER[sessionId][groupId][userId] = timerId
if (!global.GLOBAL_ANTIGC_WARN) global.GLOBAL_ANTIGC_WARN = {};
if (!global.GLOBAL_ANTIGC_WARN_TIMER) global.GLOBAL_ANTIGC_WARN_TIMER = {};
if (!global.ANTIGC_STATUS) global.ANTIGC_STATUS = {}; // Session isolated later if needed

const TEN_MINUTES = 10 * 60 * 1000;

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

// ─── START 10-MINUTE EXPIRY TIMER ───
function startWarningTimer(sessionId, groupId, userId) {
    const timerKey = `${sessionId}_${groupId}_${userId}`;
    
    // Clear existing timer if any
    if (global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]) {
        clearTimeout(global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]);
        delete global.GLOBAL_ANTIGC_WARN_TIMER[timerKey];
    }
    
    // Start new timer
    global.GLOBAL_ANTIGC_WARN_TIMER[timerKey] = setTimeout(() => {
        // Delete warning count and timer entry
        if (global.GLOBAL_ANTIGC_WARN[sessionId]?.[groupId]?.[userId]) {
            delete global.GLOBAL_ANTIGC_WARN[sessionId][groupId][userId];
        }
        delete global.GLOBAL_ANTIGC_WARN_TIMER[timerKey];
        console.log(`[AntiGCStatus] Warning timer expired for ${userId} in ${groupId} on session ${sessionId}`);
    }, TEN_MINUTES);
}

// ─── GET WARN COUNT ───
function getWarnCount(sessionId, groupId, userId) {
    return global.GLOBAL_ANTIGC_WARN?.[sessionId]?.[groupId]?.[userId] || 0;
}

// ─── INCREMENT WARN COUNT ───
function incrementWarnCount(sessionId, groupId, userId) {
    if (!global.GLOBAL_ANTIGC_WARN[sessionId]) global.GLOBAL_ANTIGC_WARN[sessionId] = {};
    if (!global.GLOBAL_ANTIGC_WARN[sessionId][groupId]) global.GLOBAL_ANTIGC_WARN[sessionId][groupId] = {};
    
    global.GLOBAL_ANTIGC_WARN[sessionId][groupId][userId] = (global.GLOBAL_ANTIGC_WARN[sessionId][groupId][userId] || 0) + 1;
    return global.GLOBAL_ANTIGC_WARN[sessionId][groupId][userId];
}

// ─── RESET WARN COUNT ───
function resetWarnCount(sessionId, groupId, userId) {
    if (global.GLOBAL_ANTIGC_WARN[sessionId]?.[groupId]) {
        delete global.GLOBAL_ANTIGC_WARN[sessionId][groupId][userId];
    }
    const timerKey = `${sessionId}_${groupId}_${userId}`;
    if (global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]) {
        clearTimeout(global.GLOBAL_ANTIGC_WARN_TIMER[timerKey]);
        delete global.GLOBAL_ANTIGC_WARN_TIMER[timerKey];
    }
}

// ============================================
// 📌 ANTI-GC STATUS COMMAND
// ============================================
cmd({
    pattern: "antigm",
    desc: "📸 Block Group Status messages in groups",
    category: "admin",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args }) => {

    // ─── GET SESSION ID ───
    const sessionId = conn.user.id.split(':')[0];
    if (!global.ANTIGC_STATUS[sessionId]) global.ANTIGC_STATUS[sessionId] = {};

    // ─── CHECK GROUP ───
    if (!isGroup) {
        return reply("⚠️ 𝑮𝒓𝒐𝒖𝒑 𝑶𝒏𝒍𝒚");
    }

    // ─── CHECK ADMIN PERMISSION ───
    if (!isAdmins && !isOwner && !mek.key.fromMe) {
        return reply("⚠️ 𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅");
    }

    if (!isBotAdmins) {
        return reply("⚠️ 𝑩𝒐𝒕 𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅");
    }

    // ─── GET ARGUMENT ───
    const action = args[0]?.toLowerCase() || '';

    // ─── SHOW STATUS ───
    if (!action || (action !== 'on' && action !== 'del' && action !== 'delete' && action !== 'warn' && action !== 'kick' && action !== 'off')) {
        const status = global.ANTIGC_STATUS[sessionId][from] || false;
        const actionMode = status ? status.toUpperCase() : '𝑶𝑭𝑭';
        
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 𝑺𝒕𝒂𝒕𝒖𝒔\n⚡ 𝑺𝒕𝒂𝒕𝒖𝒔: ${actionMode !== '𝑶𝑭𝑭' ? '𝑶𝑵' : '𝑶𝑭𝑭'}\n⚙️ 𝑴𝒐𝒅𝒆: ${actionMode}`);
    }

    // ─── ON MODE (Default to Warn) ───
    if (action === 'on') {
        global.ANTIGC_STATUS[sessionId][from] = 'warn';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n⚙️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑴𝒐𝒅𝒆 : 𝑾𝒂𝒓𝒏`);
    }

    // ─── DEL MODE ───
    if (action === 'del' || action === 'delete') {
        global.ANTIGC_STATUS[sessionId][from] = 'delete';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n⚙️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑴𝒐𝒅𝒆 : 𝑫𝒆𝒍𝒆𝒕𝒆`);
    }

    // ─── WARN MODE ───
    if (action === 'warn') {
        global.ANTIGC_STATUS[sessionId][from] = 'warn';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n⚙️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑴𝒐𝒅𝒆 : 𝑾𝒂𝒓𝒏`);
    }

    // ─── KICK MODE ───
    if (action === 'kick') {
        global.ANTIGC_STATUS[sessionId][from] = 'kick';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n⚙️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑴𝒐𝒅𝒆 : 𝑲𝒊𝒄𝒌`);
    }

    // ─── OFF MODE ───
    if (action === 'off') {
        global.ANTIGC_STATUS[sessionId][from] = false;
        return reply(`❌ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑫𝒊𝒔𝒂𝒃𝒍𝒆𝒅`);
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
    const sessionId = conn.user.id.split(':')[0];
    if (!global.ANTIGC_STATUS?.[sessionId]?.[from]) return;

    // ─── SKIP IF BOT NOT ADMIN ───
    if (!isBotAdmins) return;

    // ─── SKIP ADMINS & OWNER ───
    if (isAdmins || isOwner || mek.key.fromMe) return;

    // ─── DETECT GROUP STATUS & EXTRACT ACTUAL KEY ───
    const msg = mek.message;
    if (!msg) return;

    let isGroupStatus = false;
    let actualStatusKey = null;

    const messageText = m.text || m.body || '';
    const isGroupMentionText = messageText.includes('This group was mentioned') || messageText.includes('group was mentioned');

    // 1. Direct Group Status Message (if WhatsApp sends it as a specific protobuf)
    if (msg.groupStatusMessage || msg.groupStatusMessageV2 || msg.groupStatusMentionMessage) {
        isGroupStatus = true;
        // The actual status key is the message key itself
        actualStatusKey = { ...mek.key };
    } 
    // 2. Wrapper "This group was mentioned" (Extended text quoting the status)
    else {
        const contextInfo = msg.extendedTextMessage?.contextInfo || 
                            msg.imageMessage?.contextInfo || 
                            msg.videoMessage?.contextInfo || 
                            msg.audioMessage?.contextInfo;

        if (contextInfo) {
            // Check if it's flagged as a group status
            if (contextInfo.isGroupStatus || isGroupMentionText) {
                isGroupStatus = true;
                
                // If it's a wrapper referencing the actual status, the real key is in contextInfo
                if (contextInfo.stanzaId) {
                    actualStatusKey = {
                        remoteJid: contextInfo.remoteJid || 'status@broadcast',
                        id: contextInfo.stanzaId,
                        participant: contextInfo.participant || sender,
                        fromMe: false // Since we are deleting someone else's status
                    };
                } else {
                    // Fallback to the wrapper's key if no quoted reference exists
                    actualStatusKey = { ...mek.key };
                }
            }
        }
    }

    if (!isGroupStatus || !actualStatusKey) return;

    // Ensure participant is present for any group-related delete action
    if (!actualStatusKey.participant) {
        actualStatusKey.participant = sender;
    }


    // ─── ACTION EXECUTION ───
    const action = global.ANTIGC_STATUS[sessionId][from];

    // ─── DELETE MODE: Only delete ───
    if (action === 'delete' || action === 'del') {
        try {
            await conn.sendMessage(from, { delete: actualStatusKey });
            await conn.sendMessage(from, {
                text: `🗑️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑺𝒕𝒂𝒕𝒖𝒔 𝑫𝒆𝒍𝒆𝒕𝒆𝒅`
            }, { quoted: mek });
            console.log(`[AntiGCStatus] 🗑️ Deleted actual group status from ${sender}`);
        } catch (e) {
            console.log('[AntiGCStatus] Delete notify error:', e.message);
        }
    }

    // ─── KICK MODE: Instant kick ───
    else if (action === 'kick') {
        try {
            await conn.sendMessage(from, { delete: actualStatusKey });
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, {
                text: `👢 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅`
            }, { quoted: mek });
            console.log(`[AntiGCStatus] 👢 Kicked ${sender}`);
        } catch (e) {
            console.log('[AntiGCStatus] Kick error:', e.message);
        }
    }

    // ─── WARN MODE: Warning logic ───
    else if (action === 'warn') {
        // Increment warning count
        const warnCount = incrementWarnCount(sessionId, from, sender);
        
        // Start 10-minute timer (resets on repeated violations)
        startWarningTimer(sessionId, from, sender);

        // 3 warnings -> kick
        if (warnCount >= 3) {
            try {
                await conn.sendMessage(from, { delete: actualStatusKey });
                await conn.groupParticipantsUpdate(from, [sender], 'remove');
                await conn.sendMessage(from, {
                    text: `🚫 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝟑/𝟑 𝑾𝒂𝒓𝒏𝒊𝒏𝒈𝒔\n👢 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅`
                }, { quoted: mek });
                resetWarnCount(sessionId, from, sender);
                console.log(`[AntiGCStatus] 👢 Kicked ${sender} after 3 warnings`);
            } catch (e) {
                console.log('[AntiGCStatus] Kick error:', e.message);
            }
        } else {
            // Send warning
            try {
                await conn.sendMessage(from, { delete: actualStatusKey });
                await conn.sendMessage(from, {
                    text: `⚠️ 𝑨𝒏𝒕𝒊𝑮𝑴 — ${warnCount}/3 𝑾𝒂𝒓𝒏𝒊𝒏𝒈`
                }, { quoted: mek });
                console.log(`[AntiGCStatus] ⚠️ Warned ${sender} (${warnCount}/3)`);
            } catch (e) {
                console.log('[AntiGCStatus] Warn notify error:', e.message);
            }
        }
    }
});

console.log('📸 MAZARI-MD - AntiGCStatus Plugin Loaded!');
