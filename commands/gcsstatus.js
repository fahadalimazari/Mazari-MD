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
    link: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
};

// ─── IN-MEMORY CACHE FOR CHANNEL JID ───
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
        const fallback = config.CHANNEL_JID || '120363400318546224@newsletter';
        console.log(`[GCS-STATUS] Channel resolution failed, using fallback: ${fallback}`);
        return fallback;
    } catch (e) {
        console.error('[GCS-STATUS] Resolve error:', e.message);
        return config.CHANNEL_JID || '120363400318546224@newsletter';
    }
}

// ─── OWNER / SUDO CHECK ───
async function isOwnerOrSudo(userId) {
    if (!userId) return false;
    return config.OWNER_NUMBER.some(num => userId.startsWith(num) || userId.includes(num + '@'));
}

// ─── CONTEXT INFO GENERATOR ───
function generateContextInfo(channelJid, senderJid, sourceType) {
    return {
        isGroupStatus: true,
        statusSourceType: sourceType,
        statusAttributions: [{ groupStatus: { authorJid: senderJid } }],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: channelJid,
            newsletterName: `${GCS_STATUS_CHANNEL.name} | Admin`,
            serverMessageId: -1
        }
    };
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
        if (!owner && !mek.key.fromMe) return await reply('❌ Only the bot owner or sudo can use this command');

        // 2️⃣ Resolve channel JID
        const channelJid = await resolveChannelJid(sock);

        // 3️⃣ Content extraction
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const textArg = args.join(' ').trim();
        let content = null;
        let sourceType = 4; // TEXT by default

        if (quoted) {
            const unpacked = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;
            // Media handling
            let mediaKey = null, mediaType = '';
            if (unpacked.imageMessage) { mediaKey = unpacked.imageMessage; mediaType = 'image'; }
            else if (unpacked.videoMessage) { mediaKey = unpacked.videoMessage; mediaType = 'video'; }
            else if (unpacked.audioMessage) { mediaKey = unpacked.audioMessage; mediaType = 'audio'; }

            if (mediaKey) {
                await reply('⏳ Downloading and uploading media to group status...');
                const stream = await downloadContentFromMessage(mediaKey, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                if (!buffer.length) throw new Error('Empty media buffer');
                const gen = {};
                if (mediaType === 'image') { gen.image = buffer; if (textArg) gen.caption = textArg; sourceType = 0; }
                else if (mediaType === 'video') { gen.video = buffer; if (textArg) gen.caption = textArg; sourceType = 1; }
                else if (mediaType === 'audio') { gen.audio = buffer; gen.mimetype = mediaKey.mimetype || 'audio/mp4'; gen.ptt = true; sourceType = 3; }
                content = await generateWAMessageContent(gen, { upload: sock.waUploadToServer });
                const innerType = Object.keys(content)[0];
                if (innerType && content[innerType]) {
                    content[innerType].contextInfo = { ...(content[innerType].contextInfo || {}), ...generateContextInfo(channelJid, sender, sourceType) };
                }
            } else {
                // Quoted text handling
                const quotedText = unpacked.conversation || unpacked.extendedTextMessage?.text || unpacked.imageMessage?.caption || unpacked.videoMessage?.caption || unpacked.documentMessage?.caption || unpacked.documentMessage?.fileName || unpacked.documentMessage?.title || unpacked.caption || unpacked.text || unpacked.contentText || unpacked.selectedDisplayText || unpacked.title || '';
                const finalText = textArg || quotedText;
                if (!finalText) return await reply('❌ Provide text or reply to a message with text/media.');
                const ext = unpacked.extendedTextMessage || {};
                content = {
                    extendedTextMessage: {
                        text: finalText,
                        backgroundArgb: 4278241280,
                        font: 1,
                        matchedText: ext.matchedText,
                        canonicalUrl: ext.canonicalUrl,
                        description: ext.description,
                        title: ext.title,
                        jpegThumbnail: ext.jpegThumbnail,
                        previewType: ext.previewType,
                        contextInfo: generateContextInfo(channelJid, sender, 4)
                    }
                };
            }
        } else {
            // Direct text command
            if (!textArg) return await reply('❌ Provide text. Example: `.gcsstatus Hello`');
            content = {
                extendedTextMessage: {
                    text: textArg,
                    backgroundArgb: 4278241280,
                    font: 1,
                    contextInfo: generateContextInfo(channelJid, sender, 4)
                }
            };
        }

        // 4️⃣ Fetch groups
        const groupsMeta = await sock.groupFetchAllParticipating();
        const groupJids = Object.keys(groupsMeta);
        if (!groupJids.length) return await reply('❌ The bot is not in any groups.');

        // 5️⃣ Progress UI
        const startMsg = await reply(`𝘎𝘊𝘚 𝘚𝘛𝘈𝘛𝘜𝘚 — Total: ${groupJids.length} Groups`);
        let success = 0, failed = 0;
        const batchSize = 10;

        const send = async (jid) => {
            try {
                const msg = generateWAMessageFromContent(jid, { groupStatusMessage: { message: content }, groupStatusMessageV2: { message: content } }, { userJid: sock.user.id });
                await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
                success++;
            } catch (e) {
                console.error('[GCS-STATUS] Send error:', e);
                failed++;
            }
        };

        for (let i = 0; i < groupJids.length; i += batchSize) {
            const batch = groupJids.slice(i, i + batchSize);
            await reply({ text: `𝘎𝘊𝘚 𝘚𝘛𝘈𝘛𝘜𝘚 — Processing ${i + 1}-${Math.min(i + batchSize, groupJids.length)} of ${groupJids.length}`, edit: startMsg.key });
            let idx = 0;
            if (idx < batch.length) { await send(batch[idx]); idx++; }
            while (idx < batch.length) {
                for (let p = 0; p < 2 && idx < batch.length; p++) { await send(batch[idx]); idx++; }
                if (idx < batch.length) await new Promise(r => setTimeout(r, 3000));
            }
            if (i + batchSize < groupJids.length) await new Promise(r => setTimeout(r, 10000));
        }

        await reply({ text: `𝘎𝘊𝘚 𝘚𝘛𝘈𝘛𝘜𝘚 — Complete\nSuccess: ${success}\nFailed: ${failed}`, edit: startMsg.key });
    } catch (e) {
        console.error('[GCS-STATUS] Critical:', e);
        await reply(`❌ Failed to set group status.\nError: ${e.message}`);
    }
});

console.log('📢 MAZARI-MD - GCS Status Command Loaded!');
