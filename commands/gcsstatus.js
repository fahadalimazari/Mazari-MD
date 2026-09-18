// ============================================
// 📢 GCS STATUS - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 📢 Broadcast status to all groups in the current session
// ============================================

const { cmd } = require('../arslan');
const { downloadContentFromMessage, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
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

        const reqId = Math.random().toString(36).substring(2, 8);
        console.log(`[GCS-STATUS][${reqId}] Command received from: ${from}`);

        // 4️⃣ Fetch ALL participating groups (Native multi-session isolation)
        const groupsMeta = await sock.groupFetchAllParticipating();
        const rawGroupJids = Object.keys(groupsMeta);
        
        // Filter out newsletters, channels, and invalid JIDs
        const eligibleJids = rawGroupJids.filter(jid => jid && jid.endsWith('@g.us') && !jid.includes('@newsletter'));
        
        console.log(`[GCS-STATUS][${reqId}] Eligible groups discovered: ${eligibleJids.length}`);
        console.log(`[GCS-STATUS][${reqId}] Excluded/Invalid groups: ${rawGroupJids.length - eligibleJids.length}`);

        if (!eligibleJids.length) {
            return await reply('⚠️ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙉𝙊 𝙀𝙇𝙄𝙂𝙄𝘽𝙇𝙀 𝙂𝙍𝙊𝙐𝙋𝙎 𝙁𝙊𝙐𝙉𝘿');
        }

        // 5️⃣ Progress UI
        const startMsg = await sock.sendMessage(from, { text: `📢 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙄𝙉𝙄𝙏𝙄𝘼𝙏𝙄𝙉𝙂\n\n🎯 𝙏𝙖𝙧𝙜𝙚𝙩: ${eligibleJids.length} Groups` });
        let success = 0, failed = 0;
        const batchSize = 10;

        const send = async (jid, targetIndex) => {
            try {
                const groupMeta = groupsMeta[jid];
                if (!groupMeta || !groupMeta.participants) {
                    console.log(`[GCS-STATUS][${reqId}] ❌ Target failed (no metadata): ${jid}`);
                    failed++;
                    return;
                }

                const groupName = groupMeta.subject || 'Group';
                const participants = groupMeta.participants.map(p => p.id);
                
                console.log(`[GCS-STATUS][${reqId}] Target ${targetIndex}/${eligibleJids.length}: ${jid} | Subject: ${groupName} | Participants: ${participants.length}`);

                // Clone the exact quoted message content to preserve ALL metadata (links, thumbnails, etc.)
                const messageOverride = JSON.parse(JSON.stringify(content));
                
                // Handle IMAGE/VIDEO media re-upload for Group Status
                // The quoted message contains encrypted media URLs that need to be re-uploaded
                // IMPORTANT: downloadContentFromMessage() returns a stream/async iterable in Baileys 7.x
                // We must consume the complete stream and convert it to a Buffer
                if (messageOverride.imageMessage) {
                    try {
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Processing image message for ${jid}...`);
                        
                        const imageMsg = messageOverride.imageMessage;
                        const stream = await downloadContentFromMessage({
                            mediaKey: imageMsg.mediaKey,
                            directPath: imageMsg.directPath,
                            url: imageMsg.url
                        }, 'image');
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Download stream received`);
                        
                        // Convert async iterable stream to Buffer
                        const chunks = [];
                        for await (const chunk of stream) {
                            chunks.push(chunk);
                        }
                        const mediaBuffer = Buffer.concat(chunks);
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Buffer size: ${mediaBuffer.length} bytes, valid: ${Buffer.isBuffer(mediaBuffer)}`);
                        
                        // Prepare image with re-uploaded media using prepareWAMessageMedia
                        const reuploadedImage = await prepareWAMessageMedia({ 
                            image: mediaBuffer,
                            mimetype: imageMsg.mimetype,
                            caption: imageMsg.caption,
                            width: imageMsg.width,
                            height: imageMsg.height
                        }, {
                            upload: sock.waUploadToServer,
                            mediaCache: null,
                            logger: { debug: () => {}, info: () => {}, warn: console.warn },
                            mediaTypeOverride: 'image',
                            jid: jid
                        });
                        
                        messageOverride.imageMessage = reuploadedImage.imageMessage;
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Re-uploaded successfully: ${messageOverride.imageMessage.url}`);
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Generated imageMessage metadata:`, {
                            url: !!messageOverride.imageMessage.url,
                            directPath: !!messageOverride.imageMessage.directPath,
                            mimetype: messageOverride.imageMessage.mimetype,
                            fileLength: messageOverride.imageMessage.fileLength,
                            width: messageOverride.imageMessage.width,
                            height: messageOverride.imageMessage.height,
                            jpegThumbnailLength: messageOverride.imageMessage.jpegThumbnail?.length,
                            caption: !!messageOverride.imageMessage.caption
                        });
                    } catch (e) {
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Failed to re-upload: ${e.message}`);
                    }
                }
                else if (messageOverride.videoMessage) {
                    try {
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Processing video message for ${jid}...`);
                        
                        const videoMsg = messageOverride.videoMessage;
                        const stream = await downloadContentFromMessage({
                            mediaKey: videoMsg.mediaKey,
                            directPath: videoMsg.directPath,
                            url: videoMsg.url
                        }, 'video');
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Download stream received`);
                        
                        // Convert async iterable stream to Buffer
                        const chunks = [];
                        for await (const chunk of stream) {
                            chunks.push(chunk);
                        }
                        const mediaBuffer = Buffer.concat(chunks);
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Buffer size: ${mediaBuffer.length} bytes, valid: ${Buffer.isBuffer(mediaBuffer)}`);
                        
                        const reuploadedVideo = await prepareWAMessageMedia({ 
                            video: mediaBuffer,
                            mimetype: videoMsg.mimetype,
                            caption: videoMsg.caption,
                            seconds: videoMsg.seconds,
                            width: videoMsg.width,
                            height: videoMsg.height
                        }, {
                            upload: sock.waUploadToServer,
                            mediaCache: null,
                            logger: { debug: () => {}, info: () => {}, warn: console.warn },
                            mediaTypeOverride: 'video',
                            jid: jid
                        });
                        
                        messageOverride.videoMessage = reuploadedVideo.videoMessage;
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Re-uploaded successfully: ${messageOverride.videoMessage.url}`);
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Generated videoMessage metadata:`, {
                            url: !!messageOverride.videoMessage.url,
                            directPath: !!messageOverride.videoMessage.directPath,
                            mimetype: messageOverride.videoMessage.mimetype,
                            fileLength: messageOverride.videoMessage.fileLength,
                            width: messageOverride.videoMessage.width,
                            height: messageOverride.videoMessage.height,
                            seconds: messageOverride.videoMessage.seconds,
                            jpegThumbnailLength: messageOverride.videoMessage.jpegThumbnail?.length,
                            caption: !!messageOverride.videoMessage.caption
                        });
                    } catch (e) {
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Failed to re-upload: ${e.message}`);
                    }
                }
                
                // If it's a raw conversation string, convert it to extendedTextMessage
                if (messageOverride.conversation) {
                    messageOverride.extendedTextMessage = { text: messageOverride.conversation };
                    delete messageOverride.conversation;
                }

                // 🌟 CORRECT GROUP STATUS STRUCTURE
                // OLD WORKING IMPLEMENTATION PROVEN:
                // generateWAMessageFromContent(targetJid, { groupStatusMessage, groupStatusMessageV2 }, { userJid })
                // relayMessage(targetJid, msg.message)  // targetJid = actual group JID
                //
                // Current status@broadcast approach is NOT the proven working pattern.
                // Group Status should be sent directly to each group with both message types.
                const finalPayload = {
                    groupStatusMessage: {
                        message: messageOverride
                    },
                    groupStatusMessageV2: {
                        message: messageOverride
                    }
                };

                // Generate message for direct group send (OLD WORKING PATTERN)
                const msg = generateWAMessageFromContent(jid, finalPayload, { userJid: sock.user.id });
                
                // 🔍 DIAGNOSTIC: Verify final payload structure
                console.log(`[GCS-STATUS][${reqId}] FINAL PAYLOAD STRUCTURE:`);
                const msgObj = msg.message;
                console.log(`  Keys in msg.message: ${Object.keys(msgObj).join(', ')}`);
                console.log(`  Has groupStatusMessage: ${!!msgObj.groupStatusMessage}`);
                console.log(`  Has groupStatusMessageV2: ${!!msgObj.groupStatusMessageV2}`);
                
                if (msgObj.groupStatusMessage?.message) {
                    const innerMsg = msgObj.groupStatusMessage.message;
                    console.log(`  groupStatusMessage.message keys: ${Object.keys(innerMsg).join(', ')}`);
                    const mediaType = Object.keys(innerMsg).find(k => k.includes('Message') && k !== 'messageContextInfo');
                    console.log(`  Inner media type: ${mediaType}`);
                }
                
                // Send directly to the group (OLD WORKING PATTERN - no statusJidList)
                await sock.relayMessage(jid, msg.message, { 
                    messageId: msg.key.id
                });
                
                console.log(`[GCS-STATUS][${reqId}] Direct group send: SUCCESS for ${jid}`);
                success++;
            } catch (e) {
                console.error(`[GCS-STATUS][${reqId}] ❌ Target failed: ${jid} | Error:`, e.stack || e.message);
                failed++;
            }
        };

        for (let i = 0; i < eligibleJids.length; i += batchSize) {
            const batch = eligibleJids.slice(i, i + batchSize);
            await sock.sendMessage(from, { text: `⏳ 𝙂𝘾𝙎 𝙎𝙏𝘼𝙏𝙐𝙎 — 𝙋𝙍𝙊𝘾𝙀𝙎𝙎𝙄𝙉𝙂\n\n📡 𝙎𝙚𝙣𝙙𝙞𝙣𝙜: ${i + 1} - ${Math.min(i + batchSize, eligibleJids.length)} of ${eligibleJids.length}`, edit: startMsg.key });
            
            let idx = 0;
            if (idx < batch.length) { await send(batch[idx], i + idx + 1); idx++; }
            while (idx < batch.length) {
                for (let p = 0; p < 2 && idx < batch.length; p++) { await send(batch[idx], i + idx + 1); idx++; }
                if (idx < batch.length) await new Promise(r => setTimeout(r, 3000));
            }
            if (i + batchSize < eligibleJids.length) await new Promise(r => setTimeout(r, 10000));
        }

        console.log(`[GCS-STATUS][${reqId}] Execution complete. Success: ${success}, Failed: ${failed}`);
        await sock.sendMessage(from, { text: `✅ 𝑮𝑪𝑺 — 𝑹𝒆𝒍𝒂𝒚 𝑨𝒄𝒄𝒆𝒑𝒕𝒆𝒅\n🎯 𝑮𝒓𝒐𝒖𝒑𝒔: ${success}/${eligibleJids.length}\n\n⚠️ 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝑼𝑰 𝒗𝒆𝒓𝒊𝒇𝒊𝒄𝒂𝒕𝒊𝒐𝒏: 𝑵𝑶𝑻 𝑷𝑬𝑹𝑭𝑶𝑹𝑴𝑬𝑫`, edit: startMsg.key });
    } catch (e) {
        console.error('[GCS-STATUS] Critical Execution Error:', e.stack || e);
        await reply(`⚠️ 𝑮𝑪𝑺 — 𝑺𝒕𝒂𝒕𝒖𝒔 𝑭𝒂𝒊𝒍𝒆𝒅\n𝑪𝒐𝒖𝒍𝒅𝒏'𝒕 𝒑𝒐𝒔𝒕 𝒕𝒉𝒆 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔.`);
    }
});

console.log('📢 MAZARI-MD - GCS Status Command Loaded!');
