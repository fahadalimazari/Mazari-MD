const { cmd } = require('../arslan');
const { updateUserConfigInPostgres, getUserConfigFromPostgres } = require('./database-pg');

// In-memory warning counters (5 minute reset)
const warningCounters = new Map();

// Mode display mapping
const MODE_DISPLAY = {
    warn: 'WARN',
    del: 'DELETE',
    kick: 'DIRECT KICK',
    off: 'OFF'
};

cmd({
    pattern: "antigcstatus",
    alias: ["agcs", "antigcs", "gcstatus"],
    desc: "Enable/disable Anti-GC Status protection",
    category: "admin",
    react: "🛡️",
    filename: __filename
}, async (conn, mek, m, {
    args,
    from,
    isGroup,
    isBotAdmins,
    isAdmins,
    isOwner,
    isSudo,
    reply
}) => {
    try {
        // Only work in groups
        if (!isGroup) return;

        // Permission check: Admin, Bot Admin, Owner, or Sudo
        if (!isAdmins && !isBotAdmins && !isOwner && !isSudo) return;

        // Get the mode from arguments
        const mode = (args[0] || '').toLowerCase().trim();

        // Get current mode from config
        const botNumber = conn.user.id.split(':')[0].split('@')[0];
        const userConfig = await getUserConfigFromPostgres(botNumber) || {};
        const currentMode = userConfig.ANTI_GC_STATUS || 'off';

        if (!mode || !['warn', 'del', 'kick', 'off'].includes(mode)) {
            // Show current mode and usage
            return await reply(`*🛡️ Anti-GC Status*\n\nCurrent mode: ${MODE_DISPLAY[currentMode]}\n\nUsage:\n.antigcstatus warn - Enable WARN mode (3 warnings → kick)\n.antigcstatus del - Enable DELETE mode (delete only)\n.antigcstatus kick - Enable DIRECT KICK mode (kick immediately)\n.antigcstatus off - Disable Anti-GC Status`);
        }

        // Update mode
        await updateUserConfigInPostgres(botNumber, { ANTI_GC_STATUS: mode });
        const modeDisplay = MODE_DISPLAY[mode];

        if (mode === 'warn') {
            await reply(`🛡️ Anti-GC Status > WARN mode is now ON. 3 warnings will lead to a kick.`);
        } else if (mode === 'del') {
            await reply(`🗑️ Anti-GC Status > DELETE mode is now ON. Group statuses will be deleted.`);
        } else if (mode === 'kick') {
            await reply(`👢 Anti-GC Status > DIRECT KICK mode is now ON.`);
        } else if (mode === 'off') {
            await reply(`🛡️ Anti-GC Status > Anti-GC Status is now OFF.`);
        }

    } catch (error) {
        console.error('[ANTI-GC-STATUS] Command error:', error.message);
    }
});

// Anti-GC Status handler (runs on status messages)
async function handleAntiGCStatus(conn, mek) {
    try {
        // Check if this is a status broadcast
        const from = mek.key.remoteJid;
        if (from !== "status@broadcast") return;

        // Get bot number
        const botNumber = conn.user.id.split(':')[0].split('@')[0];
        const userConfig = await getUserConfigFromPostgres(botNumber) || {};
        const mode = userConfig.ANTI_GC_STATUS || 'off';

        // If Anti-GC Status is off, do nothing
        if (mode === 'off') return;

        // Get sender info
        const sender = mek.key.participant;
        const senderNumber = sender ? sender.split('@')[0] : null;
        if (!senderNumber) return;

        // Get group metadata (since status@broadcast comes from a group status)
        // We need to find which group this status belongs to
        const botJid = conn.user.id;
        const groupMetadata = await conn.groupFetchAllParticipating();
        
        // Find groups where this user posted status
        let targetGroup = null;
        for (const [jid, metadata] of Object.entries(groupMetadata)) {
            const participants = metadata.participants || [];
            const hasParticipant = participants.some(p => 
                p.id === sender || 
                p.id === `${senderNumber}@s.whatsapp.net` ||
                (p.id.split('@')[0] === senderNumber)
            );
            if (hasParticipant) {
                targetGroup = { jid, metadata };
                break;
            }
        }

        // If we couldn't find the group, skip
        if (!targetGroup) return;

        const groupId = targetGroup.jid;
        const groupParticipants = targetGroup.metadata.participants || [];

        // Get sender's admin status
        const senderParticipant = groupParticipants.find(p => 
            p.id === sender || 
            (p.id.split('@')[0] === senderNumber)
        );
        const isSenderAdmin = senderParticipant ? (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin') : false;
        const isSenderOwner = isSenderAdmin; // In groups, owner is also admin
        const isSenderSudo = false; // Check Sudo if needed

        // Protection: Don't target Owner, Sudo, Bot, or Group Admin
        if (isSenderAdmin || isSenderOwner || isSenderSudo) return;

        // Check if bot is admin
        const botAdmin = groupParticipants.some(p => 
            p.admin === 'admin' || p.admin === 'superadmin'
        );
        if (!botAdmin) {
            console.log('[ANTI-GC-STATUS] Bot is not admin, skipping action');
            return;
        }

        // Get warning count (with 5 minute reset)
        const now = Date.now();
        const userCounter = warningCounters.get(senderNumber);
        
        if (userCounter && (now - userCounter.timestamp) > 5 * 60 * 1000) {
            // 5 minutes passed, reset counter
            warningCounters.delete(senderNumber);
        }

        const count = (warningCounters.get(senderNumber) || { count: 0 }).count;

        // Mode-specific actions
        if (mode === 'warn') {
            // Delete status
            await conn.sendMessage(from, {
                delete: mek.key
            });

            // Update counter
            const newCount = count + 1;
            warningCounters.set(senderNumber, { count: newCount, timestamp: now });

            // Send warning
            if (newCount === 1) {
                await conn.sendMessage(groupId, {
                    text: `⚠️ Anti-GC Warning > Group status is not allowed. Warning 1/3.`,
                    mentions: [sender]
                });
            } else if (newCount === 2) {
                await conn.sendMessage(groupId, {
                    text: `⚠️ Anti-GC Warning > Group status is not allowed. Warning 2/3.`,
                    mentions: [sender]
                });
            } else if (newCount >= 3) {
                await conn.sendMessage(groupId, {
                    text: `⚠️ Anti-GC Warning > Warning 3/3. Please remove group statuses.`,
                    mentions: [sender]
                });
                // Kick user
                await conn.groupParticipantsUpdate(groupId, [sender], 'remove');
                warningCounters.delete(senderNumber);
            }
        } else if (mode === 'del') {
            // Delete status only, no warning
            await conn.sendMessage(from, {
                delete: mek.key
            });
        } else if (mode === 'kick') {
            // Direct kick
            await conn.groupParticipantsUpdate(groupId, [sender], 'remove');
            // Also delete status
            await conn.sendMessage(from, {
                delete: mek.key
            });
        }

    } catch (error) {
        console.error('[ANTI-GC-STATUS] Handler error:', error.message);
    }
}

module.exports = {
    handleAntiGCStatus
};
