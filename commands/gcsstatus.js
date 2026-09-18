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
        if (!owner && !mek.key.fromMe) return await reply('❌ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑶𝒘𝒏𝒆𝒓/𝑺𝒖𝒅𝒐 𝒐𝒏𝒍𝒚.');

        // 2️⃣ Resolve channel JID (for the CTA attribution)
        const channelJid = await resolveChannelJid(sock);

        // 3️⃣ Content extraction (Must Reply)
        const rawQuotedContent = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!rawQuotedContent) {
            return await reply('⚠️ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆.');
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
            return await reply('⚠️ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑵𝒐 𝒆𝒍𝒊𝒈𝒊𝒃𝒍𝒆 𝒈𝒓𝒐𝒖𝒑𝒔 𝒇𝒐𝒖𝒏𝒅.');
        }

        // 5️⃣ Progress UI - Start message (MAZARI STYLE)
        const startMsg = await sock.sendMessage(from, { text: `⏳ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑷𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈 𝒈𝒓𝒐𝒖𝒑𝒔...` });
        
        // Send warning message separately (MAZARI STYLE)
        await sock.sendMessage(from, { text: `⚠️ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕 — 𝒅𝒐𝒏'𝒕 𝒖𝒔𝒆 𝒂 𝒄𝒐𝒎𝒎𝒂𝒏𝒅.` });
        
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
                // Group Status requires specific fields on the Message proto for proper rendering:
                // - statusSourceType: 0=IMAGE, 1=VIDEO
                // - statusAttributions: array of StatusAttribution objects (can be empty)
                // - isGroupStatus: true
                // These fields are on the Message proto itself, NOT inside imageMessage/videoMessage
                const hasImage = !!messageOverride.imageMessage;
                const hasVideo = !!messageOverride.videoMessage;
                const hasText = !!(messageOverride.extendedTextMessage || messageOverride.conversation);
                
                // Build the inner message content with status fields
                // For media, we need to include statusSourceType and isGroupStatus
                const innerMessage = {
                    ...(hasImage ? { imageMessage: messageOverride.imageMessage } : {}),
                    ...(hasVideo ? { videoMessage: messageOverride.videoMessage } : {}),
                    ...(hasText ? { extendedTextMessage: messageOverride.extendedTextMessage || { text: messageOverride.conversation } } : {}),
                    statusSourceType: hasImage ? 0 : hasVideo ? 1 : undefined,
                    statusAttributions: [],
                    isGroupStatus: true
                };

                // Create the final payload structure for relayMessage
                // Group Status uses groupChatMessage with the inner message
                const groupStatusPayload = {
                    groupChatMessage: {
                        message: innerMessage,
                        contextInfo: {
                            mentionedJid: [],
                            quotedMessage: null,
                            remoteJid: channelJid,
                            participant: sock.user.id
                        }
                    }
                };

                // Generate message for direct group send
                const msg = generateWAMessageFromContent(jid, groupStatusPayload, { userJid: sock.user.id });
                
                // 🔍 DIAGNOSTIC: Verify final payload structure
                console.log(`[GCS-STATUS][${reqId}] FINAL PAYLOAD STRUCTURE:`);
                const msgObj = msg.message;
                console.log(`  Keys in msg.message: ${Object.keys(msgObj).join(', ')}`);
                console.log(`  Has groupChatMessage: ${!!msgObj.groupChatMessage}`);
                
                if (msgObj.groupChatMessage?.message) {
                    const innerMsg = msgObj.groupChatMessage.message;
                    console.log(`  groupChatMessage.message keys: ${Object.keys(innerMsg).join(', ')}`);
                    const mediaType = Object.keys(innerMsg).find(k => k.includes('Message') && k !== 'messageContextInfo');
                    console.log(`  Inner media type: ${mediaType}`);
                    console.log(`  Has statusSourceType: ${!!innerMsg.statusSourceType}, value: ${innerMsg.statusSourceType}`);
                    console.log(`  Has statusAttributions: ${!!innerMsg.statusAttributions}, value: ${JSON.stringify(innerMsg.statusAttributions)}`);
                    console.log(`  Has isGroupStatus: ${!!innerMsg.isGroupStatus}, value: ${innerMsg.isGroupStatus}`);
                }
                
                // Send directly to the group using relayMessage (standard group message pattern)
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

        // 6️⃣ Process groups sequentially in batches of 10
        // Between groups: 5 seconds
        // Between batches: 20 seconds (but not after the final batch)
        let processedCount = 0;
        for (let i = 0; i < eligibleJids.length; i += batchSize) {
            const batch = eligibleJids.slice(i, i + batchSize);
            
            // Process groups in this batch sequentially (one by one, no parallel)
            for (let idx = 0; idx < batch.length; idx++) {
                const jid = batch[idx];
                const targetIndex = i + idx + 1;
                
                await send(jid, targetIndex);
                
                processedCount++;
                
                // Update progress message after EACH group is processed
                await sock.sendMessage(from, { text: `⏳ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑮𝒓𝒐𝒖𝒑𝒔: ${processedCount}/${eligibleJids.length}`, edit: startMsg.key });
                
                // After completing a batch of 10 groups, wait 20 seconds
                // But do NOT wait after the very last group (final completion)
                const isLastGroup = (processedCount >= eligibleJids.length);
                const isBatchComplete = (processedCount % batchSize === 0);
                
                if (!isLastGroup && isBatchComplete) {
                    // Wait 20 seconds after completing a full batch
                    await new Promise(r => setTimeout(r, 20000));
                } else if (!isLastGroup) {
                    // Wait 5 seconds between normal groups (inside a batch)
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
        }

        // 7️⃣ Final completion message with exact MAZARI style
        // Line 1: ✅ GCS Status Complete — X/Y groups
        // Line 2: 👑 Powered by MAZARI MD
        await sock.sendMessage(from, { 
            text: `✅ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑪𝒐𝒎𝒑𝒍𝒆𝒕𝒆 — ${success}/${eligibleJids.length} 𝒈𝒓𝒐𝒖𝒑𝒔\n\n👑 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑴𝑨𝒁𝑨𝑹𝑰 𝑴𝑫`, 
            edit: startMsg.key 
        });
    } catch (e) {
        console.error('[GCS-STATUS] Critical Execution Error:', e.stack || e);
        await reply(`❌ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑺𝒕𝒂𝒕𝒖𝒔 𝒇𝒂𝒊𝒍𝒆𝒅 — 𝒑𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.`);
    }
});

console.log('📢 MAZARI-MD - GCS Status Command Loaded!');
