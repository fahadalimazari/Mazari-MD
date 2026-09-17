// ============================================
// 📢 GCS STATUS - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 📢 Broadcast status to all groups in the current session
// ============================================

const { cmd } = require('../arslan');
const { proto } = require('@whiskeysockets/baileys/WAProto');
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
                // Ensure bot's own JID is in the list to see its own status
                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                if (!participants.includes(botJid)) participants.push(botJid);
                
                console.log(`[GCS-STATUS][${reqId}] Target ${targetIndex}/${eligibleJids.length}: ${jid} | Subject: ${groupName} | Participants: ${participants.length}`);

                // Clone the exact quoted message content to preserve ALL metadata (links, thumbnails, etc.)
                const messageOverride = JSON.parse(JSON.stringify(content));
                
                // If it's a raw conversation string, convert it to extendedTextMessage
                if (messageOverride.conversation) {
                    messageOverride.extendedTextMessage = { text: messageOverride.conversation };
                    delete messageOverride.conversation;
                }

                // 🌟 CORRECT GROUP STATUS STRUCTURE
                // According to WhatsApp protocol:
                // Group Status uses groupStatusMessage (FutureProofMessage type)
                // Sent to status@broadcast with statusJidList containing group members
                const finalPayload = {
                    groupStatusMessage: {
                        message: messageOverride
                    }
                };

                // Generate message for status broadcast
                const msg = generateWAMessageFromContent('status@broadcast', finalPayload, { userJid: sock.user.id });
                
                // 🔍 DIAGNOSTIC: Inspect exact outgoing message structure
                if (targetIndex === 1) {
                    console.log(`\n=== 📊 DIAGNOSTIC PAYLOAD STRUCTURE ===`);
                    
                    // 1. Message key
                    console.log(`1. MESSAGE KEY:`);
                    console.log(`   remoteJid: ${msg.key.remoteJid}`);
                    console.log(`   fromMe: ${msg.key.fromMe}`);
                    console.log(`   id: ${msg.key.id}`);
                    
                    // 2. Top-level message structure
                    console.log(`\n2. TOP-LEVEL MESSAGE STRUCTURE:`);
                    const msgObj = msg.message;
                    console.log(`   Keys: ${Object.keys(msgObj).join(', ')}`);
                    
                    // 3. groupStatusMessage verification
                    console.log(`\n3. GROUP STATUS VERIFICATION:`);
                    console.log(`   has groupStatusMessage: ${!!msgObj.groupStatusMessage}`);
                    if (msgObj.groupStatusMessage) {
                        console.log(`   groupStatusMessage keys: ${Object.keys(msgObj.groupStatusMessage).join(', ')}`);
                        console.log(`   groupStatusMessage has 'message': ${!!msgObj.groupStatusMessage.message}`);
                        
                        if (msgObj.groupStatusMessage.message) {
                            console.log(`\n4. NESTED MESSAGE STRUCTURE:`);
                            const nestedMsg = msgObj.groupStatusMessage.message;
                            console.log(`   Nested message keys: ${Object.keys(nestedMsg).join(', ')}`);
                            
                            // 5. Extract actual content type
                            const innerType = Object.keys(nestedMsg).find(k => k.includes('Message') && k !== 'messageContextInfo');
                            console.log(`   Inner content type: ${innerType || 'NONE'}`);
                            
                            if (innerType && nestedMsg[innerType]) {
                                const content = nestedMsg[innerType];
                                console.log(`\n5. CONTENT DETAILS:`);
                                console.log(`   Has text: ${!!content.text}`);
                                console.log(`   Has contextInfo: ${!!content.contextInfo}`);
                                
                                if (content.contextInfo) {
                                    console.log(`\n6. CONTEXT INFO:`);
                                    console.log(`   isGroupStatus: ${content.contextInfo.isGroupStatus}`);
                                    console.log(`   groupMentions count: ${content.contextInfo.groupMentions?.length || 0}`);
                                    if (content.contextInfo.groupMentions?.[0]) {
                                        console.log(`   First groupMention groupJid: ${content.contextInfo.groupMentions[0].groupJid}`);
                                        console.log(`   First groupMention groupSubject: ${content.contextInfo.groupMentions[0].groupSubject}`);
                                    }
                                }
                                
                                // 7. Preview/link details
                                if (content.linkPreview) {
                                    console.log(`\n7. LINK PREVIEW:`);
                                    console.log(`   has linkPreview: true`);
                                    console.log(`   description: ${content.description ? 'present' : 'missing'}`);
                                    console.log(`   title: ${content.title ? 'present' : 'missing'}`);
                                    console.log(`   jpegThumbnail: ${content.jpegThumbnail ? 'present' : 'missing'}`);
                                }
                            }
                        }
                    }
                    
                    // 8. Verify statusJidList format (anonymized)
                    console.log(`\n8. STATUS JID LIST VERIFICATION:`);
                    console.log(`   statusJidList length: ${participants.length}`);
                    console.log(`   Sample JIDs (anonymized): ${participants.slice(0, 3).map(jid => jid.replace(/\d/g, 'X')).join(', ')}`);
                    console.log(`   Is group JID: ${jid}`);
                    console.log(`   Bot own JID included: ${participants.includes(botJid)}`);
                    
                    // 9. Complete message structure for debugging
                    console.log(`\n9. COMPLETE MESSAGE STRUCTURE (safe representation):`);
                    console.log(`   ${JSON.stringify(msgObj, null, 2)}`);
                    
                    console.log(`\n=== DIAGNOSTIC END ===\n`);
                }
                
                // 10. Verify relayMessage inputs
                console.log(`\n[DIAGNOSTIC] relayMessage inputs:`);
                console.log(`   Target: status@broadcast`);
                console.log(`   Message key: ${msg.key.id}`);
                console.log(`   statusJidList count: ${participants.length}`);
                console.log(`   statusJidList sample: ${participants.slice(0, 3).map(jid => jid.split('@')[0]).join(', ')}...`);
                
                // Send to status@broadcast with group members in statusJidList
                await sock.relayMessage('status@broadcast', msg.message, { 
                    messageId: msg.key.id,
                    statusJidList: participants
                });
                
                console.log(`[GCS-STATUS][${reqId}] Group Status relay: SUCCESS for ${jid}`);
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
