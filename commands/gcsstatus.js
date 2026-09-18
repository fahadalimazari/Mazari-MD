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
        if (!owner && !mek.key.fromMe) return await reply('❌ ��� ������\n�����/���� ����.');

        // 2️⃣ Resolve channel JID (for the CTA attribution)
        const channelJid = await resolveChannelJid(sock);

        // 3️⃣ Content extraction (Must Reply)
        const rawQuotedContent = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!rawQuotedContent) {
            return await reply('⚠️ ��� ������\n������ ����� �� � �������.');
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
            return await reply('⚠️ ��� ������\n�� �������� ������ �����.');
        }

        // 5️⃣ Progress UI - Start message (MAZARI STYLE)
        const startMsg = await sock.sendMessage(from, { text: `⏳ ��� ������\n���������� ������...` });
        
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
                if (messageOverride.imageMessage) {
                    try {
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Processing image message for ${jid}...`);
                        
                        const imageMsg = messageOverride.imageMessage;
                        const mediaBuffer = await downloadContentFromMessage({ imageMessage: imageMsg }, 'image');
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Downloaded ${mediaBuffer.length} bytes`);
                        
                        // Prepare image with re-uploaded media using prepareWAMessageMedia
                        // Note: config.mediaCache may not exist, so we'll let prepareWAMessageMedia handle caching internally
                        const reuploadedImage = await prepareWAMessageMedia({ 
                            image: mediaBuffer,
                            mimetype: imageMsg.mimetype,
                            caption: imageMsg.caption
                        }, {
                            upload: sock.waUploadToServer,
                            mediaCache: null,  // Disable caching if not available
                            logger: { debug: () => {}, info: () => {}, warn: console.warn },
                            mediaTypeOverride: 'image',
                            jid: jid  // Pass target JID for proper handling
                        });
                        
                        messageOverride.imageMessage = reuploadedImage.imageMessage;
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Re-uploaded successfully: ${messageOverride.imageMessage.url}`);
                    } catch (e) {
                        console.log(`[GCS-STATUS][${reqId}] [IMAGE] Failed to re-upload: ${e.message}`);
                    }
                }
                else if (messageOverride.videoMessage) {
                    try {
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Processing video message for ${jid}...`);
                        
                        const videoMsg = messageOverride.videoMessage;
                        const mediaBuffer = await downloadContentFromMessage({ videoMessage: videoMsg }, 'video');
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Downloaded ${mediaBuffer.length} bytes`);
                        
                        const reuploadedVideo = await prepareWAMessageMedia({ 
                            video: mediaBuffer,
                            mimetype: videoMsg.mimetype,
                            caption: videoMsg.caption,
                            seconds: videoMsg.seconds
                        }, {
                            upload: sock.waUploadToServer,
                            mediaCache: null,
                            logger: { debug: () => {}, info: () => {}, warn: console.warn },
                            mediaTypeOverride: 'video',
                            jid: jid
                        });
                        
                        messageOverride.videoMessage = reuploadedVideo.videoMessage;
                        console.log(`[GCS-STATUS][${reqId}] [VIDEO] Re-uploaded successfully: ${messageOverride.videoMessage.url}`);
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

        let processedCount = 0;
        for (let i = 0; i < eligibleJids.length; i += batchSize) {
            const batch = eligibleJids.slice(i, i + batchSize);
            
            // Process groups in this batch sequentially (one by one)
            for (let idx = 0; idx < batch.length; idx++) {
                const jid = batch[idx];
                const targetIndex = i + idx + 1;
                
                await send(jid, targetIndex);
                
                processedCount++;
                
                // Update progress message after EACH group attempt: "⏳ GCS Status Groups: X/Y"
                await sock.sendMessage(from, { text: `⏳ ��� ������\n������: ${processedCount}/${eligibleJids.length}`, edit: startMsg.key });
                
                // Wait 5 seconds before next group (except after the last group)
                const isLastGroup = (processedCount >= eligibleJids.length);
                if (!isLastGroup) {
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
            
            // After each batch of 10 groups, wait 20 seconds (but NOT after the final batch)
            const isFinalBatch = (i + batchSize >= eligibleJids.length);
            if (!isFinalBatch) {
                await new Promise(r => setTimeout(r, 20000));
            }
        }

        console.log(`[GCS-STATUS][${reqId}] Execution complete. Success: ${success}, Failed: ${failed}`);
        await sock.sendMessage(from, { 
            text: `✅ 𝑮𝑪𝑺 ����\n��𝒑�𝒆𝒕𝒆 — ${success}/${eligibleJids.length} �����\n\n👑 ���𝒆𝒓�� �� ����𝑹𝑰 𝑴𝑫`, 
            edit: startMsg.key 
        });
    } catch (e) {
        console.error('[GCS-STATUS] Critical Execution Error:', e.stack || e);
        await reply(`❌ 𝑮𝑪𝑺 𝑺𝒕𝒂𝒕𝒖𝒔\n���𝒂��� ����� — 𝒑����𝒆 �𝒓� ��𝒂��.`);
    }
});

console.log('📢 MAZARI-MD - GCS Status Command Loaded!');
