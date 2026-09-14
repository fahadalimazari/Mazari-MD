const { downloadContentFromMessage, generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const config = require('../config');

const GCS_STATUS_CHANNEL = {
    name: "MAZARI MD",
    link: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
};
let cachedGcsChannelJid = null;

cmd({
    pattern: "gcsstatus",
    alias: ["groupstatus", "gpstatus"],
    desc: "📸 Post group status to all participating groups",
    category: "owner",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { body, reply, pushname }) => {
    try {
        console.log(`[GROUP-STATUS] Command triggered by ${mek.key.participant || mek.key.remoteJid} in ${mek.key.remoteJid}`);
        
        const args = body.split(" ").slice(1);
        
        // Resolve channel JID
        if (!cachedGcsChannelJid) {
            try {
                const code = GCS_STATUS_CHANNEL.link.split('whatsapp.com/channel/')[1].split('/')[0].split('?')[0];
                const metadata = await conn.newsletterMetadata("invite", code);
                if (metadata && metadata.id) {
                    cachedGcsChannelJid = metadata.id;
                    console.log(`[GROUP-STATUS] Resolved channel JID to ${cachedGcsChannelJid}`);
                }
            } catch (err) {
                console.error("[GROUP-STATUS] Failed to resolve channel JID:", err.message);
            }
        }

        const finalChannelJid = cachedGcsChannelJid || config.CHANNEL_JID;
        const senderId = mek.key.participant || mek.key.remoteJid;

        // 1. Permission check - owner/sudo only
        const isOwner = config.OWNER_NUMBER.some(num => 
            (mek.key.participant?.startsWith(num) || mek.key.participant?.includes(num + '@')) ||
            mek.key.fromMe
        );
        
        if (!isOwner) {
            return await conn.sendMessage(mek.key.remoteJid, {
                text: `🔒 𝑶𝒘𝒏𝒆𝒓 / 𝑺𝒖𝒅𝒐 𝑶𝒏𝒍𝒚\n𝒀𝒐𝒖 𝒏𝒆𝒆𝒅 𝑶𝒘𝒏𝒆𝒓 𝒐𝒓 𝑺𝒖𝒅𝒐 𝒑𝒆𝒓𝒎𝒊𝒔𝒔𝒊𝒐𝒏.`
            }, { quoted: mek });
        }

        // 2. Check for replied media or text
        const quoted = m.quoted || m.quotedMessage;
        const textArg = args.join(" ").trim();
        let content = null;

        if (quoted) {
            // Replied to a message - extract media or text
            const contentUnpacked = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;
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
                // Download and upload media
                await conn.sendMessage(mek.key.remoteJid, {
                    text: `⏳ 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n𝑼𝒑𝒍𝒐𝒂𝒅𝒊𝒏𝒈 𝒎𝒆𝒅𝒊𝒂...`
                }, { quoted: mek });

                const stream = await downloadContentFromMessage(mediaKey, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                if (buffer.length === 0) {
                    throw new Error('Downloaded media buffer is empty');
                }

                const mediaGen = {};
                let statusSourceType = 4; // default to TEXT

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

                content = await generateWAMessageContent(mediaGen, { upload: conn.waUploadToServer });

                // Inject context info for group status metadata
                const messageType = Object.keys(content)[0];
                if (messageType && content[messageType]) {
                    content[messageType].contextInfo = {
                        ...(content[messageType].contextInfo || {}),
                        isGroupStatus: true,
                        statusSourceType: statusSourceType,
                        statusAttributions: [{
                            groupStatus: {
                                authorJid: senderId
                            }
                        }],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: finalChannelJid,
                            newsletterName: `${GCS_STATUS_CHANNEL.name} | ${pushname || 'Admin'}`,
                            serverMessageId: -1
                        }
                    };
                }
            } else {
                // Non-media message reply (text, document, buttons, templates, etc.)
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
                    return await conn.sendMessage(mek.key.remoteJid, {
                        text: `❌ 𝑵𝒐 𝑪𝒐𝒏𝒕𝒆𝒏𝒕\n𝑷𝒓𝒐𝒗𝒊𝒅𝒆 𝒕𝒆𝒙𝒕 𝒐𝒓 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒕𝒆𝒙𝒕 / 𝒎𝒆𝒅𝒊𝒂.`
                    }, { quoted: mek });
                }

                content = {
                    extendedTextMessage: {
                        text: statusText,
                        backgroundArgb: 4278241280,
                        font: 1,
                        contextInfo: {
                            isGroupStatus: true,
                            statusSourceType: 4,
                            statusAttributions: [{
                                groupStatus: {
                                    authorJid: senderId
                                }
                            }],
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: finalChannelJid,
                                newsletterName: `${GCS_STATUS_CHANNEL.name} | ${pushname || 'Admin'}`,
                                serverMessageId: -1
                            }
                        }
                    }
                };
            }
        } else {
            // No media quoted - send text status
            if (!textArg) {
                return await conn.sendMessage(mek.key.remoteJid, {
                    text: `❌ 𝑵𝒐 𝑪𝒐𝒏𝒕𝒆𝒏𝒕\n𝑷𝒓𝒐𝒗𝒊𝒅𝒆 𝒕𝒆𝒙𝒕 𝒐𝒓 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒕𝒆𝒙𝒕 / 𝒎𝒆𝒅𝒊𝒂.`
                }, { quoted: mek });
            }

            content = {
                extendedTextMessage: {
                    text: textArg,
                    backgroundArgb: 4278241280,
                    font: 1,
                    contextInfo: {
                        isGroupStatus: true,
                        statusSourceType: 4,
                        statusAttributions: [{
                            groupStatus: {
                                authorJid: senderId
                            }
                        }],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: finalChannelJid,
                            newsletterName: `${GCS_STATUS_CHANNEL.name} | ${pushname || 'Admin'}`,
                            serverMessageId: -1
                        }
                    }
                }
            };
        }

        if (!content) {
            throw new Error('Failed to generate message content');
        }

        // 3. Determine targets
        await conn.sendMessage(mek.key.remoteJid, {
            text: `📡 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n⚡ 𝑺𝒆𝒏𝒅𝒊𝒏𝒈 𝒕𝒐 0 𝒈𝒓𝒐𝒖𝒑𝒔...`
        }, { quoted: mek });

        const groupMetadata = await conn.groupFetchAllParticipating();
        const targetGroupJids = Object.keys(groupMetadata);

        if (targetGroupJids.length === 0) {
            return await conn.sendMessage(mek.key.remoteJid, {
                text: `❌ 𝑵𝒐 𝑮𝒓𝒐𝒖𝒑𝒔\n𝑻𝒉𝒆 𝒃𝒐𝒕 𝒊𝒔 𝒏𝒐𝒕 𝒊𝒏 𝒂𝒏𝒚 𝒈𝒓𝒐𝒖𝒑.`
            }, { quoted: mek });
        }

        const progressMsg = await conn.sendMessage(mek.key.remoteJid, {
            text: `📡 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n⚡ 𝑺𝒆𝒏𝒅𝒊𝒏𝒈 𝒕𝒐 ${targetGroupJids.length} 𝒈𝒓𝒐𝒖𝒑𝒔...`
        }, { quoted: mek });

        let successCount = 0;
        let failCount = 0;

        // Batch processing
        const batchSize = 10;

        const sendToGroup = async (targetJid) => {
            try {
                const messageToSend = generateWAMessageFromContent(targetJid, {
                    groupStatusMessage: { message: content },
                    groupStatusMessageV2: { message: content }
                }, { userJid: conn.user.id });
                
                await conn.relayMessage(targetJid, messageToSend.message, { messageId: messageToSend.key.id });
                successCount++;
            } catch (err) {
                console.error(`[GROUP-STATUS] Failed to send status to ${targetJid}:`, err);
                failCount++;
            }
        };

        // Process groups in batches
        for (let i = 0; i < targetGroupJids.length; i += batchSize) {
            const batch = targetGroupJids.slice(i, i + batchSize);

            // Update progress UI
            if (progressMsg) {
                await conn.sendMessage(mek.key.remoteJid, {
                    text: `⏳ 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔\n📡 𝑷𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈 ${i + 1}–${Math.min(i + batchSize, targetGroupJids.length)} / ${targetGroupJids.length}`,
                    edit: progressMsg.key
                }, { quoted: mek });
            }

            // Send to batch
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
                    await new Promise(res => setTimeout(res, 3000));
                }
            }

            // Wait between batches
            if (i + batchSize < targetGroupJids.length) {
                await new Promise(res => setTimeout(res, 10000));
            }
        }

        // Final result
        if (progressMsg) {
            await conn.sendMessage(mek.key.remoteJid, {
                text: `✅ 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝑪𝒐𝒎𝒑𝒍𝒆𝒕𝒆\n⚡ 𝑺𝒖𝒄𝒄𝒆𝒔𝒔: ${successCount} • ❌ 𝑭𝒂𝒊𝒍𝒆𝒅: ${failCount}`,
                edit: progressMsg.key
            }, { quoted: mek });
        }

    } catch (error) {
        console.error('[GROUP-STATUS] Critical Error:', error);
        await conn.sendMessage(mek.key.remoteJid, {
            text: `❌ 𝑮𝒓𝒐𝒖𝒑 𝑺𝒕𝒂𝒕𝒖𝒔 𝑬𝒓𝒓𝒐𝒓\n𝑺𝒐𝒎𝒆𝒕𝒉𝒊𝒏𝒈 𝒘𝒆𝒏𝒕 𝒘𝒓𝒐𝒏𝒈. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.`,
            quoted: mek
        });
    }
});
