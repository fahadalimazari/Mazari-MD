const { cmd } = require('../arslan');
const pgDB = require('../lib/database-pg');
const { getOwneradmin, setOwneradmin } = pgDB;
const config = require('../config');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

// 📌 OWNERADMIN COMMAND
cmd({
    pattern: "owneradmin",
    alias: ["ownerauto", "oauto"],
    desc: "Auto-promote Bot Owner when demoted",
    category: "admin",
    react: "🔐",
    use: ".owneradmin on/off/status"
},
async (conn, mek, m, { from, args, isGroup, sender, isOwner, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ *Groups Only*\n𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔 𝒐𝒏𝒍𝒚.");
        if (!isOwner) return reply("⚠️ *Access Denied*\n𝑶𝒘𝒏𝒆𝒓 𝒐𝒓 𝑺𝒖𝒅𝒐 𝒐𝒏𝒍𝒚.");

        const action = args[0] ? args[0].toLowerCase() : "";

        if (action === "on" || action === "enable") {
            await setOwneradmin(from, true);
            return reply(`🔐 *𝑶𝒘𝒏𝒆𝒓𝑨𝒅𝒎𝒊𝒏 𝑬𝒏𝒂𝒃𝒍𝒆𝒅*\n𝑩𝒐𝒕 𝑶𝒘𝒏𝒆𝒓 𝒘𝒊𝒍𝒍 𝒃𝒆 𝒂𝒖𝒕𝒐-𝒑𝒓𝒐𝒎𝒐𝒕𝒆𝒅 𝒊𝒇 𝒅𝒆𝒎𝒐𝒕𝒆𝒅.`);
        }

        if (action === "off" || action === "disable") {
            await setOwneradmin(from, false);
            return reply(`🔓 *𝑶𝒘𝒏𝒆𝒓𝑨𝒅𝒎𝒊𝒏 𝑫𝒊𝒔𝒂𝒃𝒍𝒆𝒅*\n𝑶𝒘𝒏𝒆𝒓 𝒑𝒓𝒐𝒕𝒆𝒄𝒕𝒊𝒐𝒏 𝒊𝒔 𝒏𝒐𝒘 𝒐𝒇𝒇.`);
        }

        if (action === "status") {
            const status = await getOwneradmin(from);
            return reply(`ℹ️ *𝑶𝒘𝒏𝒆𝒓𝑨𝒅𝒎𝒊𝒏 𝑺𝒕𝒂𝒕𝒖𝒔*: ${status ? "🟢 𝑶𝑵" : "🔴 𝑶𝑭𝑭"}`);
        }

        return reply("⚠️ *Invalid Usage*\n*Use: .owneradmin on / off / status*");
    } catch (e) {
        console.error("OwnerAdmin command error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// 📌 OWNERADMIN EVENT HANDLER
cmd({
    on: "group-participants.update"
}, async (conn, mek, m, { from, action, participants, sender, isGroup, reply }) => {
    try {
        if (!isGroup) return;
        if (action !== "demote") return;

        // 1. Check if OwnerAutoAdmin is enabled for this group
        const isOwnerAdminEnabled = await getOwneradmin(from);
        if (!isOwnerAdminEnabled) return;

        const targetJid = participants[0];
        
        // 2. Identify if the target is the Bot Owner
        const targetNumber = targetJid.split('@')[0].split(':')[0];
        const owners = config.OWNER_NUMBER ? (Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : config.OWNER_NUMBER.split(',')) : [];
        const isTargetOwner = owners.includes(targetNumber);
        
        if (!isTargetOwner) return; // Only protect the actual owner

        // 3. Avoid loops: Do nothing if the bot itself performed the demotion
        const botJid = jidNormalizedUser(conn.user.id);
        const botLid = conn.user.lid ? jidNormalizedUser(conn.user.lid) : null;
        
        const senderJid = sender ? jidNormalizedUser(sender) : null;
        if (senderJid === botJid || (botLid && senderJid === botLid)) return;

        // 4. Check if bot is admin
        const groupMetadata = await conn.groupMetadata(from);
        
        const botParticipant = groupMetadata.participants.find(p => {
            const pId = jidNormalizedUser(p.id);
            return pId === botJid || (botLid && pId === botLid);
        });

        const isBotAdmin = botParticipant && (botParticipant.admin === "admin" || botParticipant.admin === "superadmin");
        
        console.log(`[OWNERADMIN DEBUG] botJid: ${botJid}`);
        console.log(`[OWNERADMIN DEBUG] botLid: ${botLid}`);
        console.log(`[OWNERADMIN DEBUG] bot participant found: ${!!botParticipant}`);
        console.log(`[OWNERADMIN DEBUG] bot participant role: ${botParticipant ? botParticipant.admin : 'null'}`);
        console.log(`[OWNERADMIN DEBUG] isBotAdmin: ${isBotAdmin}`);

        if (!isBotAdmin) {
            return reply(`⚠️ *Admin Required*\n𝑴𝒂𝒌𝒆 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏 𝒇𝒊𝒓𝒔𝒕.`);
        }

        // 5. Restore Owner
        await conn.groupParticipantsUpdate(from, [targetJid], "promote");

        const msg = `🔐 *𝑶𝒘𝒏𝒆𝒓 𝑷𝒓𝒐𝒕𝒆𝒄𝒕𝒊𝒐𝒏*\n\n⚠️ @${sender.split('@')[0]} 𝒅𝒆𝒎𝒐𝒕𝒆𝒅 @${targetJid.split('@')[0]}.\n🔄 @${targetJid.split('@')[0]} 𝒘𝒂𝒔 𝒓𝒆𝒔𝒕𝒐𝒓𝒆𝒅 𝒂𝒔 𝒂𝒅𝒎𝒊𝒏.`;
        
        await conn.sendMessage(from, { text: msg, mentions: [sender, targetJid] });

    } catch (e) {
        console.error("OwnerAdmin event error:", e);
    }
});
