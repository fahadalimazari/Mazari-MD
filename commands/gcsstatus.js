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
                await reply('⏳ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙋𝙍𝙊𝘾𝙀𝙎𝙎𝙄𝙉 𝙈𝙀𝘿𝙄𝘼...');
                const stream = await downloadContentFromMessage(mediaKey, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                if (!buffer.length) throw new Error('Empty media buffer');
                
                const gen = {};
                if (mediaType === 'image') { gen.image = buffer; if (textArg) gen.caption = textArg; sourceType = 0; }
                else if (mediaType === 'video') { gen.video = buffer; if (textArg) gen.caption = textArg; sourceType = 1; }
                else if (mediaType === 'audio') { gen.audio = buffer; gen.mimetype = mediaKey.mimetype || 'audio/mp4'; gen.ptt = true; sourceType = 3; }
                
                content = await generateWAMessageContent(gen, { upload: sock.waUploadToServer });
            } else {
                // Quoted text handling
                const quotedText = unpacked.conversation || unpacked.extendedTextMessage?.text || unpacked.imageMessage?.caption || unpacked.videoMessage?.caption || unpacked.documentMessage?.caption || unpacked.documentMessage?.fileName || unpacked.documentMessage?.title || unpacked.caption || unpacked.text || unpacked.contentText || unpacked.selectedDisplayText || unpacked.title || '';
                const finalText = textArg || quotedText;
                if (!finalText) return await reply('⚠️ 𝙋𝙍𝙊𝙑𝙄𝘿𝙀 𝙏𝙀𝙓𝙏 𝙊𝙍 𝙍𝙀𝙋𝙇𝙔 𝙏𝙊 𝙈𝙀𝘿𝙄𝘼');
                
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
                        previewType: ext.previewType
                    }
                };
            }
        } else {
            // Direct text command
            if (!textArg) return await reply('⚠️ 𝙋𝙍𝙊𝙑𝙄𝘿𝙀 𝙏𝙀𝙓𝙏 𝙊𝙍 𝙍𝙀𝙋𝙇𝙔 𝙏𝙊 𝙈𝙀𝘿𝙄𝘼');
            content = {
                extendedTextMessage: {
                    text: textArg,
                    backgroundArgb: 4278241280,
                    font: 1
                }
            };
        }

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
                // Wrap in actual WhatsApp Group Status protocol structure using BOTH formats for compatibility
                const msg = generateWAMessageFromContent(jid, { 
                    groupStatusMessage: { message: content }, 
                    groupStatusMessageV2: { message: content } 
                }, { userJid: sock.user.id });
                
                await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
                success++;
            } catch (e) {
                console.error('[GCS-STATUS] Send error:', e);
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
