// ============================================
// 📢 GCS STATUS - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 📢 Broadcast status to all groups in the current session
// ============================================

const { cmd } = require('../arslan');
const { downloadContentFromMessage, generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const config = require('../config');

// ─── MAZARI MD CHANNEL CONFIGURATION ───
const GCS_STATUS_CHANNEL = {
    name: "MAZARI MD",
    link: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B",
    jid: "120363400318546224@newsletter"
};

let cachedGcsChannelJid = null;

// ─── RESOLVE CHANNEL JID ───
async function resolveChannelJid(sock) {
    try {
        if (cachedGcsChannelJid) return cachedGcsChannelJid;
        const code = GCS_STATUS_CHANNEL.link.split('whatsapp.com/channel/')[1].split('/')[0].split('?')[0];
        const metadata = await sock.newsletterMetadata("invite", code);
        if (metadata && metadata.id) {
            cachedGcsChannelJid = metadata.id;
            console.log(`[GCS-STATUS] Resolved channel JID to ${cachedGcsChannelJid}`);
            return cachedGcsChannelJid;
        }
        console.log(`[GCS-STATUS] Channel resolution failed, using fallback: ${GCS_STATUS_CHANNEL.jid}`);
        return GCS_STATUS_CHANNEL.jid;
    } catch (e) {
        console.error('[GCS-STATUS] Resolve error:', e.message);
        return GCS_STATUS_CHANNEL.jid;
    }
}

// ─── OWNER / SUDO CHECK ───
async function isOwnerOrSudo(userId) {
    if (!userId) return false;
    return config.OWNER_NUMBER.some(num => userId.startsWith(num) || userId.includes(num + '@'));
}

cmd({
    pattern: "gcsstatus",
    alias: ["groupstatus", "gpstatus"],
    desc: "📢 Broadcast status to all groups in the current session",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (sock, mek, m, { from, args, reply, sender }) => {
    try {
        // 1️⃣ Permission check
        const owner = await isOwnerOrSudo(sender);
        if (!owner && !mek.key.fromMe) return await reply('❌ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙊𝙒𝙉𝙀𝙍/𝙎𝙐𝘿𝙊 𝙊𝙉𝙇𝙔');

        // 2️⃣ Resolve channel JID (for the CTA attribution)
        const channelJid = await resolveChannelJid(sock);

        // 3️⃣ Content extraction (Must Reply)
        const rawQuotedContent = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!rawQuotedContent) {
            return await reply('⚠️ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙋𝙇𝙀𝘼𝙎𝙀 𝙍𝙀𝙋𝙇𝙔 𝙏𝙊 𝘼 𝙈𝙀𝙎𝙎𝘼𝙂𝙀 (𝙏𝙚𝙭𝙩/𝙈𝙚𝙙𝙞𝙖/𝙇𝙞𝙣𝙠)');
        }

        // Unpack viewOnce wrappers if present
        const content = rawQuotedContent.viewOnceMessageV2?.message || rawQuotedContent.viewOnceMessage?.message || rawQuotedContent;

        // 4️⃣ Fetch groups
        const groupsMeta = await sock.groupFetchAllParticipating();
        const groupJids = Object.keys(groupsMeta);
        if (!groupJids.length) return await reply('⚠️ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙉𝙊 𝙂𝙍𝙊𝙐𝙋𝙎 𝙁𝙊𝙐𝙉𝘿');

        // 5️⃣ Progress UI
        const startMsg = await reply(`📢 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙄𝙉𝙄𝙏𝙄𝘼𝙏𝙄𝙉𝙂\n\n🎯 𝙏𝙖𝙧𝙜𝙚𝙩: ${groupJids.length} Groups`);
        let success = 0, failed = 0;
        const batchSize = 10;

        const send = async (jid) => {
            try {
                const groupMeta = groupsMeta[jid];
                if (!groupMeta) return;

                const groupName = groupMeta.subject || 'Group';
                const participants = groupMeta.participants.map(p => p.id);
                // Ensure bot's own JID is in the list to see its own status
                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                if (!participants.includes(botJid)) participants.push(botJid);
                
                // Clone the exact quoted message content to preserve ALL metadata (links, thumbnails, etc.)
                const messageOverride = { ...content };
                const innerType = Object.keys(messageOverride)[0];
                
                if (innerType && messageOverride[innerType]) {
                    messageOverride[innerType] = {
                        ...messageOverride[innerType],
                        contextInfo: {
                            ...(messageOverride[innerType].contextInfo || {}),
                            groupMentions: [
                                {
                                    groupJid: jid,
                                    groupSubject: groupName
                                }
                            ],
                            isForwarded: true,
                            forwardingScore: 999,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: channelJid,
                                newsletterName: GCS_STATUS_CHANNEL.name,
                                serverMessageId: -1
                            }
                        }
                    };
                }

                // Generate actual WhatsApp Status message targeting status@broadcast
                const msg = generateWAMessageFromContent('status@broadcast', messageOverride, { userJid: sock.user.id });
                
                // Relay to status@broadcast with the group members in statusJidList
                await sock.relayMessage('status@broadcast', msg.message, { 
                    messageId: msg.key.id,
                    statusJidList: participants 
                });
                
                success++;
            } catch (e) {
                console.error(`[GCS-STATUS] Send error for group ${jid}:`, e.stack || e);
                failed++;
            }
        };

        for (let i = 0; i < groupJids.length; i += batchSize) {
            const batch = groupJids.slice(i, i + batchSize);
            await reply({ text: `⏳ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙋𝙍𝙊𝘾𝙀𝙎𝙎𝙄𝙉𝙂\n\n📡 𝙎𝙚𝙣𝙙𝙞𝙣𝙜: ${i + 1} - ${Math.min(i + batchSize, groupJids.length)} of ${groupJids.length}`, edit: startMsg.key });
            
            let idx = 0;
            if (idx < batch.length) { await send(batch[idx]); idx++; }
            while (idx < batch.length) {
                for (let p = 0; p < 2 && idx < batch.length; p++) { await send(batch[idx]); idx++; }
                if (idx < batch.length) await new Promise(r => setTimeout(r, 3000));
            }
            if (i + batchSize < groupJids.length) await new Promise(r => setTimeout(r, 10000));
        }

        await reply({ text: `✅ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 𝘾𝙊𝙈𝙋𝙇𝙀𝙏𝙀\n\n🚀 𝙎𝙪𝙘𝙘𝙚𝙨𝙨: ${success}\n❌ 𝙁𝙖𝙞𝙡𝙚𝙙: ${failed}`, edit: startMsg.key });
    } catch (e) {
        console.error('[GCS-STATUS] Critical:', e.stack || e);
        await reply(`⚠️ 𝑮𝑪𝑺 — 𝑺𝒕𝒂𝒕𝒖𝒔 𝑭𝒂𝒊𝒍𝒆𝒅\n𝑪𝒐𝒖𝒍𝒅𝒏’𝒕 𝒑𝒐𝒔𝒕 𝒕𝒉𝒆 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔.`);
    }
});

console.log('📢 MAZARI-MD - GCS Status Command Loaded!');
