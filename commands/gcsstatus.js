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

        // 4️⃣ Detect the actual group JID
        const targetJid = from;
        if (!targetJid.endsWith('@g.us')) {
            return await reply('⚠️ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙋𝙇𝙀𝘼𝙎𝙀 𝙐𝙎𝙀 𝙏𝙃𝙄𝙎 𝘾𝙊𝙈𝙈𝘼𝙉𝘿 𝙄𝙉𝙎𝙄𝘿𝙀 𝘼 𝙂𝙍𝙊𝙐𝙋');
        }

        const groupMeta = await sock.groupMetadata(targetJid).catch(() => null);
        if (!groupMeta) {
            return await reply('⚠️ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝘾𝙊𝙐𝙇𝘿𝙉\'𝙏 𝙁𝙀𝙏𝘾𝙃 𝙂𝙍𝙊𝙐𝙋 𝙈𝙀𝙏𝘼𝘿𝘼𝙏𝘼');
        }

        const groupName = groupMeta.subject || 'Group';
        const participants = groupMeta.participants.map(p => p.id);
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!participants.includes(botJid)) participants.push(botJid);

        // 5️⃣ Clone Content & Attach Metadata
        const messageOverride = JSON.parse(JSON.stringify(content));
        
        // If it's a raw conversation string, convert it to extendedTextMessage so we can attach contextInfo securely
        if (messageOverride.conversation) {
            messageOverride.extendedTextMessage = { text: messageOverride.conversation };
            delete messageOverride.conversation;
        }

        const innerType = Object.keys(messageOverride)[0];
        if (innerType && messageOverride[innerType]) {
            messageOverride[innerType] = {
                ...messageOverride[innerType],
                contextInfo: {
                    ...(messageOverride[innerType].contextInfo || {}),
                    groupMentions: [
                        {
                            groupJid: targetJid,
                            groupSubject: groupName
                        }
                    ]
                }
            };
        }

        // 6️⃣ Generate actual WhatsApp Status message targeting status@broadcast
        const msg = generateWAMessageFromContent('status@broadcast', messageOverride, { userJid: sock.user.id });
        
        // 7️⃣ Relay to status@broadcast with the group members in statusJidList
        await sock.relayMessage('status@broadcast', msg.message, { 
            messageId: msg.key.id,
            statusJidList: participants 
        });
        
        await reply(`✅ 𝑮𝑪𝑺 — 𝑺𝒕𝒂𝒕𝒖𝒔 𝑷𝒐𝒔𝒕𝒆𝒅`);
    } catch (e) {
        console.error('[GCS-STATUS] Critical:', e.stack || e);
        await reply(`⚠️ 𝑮𝑪𝑺 — 𝑺𝒕𝒂𝒕𝒖𝒔 𝑭𝒂𝒊𝒍𝒆𝒅\n𝑪𝒐𝒖𝒍𝒅𝒏’𝒕 𝒑𝒐𝒔𝒕 𝒕𝒉𝒆 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔.`);
    }
});

console.log('📢 MAZARI-MD - GCS Status Command Loaded!');
