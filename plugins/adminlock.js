// ============================================
// 🔒 ADMINLOCK - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 🔒 Lock group admin changes
// ============================================

const { cmd } = require('../arslan');
const config = require('../config');
const pgDB = require('../lib/database-pg');
const { getAdminlock, setAdminlock } = pgDB;

// ─── TEMPORARY DATA WITH 5-MINUTE EXPIRY ───
// Format: GLOBAL_ADMINLOCK_WARNING[groupId][userId] = { count, timestamp }
if (!global.GLOBAL_ADMINLOCK_WARNING) global.GLOBAL_ADMINLOCK_WARNING = {};
if (!global.GLOBAL_ADMINLOCK_WARNING_TIMER) global.GLOBAL_ADMINLOCK_WARNING_TIMER = {};

const FIVE_MINUTES = 5 * 60 * 1000;

// ─── CHECK IF SUDO (currently same as owner) ───
async function isOwnerOrSudo(userId, conn, groupId) {
    try {
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
    if (!jid) return '';
    let str = typeof jid === 'string' ? jid : (jid.id || jid.toString() || '');
    if (str.includes(':')) str = str.split(':')[0] + '@' + str.split('@')[1];
    if (!str.includes('@')) str += '@s.whatsapp.net';
    return str;
}

// ─── START 5-MINUTE EXPIRY TIMER ───
function startWarningTimer(groupId, userId) {
    const timerKey = `${groupId}_${userId}`;
    
    // Clear existing timer if any
    if (global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey]) {
        clearTimeout(global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey]);
        delete global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey];
    }
    
    // Start new timer
    global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey] = setTimeout(() => {
        // Delete warning count and timer entry
        if (global.GLOBAL_ADMINLOCK_WARNING[groupId] && global.GLOBAL_ADMINLOCK_WARNING[groupId][userId]) {
            delete global.GLOBAL_ADMINLOCK_WARNING[groupId][userId];
        }
        delete global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey];
        console.log(`[AdminLock] Warning timer expired for ${userId} in ${groupId}`);
    }, FIVE_MINUTES);
}

// ─── CLEAR TIMER ───
function clearWarningTimer(groupId, userId) {
    const timerKey = `${groupId}_${userId}`;
    if (global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey]) {
        clearTimeout(global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey]);
        delete global.GLOBAL_ADMINLOCK_WARNING_TIMER[timerKey];
    }
}

// ============================================
// 📌 ADMINLOCK COMMAND
// ============================================
cmd({
    pattern: "adminlock",
    alias: ["lockadmin", "adminlock"],
    desc: "🔒 Lock group admin changes",
    category: "admin",
    react: "🔒",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply, args, isGroup }) => {

    if (!isGroup) {
        return reply("❌ 𝑮𝒓𝒐𝒖𝒑 𝑶𝒏𝒍𝒚 — 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒐𝒏𝒍𝒚 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔.");
    }

    // ─── OWNER ONLY CHECK ───
    const isSenderOwner = await isOwnerOrSudo(m.sender, conn, from);
    if (!isOwner && !isSenderOwner && !mek.key.fromMe) {
        return reply(`🔒 𝑶𝒘𝒏𝒆𝒓 𝑶𝒏𝒍𝒚 — 𝑶𝒏𝒍𝒚 𝒕𝒉𝒆 𝒐𝒘𝒏𝒆𝒓 𝒐𝒓 𝒔𝒖𝒅𝒐 𝒄𝒂𝒏 𝒖𝒔𝒆 𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌.`);
    }

    const action = args[0]?.toLowerCase();

    // ─── ON ───
    if (action === 'on') {
        await setAdminlock(from, true);
        return reply(`🛡️ 𝑨��𝒊��𝑳��𝒌 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅\n🔒 𝑮𝒓𝒐𝒖𝒑 𝒂𝒅𝒎𝒊𝒏 𝒄𝒉𝒂𝒏𝒈𝒆𝒔 𝒂𝒓𝒆 𝒏𝒐𝒘 𝒍𝒐𝒄𝒌𝒆𝒅.`);
    }

    // ─── OFF ───
    if (action === 'off') {
        await setAdminlock(from, false);
        return reply(`🔓 𝑨��𝒊𝒏𝑳��𝒌 𝑫𝒆𝒂𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅\n✅ 𝑮𝒓𝒐𝒖𝒑 𝒂𝒅𝒎𝒊𝒏 𝒄𝒉𝒂𝒏𝒈𝒆𝒔 𝒂𝒓𝒆 𝒏𝒐𝒘 𝒂𝒍𝒍𝒐𝒘𝒆𝒅.`);
    }

    // ─── STATUS ───
    const status = await getAdminlock(from);
    const statusText = status ? '𝑨𝑪𝑻𝑰𝑽𝑬' : '𝑰𝑵𝑨𝑪𝑻𝑰𝑽𝑬';
    
    return reply(`🛡️ 𝑨��𝒊𝒏𝑳��𝒌
📡 𝑺𝒕𝒂𝒕𝒖𝒔: ${statusText}
⚡ 𝑼𝒔𝒆: .adminlock on / .adminlock off`);
});

// ============================================
// 📌 ADMINLOCK PROMOTION HANDLER
// ============================================
cmd({
    pattern: "adminlock_promotion",
    on: "groupParticipantsUpdate",
    filename: __filename
}, async (conn, mek, m, { from, participants, sender }) => {
    
    // participants is an array, we need to find who was promoted
    const promotees = participants.filter(p => p.status === 'admin');
    
    if (promotees.length === 0) return;
    
    try {
        const isEnabled = await getAdminlock(from);
        if (!isEnabled) return;
        
        const authorJid = normalizeJid(sender);
        
        // Skip if bot performed the action
        const botJid = normalizeJid(conn.user.id);
        if (authorJid === botJid) return;
        
        // Owner/Sudo Bypass
        const isOwnerSudo = await isOwnerOrSudo(authorJid, conn, from);
        if (isOwnerSudo) return;
        
        // Get group metadata
        const meta = await conn.groupMetadata(from);
        const groupOwner = normalizeJid(meta.owner || meta.subjectOwner);
        
        // Group owner bypass
        if (authorJid === groupOwner) return;
        
        // Check bot admin status
        const botParticipant = meta.participants.find(p => normalizeJid(p.id) === botJid);
        const botIsAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        if (!botIsAdmin) return;
        
        // Get demote list (author + promotees)
        const demoteList = [authorJid, ...promotees.map(p => normalizeJid(p))];
        
        // Demote them
        for (const jid of demoteList) {
            try {
                await conn.groupParticipantsUpdate(from, [jid], 'demote');
            } catch (e) {
                console.error(`[AdminLock] Failed to demote ${jid}:`, e.message);
            }
        }
        
        // Send warning message with mentions
        const authorShort = authorJid.split('@')[0];
        const promoteeShorts = promotees.map(p => `@${normalizeJid(p).split('@')[0]}`).join(', ');
        
        const ui = `🚫 𝑨𝒅𝒎𝒊𝒏 𝑪𝒉𝒂𝒏𝒈𝒆 𝑩𝒍𝒐𝒄𝒌𝒆𝒅
👤 𝑪𝒉𝒂𝒏𝒈𝒆𝒅 𝒃𝒚: @${authorShort}
👑 𝑷𝒓𝒐𝒎𝒐𝒕𝒆𝒅: ${promoteeShorts}
🛡️ 𝑼𝒏𝒂𝒖𝒕𝒉𝒐𝒓𝒊𝒛𝒆𝒅 𝒂𝒅𝒎𝒊𝒏 𝒄𝒉𝒂𝒏𝒈𝒆 𝒘𝒂𝒔 𝒓𝒆𝒗𝒆𝒓𝒕𝒆𝒅.`;
        
        const mentions = [authorJid, ...promotees.map(p => normalizeJid(p))];
        
        await conn.sendMessage(from, {
            text: ui,
            mentions: mentions
        });
        
    } catch (error) {
        console.error('[AdminLock] Promotion handler error:', error);
    }
});

// ============================================
// 📌 ADMINLOCK DEMOTION HANDLER
// ============================================
cmd({
    pattern: "adminlock_demotion",
    on: "groupParticipantsUpdate",
    filename: __filename
}, async (conn, mek, m, { from, participants, sender }) => {
    
    // participants is an array, we need to find who was demoted
    const demotees = participants.filter(p => p.status === 'notadmin');
    
    if (demotees.length === 0) return;
    
    try {
        const isEnabled = await getAdminlock(from);
        if (!isEnabled) return;
        
        const authorJid = normalizeJid(sender);
        
        // Skip if bot performed the action
        const botJid = normalizeJid(conn.user.id);
        if (authorJid === botJid) return;
        
        // Owner/Sudo Bypass
        const isOwnerSudo = await isOwnerOrSudo(authorJid, conn, from);
        if (isOwnerSudo) return;
        
        // Get group metadata
        const meta = await conn.groupMetadata(from);
        const groupOwner = normalizeJid(meta.owner || meta.subjectOwner);
        
        // Group owner bypass
        if (authorJid === groupOwner) return;
        
        // Check bot admin status
        const botParticipant = meta.participants.find(p => normalizeJid(p.id) === botJid);
        const botIsAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        if (!botIsAdmin) return;
        
        // Promote the demotees back
        const promoteList = demotees.map(p => normalizeJid(p));
        
        for (const jid of promoteList) {
            try {
                await conn.groupParticipantsUpdate(from, [jid], 'promote');
            } catch (e) {
                console.error(`[AdminLock] Failed to promote ${jid}:`, e.message);
            }
        }
        
        // Demote the author
        try {
            await conn.groupParticipantsUpdate(from, [authorJid], 'demote');
        } catch (e) {
            console.error(`[AdminLock] Failed to demote author ${authorJid}:`, e.message);
        }
        
        // Send warning message with mentions
        const authorShort = authorJid.split('@')[0];
        const demoteeShorts = demotees.map(p => `@${normalizeJid(p).split('@')[0]}`).join(', ');
        
        const ui = `🚫 𝑨𝒅𝒎𝒊𝒏 𝑪𝒉𝒂𝒏𝒈𝒆 𝑩𝒍𝒐𝒄𝒌𝒆𝒅
👤 𝑪𝒉𝒂𝒏𝒈𝒆𝒅 𝒃𝒚: @${authorShort}
🔻 𝑹𝒆𝒎𝒐𝒗𝒆𝒅: ${demoteeShorts}
🔒 𝑼𝒏𝒂𝒖𝒕𝒉𝒐𝒓𝒊𝒛𝒆𝒅 𝒂𝒅𝒎𝒊𝒏 𝒄𝒉𝒂𝒏𝒈𝒆 𝒘𝒂𝒔 𝒓𝒆𝒗𝒆𝒓𝒕𝒆𝒅.`;
        
        const mentions = [authorJid, ...demotees.map(p => normalizeJid(p))];
        
        await conn.sendMessage(from, {
            text: ui,
            mentions: mentions
        });
        
    } catch (error) {
        console.error('[AdminLock] Demotion handler error:', error);
    }
});

console.log('🔒 MAZARI-MD - AdminLock Plugin Loaded!');
