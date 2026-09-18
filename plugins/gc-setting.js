const { sleep } = require('../lib/functions');
const config = require('../config');
const { cmd } = require("../arslan");


// Command to list all pending group join requests
cmd({
    pattern: "requestlist",
    desc: "Shows pending group join requests",
    category: "group",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ I need to be an admin to view join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (requests.length === 0) {
            await conn.sendMessage(from, {
                react: { text: 'ℹ️', key: m.key }
            });
            return reply("ℹ️ No pending join requests.");
        }

        let text = `📋 *Pending Join Requests (${requests.length})*\n\n`;
        requests.forEach((user, i) => {
            text += `${i+1}. @${user.jid.split('@')[0]}\n`;
        });

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });
        return reply(text, { mentions: requests.map(u => u.jid) });
    } catch (error) {
        console.error("Request list error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to fetch join requests.");
    }
});

// Command to approve N pending join requests
cmd({
    pattern: "approved",
    alias: ["approve", "appr", "approv"],
    desc: "Approve a specific number of pending group join requests",
    category: "admin",
    react: "✅",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isAdmins, isOwner, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ 𝑮𝒓𝒐𝒖𝒑𝒔 𝑶𝒏𝒍𝒚\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔 𝒐𝒏𝒍𝒚.");
        if (!isAdmins && !isOwner) return reply("🔒 𝑨𝒅𝒎𝒊𝒏 𝑶𝒏𝒍𝒚\n> 𝑨𝒅𝒎𝒊𝒏 𝒑𝒆𝒓𝒎𝒊𝒔𝒔𝒊𝒐𝒏 𝒓𝒆𝒒𝒖𝒊𝒓𝒆𝒅.");
        if (!isBotAdmins) return reply("🛡️ 𝑩𝒐𝒕 𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅\n> 𝑴𝒂𝒌𝒆 𝒃𝒐𝒕 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏 𝒇𝒊𝒓𝒔𝒕.");
        
        const numArgs = parseInt(args[0]);
        if (!numArgs || isNaN(numArgs) || numArgs <= 0) {
            return reply(`⚠️ 𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n> 𝑼𝒔𝒆 : .approved <number>`);
        }

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) {
            return reply("⚠️ 𝑵𝒐 𝑷𝒆𝒏𝒅𝒊𝒏𝒈 𝑹𝒆𝒒𝒖𝒆𝒔𝒕𝒔\n> 𝑻𝒉𝒆𝒓𝒆 𝒂𝒓𝒆 𝒏𝒐 𝒓𝒆𝒒𝒖𝒆𝒔𝒕𝒔 𝒕𝒐 𝒂𝒑𝒑𝒓𝒐𝒗𝒆.");
        }

        const countToApprove = Math.min(numArgs, requests.length);
        const jidsToApprove = requests.slice(0, countToApprove).map(u => u.jid);
        
        await conn.groupRequestParticipantsUpdate(from, jidsToApprove, "approve");
        
        return reply(`✅ 𝑹𝒆𝒒𝒖𝒆𝒔𝒕𝒔 𝑨𝒑𝒑𝒓𝒐𝒗𝒆𝒅\n> 𝑨𝒑𝒑𝒓𝒐𝒗𝒆𝒅 : ${countToApprove}`);
    } catch (error) {
        console.error("Approved command error:", error);
        return reply("❌ Failed to approve join requests.");
    }
});

// Command to accept all pending join requests
cmd({
    pattern: "acceptall",
    desc: "Accepts all pending group join requests",
    category: "group",
    react: "✅",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ I need to be an admin to accept join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (requests.length === 0) {
            await conn.sendMessage(from, {
                react: { text: 'ℹ️', key: m.key }
            });
            return reply("ℹ️ No pending join requests to accept.");
        }

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "approve");
        
        await conn.sendMessage(from, {
            react: { text: '👍', key: m.key }
        });
        return reply(`✅ Successfully accepted ${requests.length} join requests.`);
    } catch (error) {
        console.error("Accept all error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to accept join requests.");
    }
});

// Command to reject all pending join requests
cmd({
    pattern: "rejectall",
    desc: "Rejects all pending group join requests",
    category: "group",
    react: "❌",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ I need to be an admin to reject join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (requests.length === 0) {
            await conn.sendMessage(from, {
                react: { text: 'ℹ️', key: m.key }
            });
            return reply("ℹ️ No pending join requests to reject.");
        }

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "reject");
        
        await conn.sendMessage(from, {
            react: { text: '👎', key: m.key }
        });
        return reply(`✅ Successfully rejected ${requests.length} join requests.`);
    } catch (error) {
        console.error("Reject all error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to reject join requests.");
    }
});

// ==================== FIXED KICK COMMAND ====================
cmd({
    pattern: "kick",
    alias: ["remove","k"],
    desc: "Remove a group member",
    category: "admin",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isOwner, isBotAdmins, reply, mentionedJid }) => {
    try {
        if (!isGroup) return reply("❌ This command only works in groups.");
        
        // Allow command if sender is admin or owner
        if (!isAdmins && !isOwner) return reply("❌ You don't have permission to use this command.");

        // Correctly check if the BOT is admin using the robust `isBotAdmins` calculated by the handler (handles LIDs correctly)
        if (!isBotAdmins) return reply("❌ Only group admins can use this command.");

        const msgType = mek.message?.extendedTextMessage ? 'extendedTextMessage' : 
                        mek.message?.imageMessage ? 'imageMessage' : 
                        mek.message?.videoMessage ? 'videoMessage' : null;
        
        const contextInfo = msgType ? mek.message[msgType].contextInfo : null;

        // Priority 1: Mentioned user. Priority 2: Replied message sender
        let target = mentionedJid?.[0] || contextInfo?.mentionedJid?.[0];
        
        if (!target && contextInfo?.participant) {
            target = contextInfo.participant;
        }

        if (!target) return reply("❌ Reply to a message or mention a user!");

        // Execute kick
        await conn.groupParticipantsUpdate(from, [target], "remove");
        
        // Delete the command message itself (silent behavior)
        conn.sendMessage(from, { delete: mek.key }).catch(() => {});

        // If it was a reply and the target is the replied sender, delete their original message
        if (contextInfo?.stanzaId && contextInfo?.participant && target === contextInfo.participant) {
            conn.sendMessage(from, { 
                delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant
                }
            }).catch(() => {});
        }

    } catch (error) {
        console.error("Kick error:", error);
    }
});


// ==================== FIXED REMOVEADMINS COMMAND ====================
cmd({
    pattern: "removeadmins",
    alias: ["kickadmins", "kickall3", "deladmins"],
    desc: "Remove all admin members from the group, excluding the bot and bot owner.",
    react: "🎉",
    category: "group",
    filename: __filename,
}, 
async (conn, mek, m, {
    from, isGroup, senderNumber, groupMetadata, groupAdmins, isBotAdmins, reply, isCreator
}) => {
    try {
        if (!isGroup) return reply("This command can only be used in groups.");
        if (!isCreator) return reply("Only the bot owner can use this command.");
        if (!isBotAdmins) return reply("I need to be an admin to execute this command.");

        const botOwner = conn.user.id.split(":")[0];
        const allParticipants = groupMetadata.participants;
        const adminParticipants = allParticipants.filter(member => 
            groupAdmins.includes(member.id) && 
            member.id !== conn.user.id && 
            member.id !== `${botOwner}@s.whatsapp.net`
        );

        if (adminParticipants.length === 0) {
            return reply("There are no admin members to remove.");
        }

        reply(`Starting to remove ${adminParticipants.length} admin members...`);

        for (let participant of adminParticipants) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "remove");
                await sleep(2000);
            } catch (e) {
                console.error(`Failed to remove ${participant.id}:`, e);
            }
        }

        reply("Successfully removed all admin members from the group.");
    } catch (e) {
        console.error("Error removing admins:", e);
        reply("An error occurred while trying to remove admins.");
    }
});



// ==================== FIXED BOT ADMIN COMMAND ====================
cmd({
pattern: "botadmin",
alias: ["makebotadmin", "giveadminbot", "adminbot"],
desc: "Make bot admin in group",
category: "group",
react: "🤖",
filename: __filename
}, async (conn, mek, m, {
from,
isGroup,
reply,
isCreator,
isAdmins
}) => {
try {
    if (!isGroup) return reply("⚠️ This command only works in groups.");
    if (!isAdmins) return reply("❌ Only group admins can make bot admin!");

    // Check if bot is already admin  
    try {  
        const groupMetadata = await conn.groupMetadata(from);  
        const botParticipant = groupMetadata.participants.find(p => p.id === conn.user.id);  
        if (botParticipant && botParticipant.admin) {  
            return reply("✅ Bot is already admin in this group!");  
        }  
    } catch (e) {  
        console.log("Could not fetch group metadata, trying to promote bot...");  
    }  
    
    try {  
        await conn.groupParticipantsUpdate(from, [conn.user.id], "promote");  
        reply("*✅ Bot is now admin!*\n\n*You can now use:*\n• .promote @user\n• .demote @admin\n• .kick @user");  
    } catch (err) {  
        if (err.message.includes("not authorized")) {  
            reply(`*❌ Failed to make bot admin.*\n\n*Reason:* You don't have permission to make bot admin.\n\n*Manual method:*\n1. Go to group settings\n2. Click on "Group permissions"\n3. Go to "Add members"\n4. Find bot and manually make admin`);  
        } else {  
            reply("❌ Failed to make bot admin: " + err.message);  
        }  
    }

} catch (err) {
    console.error("Bot Admin Error:", err);
    reply("❌ Error in botadmin: " + err.message);
}
});

// ==================== FIXED ADD USER COMMAND ====================
cmd({
pattern: "add",
alias: ["adduser", "addmember"],
desc: "Add user to group",
category: "group",
react: "➕",
filename: __filename
}, async (conn, mek, m, {
from,
isGroup,
reply,
isCreator,
args = [],
mentionedJid,
text,
body,
isAdmins,
isBotAdmins
}) => {
try {
    if (!isGroup) return reply("⚠️ This command only works in groups.");
    if (!isAdmins) return reply("❌ Only group admins can add users!");
    if (!isBotAdmins) return reply("❌ Bot needs to be admin to add users!");

    let users = [];  
    
    if (mentionedJid && mentionedJid.length > 0) {  
        users = mentionedJid;  
    }  
    
    if (users.length === 0 && text) {  
        const textString = String(text || "").trim();  
        const directNumbers = textString.match(/\d{10,15}/g);  
        if (directNumbers) {  
            users = directNumbers.map(num => {  
                let cleanNum = num.replace(/\D/g, '');  
                if (cleanNum.startsWith('3')) {  
                    cleanNum = '92' + cleanNum;  
                }  
                if (cleanNum.length >= 10) {  
                    return cleanNum + '@s.whatsapp.net';  
                }  
                return null;  
            }).filter(Boolean);  
        }  
    }  
    
    if (users.length === 0) {  
        return reply(`❌ Please mention users or provide phone numbers!\n\nExamples:\n• .add @user\n• .add 923001234567`);  
    }  
    
    users = [...new Set(users)];  
    const validUsers = users.filter(user => {  
        const num = user.split('@')[0];  
        return num.length >= 10 && num.length <= 16;  
    });  
    
    if (validUsers.length === 0) {  
        return reply("❌ Invalid phone numbers!");  
    }  
    
    try {  
        await conn.groupParticipantsUpdate(from, validUsers, "add");  
        reply(`✅ ${validUsers.length} user(s) added to the group.`);  
    } catch (addError) {  
        if (addError.message.includes("not in contacts")) {  
            reply("❌ Some users are not in your contacts. Please add them first.");  
        } else {  
            reply("❌ Failed to add user: " + addError.message);  
        }  
    }

} catch (err) {
    console.error("Add Error:", err);
    reply("❌ Failed to add user: " + (err.message || "Check the numbers and try again"));
}
});


// ==================== FIXED HIDETAG COMMAND ====================
cmd({
  pattern: "hidetag",
  alias: ["tag", "h"],  
  react: "🔊",
  desc: "To Tag all Members for Any Message/Media",
  category: "group",
  use: '.hidetag Hello',
  filename: __filename
},
async (conn, mek, m, {
  from, q, isGroup, isCreator, isAdmins,
  participants, reply
}) => {
  try {
    const isUrl = (url) => {
      return /https?:\/\/(www\.)?[\w\-@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([\w\-@:%_\+.~#?&//=]*)/.test(url);
    };

    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

    const mentionAll = { mentions: participants.map(u => u.id) };

    if (!q && !m.quoted) {
      return reply("❌ Please provide a message or reply to a message.");
    }

    if (m.quoted) {
      const type = m.quoted.mtype || '';
      
      if (type === 'extendedTextMessage') {
        return await conn.sendMessage(from, {
          text: m.quoted.text || 'No message content found.',
          ...mentionAll
        }, { quoted: mek });
      }

      if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(type)) {
        try {
          const buffer = await m.quoted.download?.();
          if (!buffer) return reply("❌ Failed to download the quoted media.");

          let content;
          switch (type) {
            case "imageMessage":
              content = { image: buffer, caption: m.quoted.text || "📷 Image", ...mentionAll };
              break;
            case "videoMessage":
              content = { 
                video: buffer, 
                caption: m.quoted.text || "🎥 Video", 
                gifPlayback: m.quoted.message?.videoMessage?.gifPlayback || false, 
                ...mentionAll 
              };
              break;
            case "audioMessage":
              content = { 
                audio: buffer, 
                mimetype: "audio/mp4", 
                ptt: m.quoted.message?.audioMessage?.ptt || false, 
                ...mentionAll 
              };
              break;
            case "stickerMessage":
              content = { sticker: buffer, ...mentionAll };
              break;
            case "documentMessage":
              content = {
                document: buffer,
                mimetype: m.quoted.message?.documentMessage?.mimetype || "application/octet-stream",
                fileName: m.quoted.message?.documentMessage?.fileName || "file",
                caption: m.quoted.text || "",
                ...mentionAll
              };
              break;
          }

          if (content) {
            return await conn.sendMessage(from, content);
          }
        } catch (e) {
          console.error("Media download/send error:", e);
          return reply("❌ Failed to process the media.");
        }
      }

      return await conn.sendMessage(from, {
        text: m.quoted.text || "📨 Message",
        ...mentionAll
      });
    }

    if (q) {
      if (isUrl(q)) {
        return await conn.sendMessage(from, {
          text: q,
          ...mentionAll
        });
      }

      await conn.sendMessage(from, {
        text: q,
        ...mentionAll
      });
    }

  } catch (e) {
    console.error(e);
    reply(`❌ *Error Occurred !!*\n\n${e.message}`);
  }
});

// ==================== FIXED ADMIN CHECK COMMAND ====================
cmd({
pattern: "admincheck",
alias: ["checkadmin", "admintest"],
desc: "Check admin status",
category: "group",
react: "🔍",
filename: __filename
}, async (conn, mek, m, {
from,
isGroup,
reply,
sender,
isCreator,
participants,
isAdmins,
isBotAdmins
}) => {
try {
    if (!isGroup) return reply("⚠️ This command only works in groups.");

    let message = `👑 *Admin Status Check*\n\n`;  
    message += `👤 You: @${sender.split('@')[0]}\n`;  
    message += `🤖 Bot Owner: ${isCreator ? '✅ YES' : '❌ NO'}\n`;  
    message += `👑 You Admin: ${isAdmins ? '✅ YES' : '❌ NO'}\n`;  
    message += `🤖 Bot Admin: ${isBotAdmins ? '✅ YES' : '❌ NO'}\n\n`;  
    
    try {  
        const groupMetadata = await conn.groupMetadata(from);  
        message += `👥 Total Members: ${groupMetadata.participants.length}\n\n`;  
        
        if (!isBotAdmins) {  
            message += `⚠️ *Bot is not admin!*\nUse: .botadmin\nOr manually promote bot to admin.`;  
        } else {  
            message += `✅ *Bot is admin!*\nYou can use:\n• .promote @user\n• .demote @admin\n• .kick @user\n• .add @user`;  
        }  
    } catch (metadataError) {  
        message += `❌ Cannot fetch group details.\n`;  
    }  
    
    await conn.sendMessage(from, {  
        text: message,  
        mentions: [sender]  
    }, { quoted: mek });

} catch (err) {
    console.error("Admin Check Error:", err);
    reply("❌ Error in admin check: " + err.message);
}
});

// ==================== ALL GROUP MEMBERS KICK ====================
cmd({
    pattern: "end",
    alias: ["byeall", "kickall", "fuckall"],
    desc: "Kick all group members and all other admins",
    category: "admin",
    react: "⚠️",
    filename: __filename
},
async (conn, mek, m, {
    from, isGroup, isBotAdmins, isAdmins, isOwner, reply, groupMetadata, sender
}) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins && !isOwner) return reply("❌ You don't have permission to use this command.");
    if (!isBotAdmins) return reply("❌ I need to be *admin* to use this command.");

    try {
        const participants = groupMetadata.participants || [];
        const { jidNormalizedUser } = require('@whiskeysockets/baileys');
        
        const botExclusions = new Set();
        
        if (conn.user) {
            if (conn.user.id) botExclusions.add(jidNormalizedUser(conn.user.id));
            if (conn.user.lid) botExclusions.add(jidNormalizedUser(conn.user.lid));
        }
        if (conn.authState?.creds?.me) {
            if (conn.authState.creds.me.id) botExclusions.add(jidNormalizedUser(conn.authState.creds.me.id));
            if (conn.authState.creds.me.lid) botExclusions.add(jidNormalizedUser(conn.authState.creds.me.lid));
        }
        if (conn.authState?.creds?.account) {
            if (conn.authState.creds.account.id) botExclusions.add(jidNormalizedUser(conn.authState.creds.account.id));
            if (conn.authState.creds.account.lid) botExclusions.add(jidNormalizedUser(conn.authState.creds.account.lid));
        }

        const config = require('../config');
        const owners = config.OWNER_NUMBER ? (Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : config.OWNER_NUMBER.split(',')) : [];

        const targetsToKick = [];
        const senderJid = sender ? jidNormalizedUser(sender) : null;

        for (let p of participants) {
            const pJid = jidNormalizedUser(p.id);
            const pNumber = pJid.split('@')[0].split(':')[0];

            if (botExclusions.has(pJid)) continue;
            if (senderJid && pJid === senderJid) continue;
            if (owners.includes(pNumber)) continue;

            targetsToKick.push(pJid);
        }

        console.log("[ALL KICK] Bot Exclusions:", Array.from(botExclusions));
        console.log("[ALL KICK] Sender:", senderJid);
        console.log("[ALL KICK] Target Count:", targetsToKick.length);

        if (targetsToKick.length === 0) {
            return reply("✅ No valid members to kick.");
        }

        await reply(`⚠️ Attempting to kick ${targetsToKick.length} members...`);

        const kickPromises = targetsToKick.map(async (jid) => {
            try {
                await conn.groupParticipantsUpdate(from, [jid], "remove");
                return { success: true };
            } catch (err) {
                return { success: false };
            }
        });

        const results = await Promise.all(kickPromises);
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        let resultMsg = `✅ *𝑲𝒊𝒄𝒌 𝑨𝒍𝒍 𝑪𝒐𝒎𝒑𝒍𝒆𝒕𝒆*\n`;
        resultMsg += `𝑲𝒊𝒄𝒌𝒆𝒅: ${successCount} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n`;
        if (failCount > 0) {
            resultMsg += `𝑭𝒂𝒊𝒍𝒆𝒅: ${failCount} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n`;
        }
        resultMsg += `\n> 👑 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑴𝑨𝒁𝑨𝑹𝑰`;

        reply(resultMsg);

    } catch (error) {
        console.error("End command error:", error);
        reply("❌ Failed to execute command. Error: " + error.message);
    }
});
// ==================== FIXED LEAVE COMMAND ====================
cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "leavegc"],
    desc: "Leave the group",
    react: "🎉",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, {
    from, isGroup, isCreator, reply
}) => {
    try {
        if (!isGroup) {
            return reply("❗ This command can only be used in *groups*.");
        }

        if (!isCreator) {
            return reply("❗ This command can only be used by my *owner*.");
        }

        await reply(`👋 *Goodbye everyone!*  
I am leaving the group now.  
Thanks for having me here! ❤️`);

        await sleep(1500);
        await conn.groupLeave(from);

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
