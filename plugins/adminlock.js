const config = require('../config');
const { cmd, commands } = require('../arslan');
const pgDB = require('../lib/database-pg');
const { getAdminlock, setAdminlock } = pgDB;
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

// Helper to check if a user is an owner/sudo
function isOwner(jid) {
    if (!jid) return false;
    const num = jid.split('@')[0];
    const owners = config.OWNER_NUMBER ? (Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : config.OWNER_NUMBER.split(',')) : [];
    return owners.includes(num);
}

// 📌 ADMINLOCK COMMAND
cmd({
    pattern: "adminlock",
    alias: ["lockadmin", "alock"],
    desc: "Enable/Disable AdminLock for this group",
    category: "admin",
    react: "🔒",
    use: ".adminlock on/off/status"
},
async (conn, mek, m, { from, args, isGroup, isAdmins, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command is only for groups.");
        if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

        const action = args[0] ? args[0].toLowerCase() : "";

        if (action === "on" || action === "enable") {
            await setAdminlock(from, true);
            return reply(`🔒 *𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌 𝑬𝒏𝒂𝒃𝒍𝒆𝒅*\n𝑻𝒉𝒊𝒔 𝒈𝒓𝒐𝒖𝒑 𝒊𝒔 𝒏𝒐𝒘 𝒍𝒐𝒄𝒌𝒆𝒅.`);
        }

        if (action === "off" || action === "disable") {
            await setAdminlock(from, false);
            return reply(`🔓 *𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌 𝑫𝒊𝒔𝒂𝒃𝒍𝒆𝒅*\n𝑨𝒅𝒎𝒊𝒏 𝒑𝒓𝒐𝒎𝒐𝒕𝒆/𝒅𝒆𝒎𝒐𝒕𝒆 𝒍𝒐𝒄𝒌 𝒊𝒔 𝒐𝒇𝒇.`);
        }

        if (action === "status") {
            const status = await getAdminlock(from);
            if (status) {
                return reply(`🔒 *𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌: 𝑶𝑵*\n𝑵𝒐𝒓𝒎𝒂𝒍 𝒂𝒅𝒎𝒊𝒏 𝒂𝒄𝒕𝒊𝒐𝒏𝒔 𝒂𝒓𝒆 𝒍𝒐𝒄𝒌𝒆𝒅.`);
            } else {
                return reply(`🔓 *𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌: 𝑶𝑭𝑭*\n𝑨𝒅𝒎𝒊𝒏 𝒂𝒄𝒕𝒊𝒐𝒏𝒔 𝒂𝒓𝒆 𝒖𝒏𝒍𝒐𝒄𝒌𝒆𝒅.`);
            }
        }

        reply(`*⚠️ Invalid argument.*\n⚡ *𝑼𝒔𝒆:* .adminlock on / off / status`);
    } catch (e) {
        console.error("Error in adminlock command:", e);
        reply("❌ Error processing adminlock command.");
    }
});

// 📌 ADMINLOCK EVENT HANDLER
cmd({
    on: "group-participants.update"
}, async (conn, mek, m, { from, action, participants, sender, isGroup, reply }) => {
    try {
        if (!isGroup) return;
        if (action !== "promote" && action !== "demote") return;

        // 1. Check if AdminLock is enabled
        const isEnabled = await getAdminlock(from);
        if (!isEnabled) return;

        // 2. Resolve actor
        if (!sender) return; // If we don't know who did it, we can't punish them safely.

        // 3. Loop prevention: Ignore if the bot itself performed the action
        const botJid = jidNormalizedUser(conn.user.id);
        const botLid = conn.user.lid ? jidNormalizedUser(conn.user.lid) : null;
        const senderJid = sender ? jidNormalizedUser(sender) : null;
        if (senderJid === botJid || (botLid && senderJid === botLid)) return;

        // 4. Exemption check: Ignore if the actor is Owner / Sudo
        if (isOwner(sender)) return;

        const targetJid = participants[0];

        // 5. Verify the bot is an admin so it can actually perform the punishment
        const groupMetadata = await conn.groupMetadata(from);
        
        const botParticipant = groupMetadata.participants.find(p => {
            const pId = jidNormalizedUser(p.id);
            return pId === botJid || (botLid && pId === botLid);
        });
        
        console.log(`[ADMINLOCK DEBUG] bot phone JID: ${botJid}`);
        console.log(`[ADMINLOCK DEBUG] resolved bot LID: ${botLid || 'NOT_FOUND'}`);
        if (botParticipant) {
            console.log(`[ADMINLOCK DEBUG] matched bot participant: ${botParticipant.id}`);
            console.log(`[ADMINLOCK DEBUG] bot participant role: ${botParticipant.admin}`);
        }

        const isBotAdmin = botParticipant && (botParticipant.admin === "admin" || botParticipant.admin === "superadmin");

        if (!isBotAdmin) {
            return reply(`⚠️ *𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅*\n𝑴𝒂𝒌𝒆 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏 𝒇𝒊𝒓𝒔𝒕 𝒕𝒐 𝒆𝒏𝒇𝒐𝒓𝒄𝒆 𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌.`);
        }

        if (action === "demote") {
            // Normal admin demoted someone
            await conn.groupParticipantsUpdate(from, [sender], "demote");
            await conn.groupParticipantsUpdate(from, [targetJid], "promote");

            const msg = `🔒 *𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌*\n\n⚠️ @${sender.split('@')[0]} 𝒅𝒆𝒎𝒐𝒕𝒆𝒅 @${targetJid.split('@')[0]}.\n🔄 @${sender.split('@')[0]} 𝒘𝒂𝒔 𝒅𝒆𝒎𝒐𝒕𝒆𝒅 & @${targetJid.split('@')[0]} 𝒘𝒂𝒔 𝒓𝒆𝒔𝒕𝒐𝒓𝒆𝒅 𝒂𝒔 𝒂𝒅𝒎𝒊𝒏.`;
            
            await conn.sendMessage(from, { text: msg, mentions: [sender, targetJid] });
        } 
        else if (action === "promote") {
            // Normal admin promoted someone
            await conn.groupParticipantsUpdate(from, [sender], "demote");
            await conn.groupParticipantsUpdate(from, [targetJid], "demote");

            const msg = `🔒 *𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌*\n\n⚠️ @${sender.split('@')[0]} 𝒑𝒓𝒐𝒎𝒐𝒕𝒆𝒅 @${targetJid.split('@')[0]}.\n🔒 𝑩𝒐𝒕𝒉 𝒘𝒆𝒓𝒆 𝒅𝒆𝒎𝒐𝒕𝒆𝒅 𝒃𝒚 𝑨𝒅𝒎𝒊𝒏𝑳𝒐𝒄𝒌.`;
            
            await conn.sendMessage(from, { text: msg, mentions: [sender, targetJid] });
        }
    } catch (e) {
        console.error('[AdminLock] Handler error:', e);
    }
});

console.log('🔒 MAZARI-MD - AdminLock Plugin Loaded!');
