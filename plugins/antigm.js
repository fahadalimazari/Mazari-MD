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

    // ─── SHOW SETTINGS MENU ───
    if (!action) {
        return reply(`🛡️ *𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑺𝒆𝒕𝒕𝒊𝒏𝒈𝒔*\n\n𝟭. 𝑾𝒂𝒓𝒏\n𝟮. 𝑫𝒆𝒍𝒆𝒕𝒆\n𝟯. 𝑲𝒊𝒄𝒌\n𝟰. 𝑶𝒇𝒇\n\n𝑹𝒆𝒑𝒍𝒚 𝒘𝒊𝒕𝒉 𝒕𝒉𝒆 𝒐𝒑𝒕𝒊𝒐𝒏 𝒚𝒐𝒖 𝒘𝒂𝒏𝒕.`);
    }

    // ─── STATUS MODE ───
    if (action === 'status') {
        const status = global.ANTIGC_STATUS[sessionId][from] || false;
        if (!status) return reply(`🛡️ *𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑺𝒕𝒂𝒕𝒖𝒔*\n\n𝑺𝒕𝒂𝒕𝒆 : 𝑫𝒊𝒔𝒂𝒃𝒍𝒆𝒅`);
        const modeMap = { 'warn': '𝑾𝒂𝒓𝒏', 'delete': '𝑫𝒆𝒍𝒆𝒕𝒆', 'del': '𝑫𝒆𝒍𝒆𝒕𝒆', 'kick': '𝑲𝒊𝒄𝒌' };
        return reply(`🛡️ *𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑺𝒕𝒂𝒕𝒖𝒔*\n\n𝑺𝒕𝒂𝒕𝒆 : 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n𝑴𝒐𝒅𝒆 : ${modeMap[status] || status}`);
    }

    // ─── ON / WARN MODE ───
    if (action === 'on' || action === 'warn' || action === '1') {
        global.ANTIGC_STATUS[sessionId][from] = 'warn';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n⚙️ 𝑴𝒐𝒅𝒆 : 𝑾𝒂𝒓𝒏\n🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝒑𝒓𝒐𝒕𝒆𝒄𝒕𝒊𝒐𝒏 𝒊𝒔 𝒂𝒄𝒕𝒊𝒗𝒆.`);
    }

    // ─── DEL MODE ───
    if (action === 'del' || action === 'delete' || action === '2') {
        global.ANTIGC_STATUS[sessionId][from] = 'delete';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n⚙️ 𝑴𝒐𝒅𝒆 : 𝑫𝒆𝒍𝒆𝒕𝒆\n🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝒑𝒓𝒐𝒕𝒆𝒄𝒕𝒊𝒐𝒏 𝒊𝒔 𝒂𝒄𝒕𝒊𝒗𝒆.`);
    }

    // ─── KICK MODE ───
    if (action === 'kick' || action === '3') {
        global.ANTIGC_STATUS[sessionId][from] = 'kick';
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑬𝒏𝒂𝒃𝒍𝒆𝒅\n⚙️ 𝑴𝒐𝒅𝒆 : 𝑲𝒊𝒄𝒌\n🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝒑𝒓𝒐𝒕𝒆𝒄𝒕𝒊𝒐𝒏 𝒊𝒔 𝒂𝒄𝒕𝒊𝒗𝒆.`);
    }

    // ─── OFF MODE ───
    if (action === 'off' || action === '4') {
        global.ANTIGC_STATUS[sessionId][from] = false;
        return reply(`🛡️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑫𝒊𝒔𝒂𝒃𝒍𝒆𝒅\n𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝒑𝒓𝒐𝒕𝒆𝒄𝒕𝒊𝒐𝒏 𝒊𝒔 𝒏𝒐𝒘 𝒐𝒇𝒇.`);
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

    // --- HEROKU CONSOLE DEBUGGER (MOVED UP) ---
    if (mek.message) {
        const msgKeys = Object.keys(mek.message).join(', ');
        console.log(`\n🚨 [AntiGCStatus DEBUG] Group message from ${sender}: ${msgKeys}\n`);
    }
    // ------------------------------------------

    // ─── SKIP IF ANTI-GC STATUS OFF ───
    const sessionId = conn.user.id.split(':')[0];
    if (!global.ANTIGC_STATUS?.[sessionId]?.[from]) return;

    // ─── SKIP IF BOT NOT ADMIN ───
    if (!isBotAdmins) return;

    // ─── SKIP ADMINS & OWNER ───
    if (isAdmins || isOwner || mek.key.fromMe) {
        console.log(`[AntiGCStatus] Skipped for admin/owner: ${sender}`);
        return; // Restored admin protection!
    }

    // ─── DETECT GROUP STATUS & EXTRACT ACTUAL KEY ───
    const msg = mek.message;
    if (!msg) return;

    let isGroupStatus = false;
    let actualStatusKey = null;

    const messageText = m.text || m.body || '';
    const isGroupMentionText = messageText.includes('This group was mentioned') || messageText.includes('group was mentioned');

    // 1. Direct Group Status Message or Mention Message
    if (msg.groupStatusMessage || msg.groupStatusMessageV2 || msg.groupStatusMentionMessage) {
        isGroupStatus = true;
        // The actual status resides at status@broadcast.
        // The ID of the status is either the same as the wrapper's ID, or it is embedded inside the contextInfo of the inner message.
        const innerMsg = msg.groupStatusMentionMessage?.message || msg.groupStatusMessage?.message || msg.groupStatusMessageV2?.message;
        const innerContext = innerMsg?.imageMessage?.contextInfo || innerMsg?.videoMessage?.contextInfo || innerMsg?.extendedTextMessage?.contextInfo;
        
        actualStatusKey = {
            remoteJid: 'status@broadcast',
            id: innerContext?.stanzaId || mek.key.id,
            participant: innerContext?.participant || mek.key.participant || sender,
            fromMe: false
        };
    } 
    // 2. Wrapper "This group was mentioned" (Extended text quoting the status)
    else {
        const contextInfo = msg.extendedTextMessage?.contextInfo || 
                            msg.imageMessage?.contextInfo || 
                            msg.videoMessage?.contextInfo || 
                            msg.audioMessage?.contextInfo;

        if (contextInfo) {
            // Check if it's flagged as a group status or contains the mention text
            if (contextInfo.isGroupStatus || isGroupMentionText || JSON.stringify(msg).includes('This group was mentioned')) {
                isGroupStatus = true;
                
                // If it quotes the actual status, the real key is in contextInfo
                if (contextInfo.stanzaId) {
                    actualStatusKey = {
                        remoteJid: 'status@broadcast',
                        id: contextInfo.stanzaId,
                        participant: contextInfo.participant || sender,
                        fromMe: false
                    };
                } else {
                    // Fallback to deriving from wrapper key
                    actualStatusKey = {
                        remoteJid: 'status@broadcast',
                        id: mek.key.id,
                        participant: sender,
                        fromMe: false
                    };
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

    // Helper to delete both wrapper and actual status
    const deleteGroupStatus = async () => {
        // 1. Delete the notification/wrapper message in the group chat
        try { await conn.sendMessage(from, { delete: mek.key }); } catch (e) {}
        
        // 2. Try to delete the actual status message directly
        if (actualStatusKey && actualStatusKey.id !== mek.key.id) {
            try { await conn.sendMessage('status@broadcast', { delete: actualStatusKey }); } catch (e) {}
            // Attempt admin revoke in group just in case WhatsApp expects it there
            try { await conn.sendMessage(from, { delete: actualStatusKey }); } catch (e) {}
        }
    };

    // ─── DELETE MODE: Only delete (SILENT) ───
    if (action === 'delete' || action === 'del') {
        try {
            await deleteGroupStatus();
            console.log(`[AntiGCStatus] 🗑️ Deleted actual group status from ${sender}`);
        } catch (e) {
            console.log('[AntiGCStatus] Delete error:', e.message);
        }
    }

    // ─── KICK MODE: Instant kick ───
    else if (action === 'kick') {
        try {
            await deleteGroupStatus();
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, {
                text: `👢 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅\n𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝒗𝒊𝒐𝒍𝒂𝒕𝒊𝒐𝒏.`
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
                await deleteGroupStatus();
                await conn.groupParticipantsUpdate(from, [sender], 'remove');
                await conn.sendMessage(from, {
                    text: `🚫 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝟯/𝟯 𝑾𝒂𝒓𝒏𝒊𝒏𝒈𝒔\n👢 𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅 — 𝑨𝒏𝒕𝒊𝑮𝑴 𝑽𝒊𝒐𝒍𝒂𝒕𝒊𝒐𝒏.`
                }, { quoted: mek });
                resetWarnCount(sessionId, from, sender);
                console.log(`[AntiGCStatus] 👢 Kicked ${sender} after 3 warnings`);
            } catch (e) {
                console.log('[AntiGCStatus] Kick error:', e.message);
            }
        } else {
            // Send warning
            try {
                await deleteGroupStatus();
                let warnText = `⚠️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝟭/𝟯 𝑾𝒂𝒓𝒏𝒊𝒏𝒈\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒅𝒐𝒏’𝒕 𝒎𝒆𝒏𝒕𝒊𝒐𝒏 𝒕𝒉𝒊𝒔 𝒈𝒓𝒐𝒖𝒑 𝒊𝒏 𝑺𝒕𝒂𝒕𝒖𝒔.`;
                if (warnCount === 2) {
                    warnText = `⚠️ 𝑨𝒏𝒕𝒊𝑮𝑴 — 𝟮/𝟯 𝑾𝒂𝒓𝒏𝒊𝒏𝒈\n𝑵𝒆𝒙𝒕 𝒗𝒊𝒐𝒍𝒂𝒕𝒊𝒐𝒏 𝒘𝒊𝒍𝒍 𝒓𝒆𝒎𝒐𝒗𝒆 𝒚𝒐𝒖.`;
                }
                await conn.sendMessage(from, {
                    text: warnText
                }, { quoted: mek });
                console.log(`[AntiGCStatus] ⚠️ Warned ${sender} (${warnCount}/3)`);
            } catch (e) {
                console.log('[AntiGCStatus] Warn notify error:', e.message);
            }
        }
    }
});

console.log('📸 MAZARI-MD - AntiGCStatus Plugin Loaded!');
