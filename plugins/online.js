const { cmd } = require('../arslan');

cmd({
    pattern: "online",
    alias: ["whosonline", "onlinemembers"],
    desc: "Check who's online in the group (Admins & Owner only)",
    category: "group",
    react: "🟢",
    filename: __filename
},
async (conn, mek, m, { from, quoted, isGroup, isAdmins, isCreator, fromMe, reply }) => {
    try {
        // Check if the command is used in a group
        if (!isGroup) return reply("❌ 𝑮𝒓𝒐𝒖𝒑𝒔 𝑶𝒏𝒍𝒚\n\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔 𝒐𝒏𝒍𝒚.");

        // Check if user is either creator or admin
        if (!isCreator && !isAdmins && !fromMe) {
            return reply("🔒 𝑨𝒅𝒎𝒊𝒏 𝑶𝒏𝒍𝒚\n\n> 𝑶𝒏𝒍𝒚 𝒂𝒅𝒎𝒊𝒏𝒔 𝒐𝒓 𝒐𝒘𝒏𝒆𝒓 𝒄𝒂𝒏 𝒖𝒔𝒆 𝒕𝒉𝒊𝒔.");
        }

        // Inform user that we're checking
        await reply("⏳ 𝑶𝒏𝒍𝒊𝒏𝒆 𝑪𝒉𝒆𝒄𝒌\n\n> 𝑪𝒉𝒆𝒄𝒌𝒊𝒏𝒈 𝒈𝒓𝒐𝒖𝒑 𝒎𝒆𝒎𝒃𝒆𝒓𝒔...");

        const onlineMembers = new Set();
        const groupData = await conn.groupMetadata(from);
        const presencePromises = [];

        // Request presence updates for all participants
        for (const participant of groupData.participants) {
            presencePromises.push(
                conn.presenceSubscribe(participant.id)
                    .then(() => {
                        // Additional check for better detection
                        return conn.sendPresenceUpdate('composing', participant.id);
                    })
            );
        }

        await Promise.all(presencePromises);

        // Presence update handler
        const presenceHandler = (json) => {
            for (const id in json.presences) {
                const presence = json.presences[id]?.lastKnownPresence;
                // Check all possible online states
                if (['available', 'composing', 'recording', 'online'].includes(presence)) {
                    onlineMembers.add(id);
                }
            }
        };

        conn.ev.on('presence.update', presenceHandler);

        // Longer timeout and multiple checks
        const checks = 3;
        const checkInterval = 5000; // 5 seconds
        let checksDone = 0;

        const checkOnline = async () => {
            checksDone++;
            
            if (checksDone >= checks) {
                clearInterval(interval);
                conn.ev.off('presence.update', presenceHandler);
                
                if (onlineMembers.size === 0) {
                    return reply("⚠️ 𝑵𝒐 𝑶𝒏𝒍𝒊𝒏𝒆 𝑴𝒆𝒎𝒃𝒆𝒓𝒔\n\n> 𝑵𝒐 𝒐𝒏𝒍𝒊𝒏𝒆 𝒎𝒆𝒎𝒃𝒆𝒓𝒔 𝒅𝒆𝒕𝒆𝒄𝒕𝒆𝒅.");
                }
                
                const onlineArray = Array.from(onlineMembers);
                const onlineList = onlineArray.map((member, index) => 
                    `┃ ${index + 1}. @${member.split('@')[0]}`
                ).join('\n');
                
                const message = `╭━━━〔 🟢 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷
┃
┃ 👥 ✦ 𝑶𝑵𝑳𝑰𝑵𝑬 𝑴𝑬𝑴𝑩𝑬𝑹𝑺
┃
┃ 📊 ✦ 𝑶𝑵𝑳𝑰𝑵𝑬 : ${onlineArray.length}/${groupData.participants.length}
┃
┃
${onlineList}
┃
╰━━━━━━━━━━━━━━━━━━━━⊷`;
                
                await conn.sendMessage(from, { 
                    text: message,
                    mentions: onlineArray
                }, { quoted: mek });
            }
        };

        const interval = setInterval(checkOnline, checkInterval);

    } catch (e) {
        console.error("Error in online command:", e);
        reply("❌ 𝑶𝒏𝒍𝒊𝒏𝒆 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑺𝒐𝒎𝒆𝒕𝒉𝒊𝒏𝒈 𝒘𝒆𝒏𝒕 𝒘𝒓𝒐𝒏𝒈. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.");
    }
});
