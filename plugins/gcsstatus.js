// ============================================
// 📢 GCS STATUS - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 📢 Group Status Broadcast Command
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
// No database storage - RAM only as per requirements
let cachedGcsChannelJid = null;

// ─── RESOLVE CHANNEL JID ───
async function resolveChannelJid(sock) {
    try {
        if (cachedGcsChannelJid) {
            return cachedGcsChannelJid;
        }

        const code = GCS_STATUS_CHANNEL.link.split('whatsapp.com/channel/')[1].split('/')[0].split('?')[0];
        const metadata = await sock.newsletterMetadata("invite", code);

        if (metadata && metadata.id) {
            cachedGcsChannelJid = metadata.id;
            console.log(`[GCS-STATUS] Resolved channel JID to ${cachedGcsChannelJid}`);
            return cachedGcsChannelJid;
        }

        // Fallback to config if resolution fails
        const fallbackJid = config.CHANNEL_JID || '120363400318546224@newsletter';
        console.log(`[GCS-STATUS] Channel resolution failed, using fallback: ${fallbackJid}`);
        return fallbackJid;

    } catch (err) {
        console.error("[GCS-STATUS] Failed to resolve channel JID:", err.message);
        const fallbackJid = config.CHANNEL_JID || '120363400318546224@newsletter';
        return fallbackJid;
    }
}

// ─── CHECK OWNER/UDO PERMISSION ───
async function isOwnerOrSudo(userId, sock, chatId) {
    try {
        if (!userId || typeof userId !== 'string') return false;
        const isOwner = config.OWNER_NUMBER.some(num =>
            userId.startsWith(num) || userId.includes(num + '@')
        );
        return isOwner;
    } catch {
        return false;
    }
}

// ─── GENERATE CONTEXT INFO FOR GROUP STATUS ───
function generateContextInfo(channelJid, senderJid, statusSourceType) {
    return {
        isGroupStatus: true,
        statusSourceType: statusSourceType,
        statusAttributions: [{
            groupStatus: {
                authorJid: senderJid
            }
        }],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: channelJid,
            newsletterName: `${GCS_STATUS_CHANNEL.name} | Admin`,
            serverMessageId: -1
        }
    };
}

// ============================================
// 📌 GCS STATUS COMMAND
// ============================================
cmd({
    pattern: "gcsstatus",
    alias: ["groupstatus", "gpstatus"],
    desc: "📢 Broadcast status to all groups in the current session",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (sock, mek, m, { from, args, reply, isOwner, sender }) => {
    try {
        console.log(`[GCS-STATUS] Command triggered by ${sender} in ${from}`);

        // ─── 1. PERMISSION CHECK ───
        const isSenderOwner = await isOwnerOrSudo(sender, sock, from);
        if (!isSenderOwner && !mek.key.fromMe) {
            console.log('[GCS-STATUS] Failed: Unauthorized user');
            return await reply('❌ Only the bot owner or sudo can use this command');
        }

        // ─── 2. RESOLVE CHANNEL JID ───
        const finalChannelJid = await resolveChannelJid(sock);

        // ─── 3. EXTRACT CONTENT (QUOTED MESSAGE OR TEXT ARG) ───
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const textArg = args.join(' ').trim();
        let content = null;
        let statusSourceType = 4; // Default to TEXT

        if (quoted) {
            // ─── REPLIED TO A MESSAGE ───
            const contentUnpacked = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;

            // ─── CHECK FOR QUOTED MEDIA (IMAGE/VIDEO/AUDIO) ───
            let mediaType = '';
            let mediaKey = null;

            if (contentUnpacked.imageMessage) {
                mediaType = 'image';
                mediaKey = contentUnpacked.imageMessage;
            } else if (contentUnpacked.videoMessage) {
                mediaType = 'video';
                mediaKey = contentUnpacked.videoMessage;
            } else if (contentUnpacked.audioMessage) {
                mediaType = 'audio';
                mediaKey = contentUnpacked.audioMessage;
            }

            if (mediaKey) {
                // ─── QUOTED MEDIA ───
                await reply(`⏳ Downloading and uploading media to group status...`);

                // Download media buffer
                const stream = await downloadContentFromMessage(mediaKey, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                if (buffer.length === 0) {
                    throw new Error('Downloaded media buffer is empty');
                }

                // Generate WA Message Content (handles uploading to WA servers)
                const mediaGen = {};
                statusSourceType = 4; // Default to TEXT

                if (mediaType === 'image') {
                    mediaGen.image = buffer;
                    if (textArg) mediaGen.caption = textArg;
                    statusSourceType = 0; // IMAGE
                } else if (mediaType === 'video') {
                    mediaGen.video = buffer;
                    if (textArg) mediaGen.caption = textArg;
                    statusSourceType = 1; // VIDEO
                } else if (mediaType === 'audio') {
                    mediaGen.audio = buffer;
                    mediaGen.mimetype = mediaKey.mimetype || 'audio/mp4';
                    mediaGen.ptt = true;
                    statusSourceType = 3; // AUDIO
                }

                content = await generateWAMessageContent(mediaGen, { upload: sock.waUploadToServer });

                // Inject context info for group status metadata into inner media message
                const messageType = Object.keys(content)[0];
                if (messageType && content[messageType]) {
                    content[messageType].contextInfo = {
                        ...(content[messageType].contextInfo || {}),
                        ...generateContextInfo(finalChannelJid, sender, statusSourceType)
                    };
                }

            } else {
                // ─── QUOTED TEXT (OR OTHER NON-MEDIA) ───
                const quotedText = contentUnpacked.conversation ||
                    contentUnpacked.extendedTextMessage?.text ||
                    contentUnpacked.imageMessage?.caption ||
                    contentUnpacked.videoMessage?.caption ||
                    contentUnpacked.documentMessage?.caption ||
                    contentUnpacked.documentMessage?.fileName ||
                    contentUnpacked.documentMessage?.title ||
                    contentUnpacked.caption ||
                    contentUnpacked.text ||
                    contentUnpacked.contentText ||
                    contentUnpacked.selectedDisplayText ||
                    contentUnpacked.title ||
                    '';

                const statusText = textArg || quotedText;

                if (!statusText) {
                    console.log('[GCS-STATUS] Failed: Quoted message has no text and no text argument was provided');
                    return await reply('❌ Please provide text or reply to a message with text/media to set a group status.');
                }

                const quotedExtendedText = contentUnpacked.extendedTextMessage || {};

                // Text status configuration
                content = {
                    extendedTextMessage: {
                        text: statusText,
                        backgroundArgb: 4278241280, // Black color (Alpha: 255, R: 0, G: 0, B: 0)
                        font: 1,
                        matchedText: quotedExtendedText.matchedText,
                        canonicalUrl: quotedExtendedText.canonicalUrl,
                        description: quotedExtendedText.description,
                        title: quotedExtendedText.title,
                        jpegThumbnail: quotedExtendedText.jpegThumbnail,
                        previewType: quotedExtendedText.previewType,
                        contextInfo: {
                            ...generateContextInfo(finalChannelJid, sender, 4) // TEXT
                        }
                    }
                };
            }

        } else {
            // ─── NO QUOTED MESSAGE - TEXT ONLY ───
            if (!textArg) {
                console.log('[GCS-STATUS] Failed: No content provided');
                return await reply('❌ Please provide text or reply to media to set a group status.\nExample: `.gcsstatus Hello group!`');
            }

            // Text status configuration
            content = {
                extendedTextMessage: {
                    text: textArg,
                    backgroundArgb: 4278241280, // Black color (Alpha: 255, R: 0, G: 0, B: 0)
                    font: 1,
                    contextInfo: {
                        ...generateContextInfo(finalChannelJid, sender, 4) // TEXT
                    }
                }
            };
        }

        if (!content) {
            throw new Error('Failed to generate message content');
        }

        // ─── 4. FETCH ALL PARTICIPATING GROUPS (CURRENT SESSION ONLY) ───
        let targetGroupJids = [];
        let groupMetadata = null;

        console.log('[GCS-STATUS] Fetching participating groups for global broadcast...');
        groupMetadata = await sock.groupFetchAllParticipating();
        targetGroupJids = Object.keys(groupMetadata);

        if (targetGroupJids.length === 0) {
            return await reply('❌ The bot is not in any groups.');
        }

        // ─── 5. INITIAL PROGRESS UI ───
        const startUI = `𝘎𝘊𝘚 𝘚𝘛𝘈𝘛𝘜𝘚 — 𝘛𝘰𝘵𝘢𝘭: ${targetGroupJids.length} 𝘎𝘳𝘰𝘶𝘱𝘴`;
        const progressMsg = await reply(startUI);

        let successCount = 0;
        let failCount = 0;

        // ─── 6. BATCH PROCESSING ───
        const batchSize = 10;

        // Helper to send status to a single group
        const sendToGroup = async (targetJid) => {
            try {
                const messageToSend = generateWAMessageFromContent(targetJid, {
                    groupStatusMessage: { message: content },
                    groupStatusMessageV2: { message: content }
                }, { userJid: sock.user.id });

                await sock.relayMessage(targetJid, messageToSend.message, { messageId: messageToSend.key.id });
                successCount++;
            } catch (err) {
                console.error(`[GCS-STATUS] Failed to send status to ${targetJid}:`, err);
                failCount++;
            }
        };

        // Process groups in batches of 10
        for (let i = 0; i < targetGroupJids.length; i += batchSize) {
            const batch = targetGroupJids.slice(i, i + batchSize);

            // Update progress UI
            if (progressMsg) {
                await reply({
                    text: `𝘎𝘊𝘚 𝘚𝘛𝘈𝘛𝘜𝘚 — 𝘗𝘳𝘰𝘤𝘦𝘴𝘴𝘪𝘯𝘨: ${i + 1}–${Math.min(i + batchSize, targetGroupJids.length)} 𝘰𝘧 ${targetGroupJids.length}`,
                    edit: progressMsg.key
                });
            }

            // Sequence: first single, then pairs with 3‑second pauses
            let idx = 0;
            if (idx < batch.length) {
                await sendToGroup(batch[idx]);
                idx++;
            }

            while (idx < batch.length) {
                for (let p = 0; p < 2 && idx < batch.length; p++) {
                    await sendToGroup(batch[idx]);
                    idx++;
                }
                if (idx < batch.length) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            // Wait 10 seconds between batches if more groups remain
            if (i + batchSize < targetGroupJids.length) {
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        // ─── 7. FINAL PROGRESS UI ───
        if (progressMsg) {
            const endUI = `𝘎𝘊𝘚 𝘚𝘛𝘈𝘛𝘜𝘚 — 𝘊𝘰𝘮𝘱𝘭𝘦𝘵𝘦 • 𝘚𝘶𝘤𝘤𝘦𝘴𝘴: ${successCount} • 𝘍𝘢𝘪𝘭𝘦𝘥: ${failCount}`;
            await reply({
                text: endUI,
                edit: progressMsg.key
            });
        }

    } catch (error) {
        console.error('[GCS-STATUS] Critical Error:', error);
        await reply(`❌ Failed to set group status.\nError: ${error.message}`);
    }
});

console.log('📢 MAZARI-MD - GCS Status Command Loaded!');
