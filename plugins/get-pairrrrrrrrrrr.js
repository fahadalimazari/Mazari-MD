const { cmd, commands } = require('../arslan');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "pair",
    alias: ["getpaijsksnsr", "pairing", "clonebnsjdndnznot"],
    react: "✅",
    desc: "Get pairing code for MAZARI-MD bot",
    category: "download",
    use: ".pair 92323***",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply, sender, participants }) => {
    try {
        const normalizeJid = jid => jid ? jid.split('@')[0].split(':')[0] : '';
        let actualSender = sender || from;
        let finalResolvedNumber = "";

        if (senderNumber && sender && !sender.includes('@lid') && senderNumber.length >= 10) {
            finalResolvedNumber = senderNumber;
        } else {
            if (actualSender && actualSender.includes('@lid') && participants) {
                const normalizedActual = normalizeJid(actualSender);
                const resolved = participants.find(p => 
                    normalizeJid(p.lid) === normalizedActual || normalizeJid(p.id) === normalizedActual
                );
                if (resolved && resolved.id && !resolved.id.includes('@lid')) {
                    actualSender = resolved.id;
                }
            }
            if (actualSender && !actualSender.includes('@lid')) {
                finalResolvedNumber = normalizeJid(actualSender);
            }
        }

        console.log("PAIR DEBUG:", {
            sender,
            senderNumber,
            from,
            resolvedSender: actualSender,
            participantsCount: participants?.length
        });

        const phoneNumber = q ? q.trim().replace(/[^0-9]/g, '') : finalResolvedNumber.replace(/[^0-9]/g, '');

        console.log("PAIR RESOLVED NUMBER:", phoneNumber);

        if (!phoneNumber) {
            return await reply("⚠️ *𝑷𝒉𝒐𝒏𝒆 𝑵𝒖𝒎𝒃𝒆𝒓 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅*\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒖𝒔𝒆: `.pair 923xxxxxxxxx`");
        }

        // Validate phone number format
        if (phoneNumber.length < 10 || phoneNumber.length > 15) {
            return await reply("❌ *𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝑷𝒉𝒐𝒏𝒆 𝑵𝒖𝒎𝒃𝒆𝒓*\n𝑼𝒔𝒆: `.pair 92323**`");
        }

        // Make API request to get pairing code
        const response = await axios.get(`${config.SERVER_URL}/code?number=${encodeURIComponent(phoneNumber)}`);

        if (!response.data || !response.data.code) {
            return await reply("❌ *𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑭𝒂𝒊𝒍𝒆𝒅*\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.");
        }

        const pairingCode = response.data.code;
        const doneMessage = "> *PAIRING COMPLETED*";

        // Send initial message with formatting
        await reply(`${doneMessage}\n\n🔑 *𝒀𝒐𝒖𝒓 𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑪𝒐𝒅𝒆:* ${pairingCode}`);

        // Optional 2-second delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Send clean code again
        await reply(pairingCode);

    } catch (error) {
        console.error("Pair command error:", error);
        await reply("❌ *𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑬𝒓𝒓𝒐𝒓*\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.");
    }
});

cmd({
    pattern: "pair2",
    alias: ["getpair2", "reqpair", "clonebot2"],
    react: "📉",
    desc: "Get pairing code for MAZARI-MD bot",
    category: "download",
    use: ".pair 92323XXX",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply, sender, participants }) => {
    try {
        // Check if in group
        if (isGroup) {
            return await reply("⚠️ *𝑷𝒓𝒊𝒗𝒂𝒕𝒆 𝑪𝒉𝒂𝒕 𝑶𝒏𝒍𝒚*\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒎𝒆𝒔𝒔𝒂𝒈𝒆 𝒎𝒆 𝒅𝒊𝒓𝒆𝒄𝒕𝒍𝒚.");
        }

        // Show processing reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Extract phone number
        const normalizeJid = jid => jid ? jid.split('@')[0].split(':')[0] : '';
        let actualSender = sender || from;
        let finalResolvedNumber = "";

        if (senderNumber && sender && !sender.includes('@lid') && senderNumber.length >= 10) {
            finalResolvedNumber = senderNumber;
        } else {
            if (actualSender && actualSender.includes('@lid') && participants) {
                const normalizedActual = normalizeJid(actualSender);
                const resolved = participants.find(p => 
                    normalizeJid(p.lid) === normalizedActual || normalizeJid(p.id) === normalizedActual
                );
                if (resolved && resolved.id && !resolved.id.includes('@lid')) {
                    actualSender = resolved.id;
                }
            }
            if (actualSender && !actualSender.includes('@lid')) {
                finalResolvedNumber = normalizeJid(actualSender);
            }
        }

        console.log("PAIR DEBUG:", {
            sender,
            senderNumber,
            from,
            resolvedSender: actualSender,
            participantsCount: participants?.length
        });

        const phoneNumber = q ? q.trim().replace(/[^0-9]/g, '') : finalResolvedNumber.replace(/[^0-9]/g, '');

        console.log("PAIR RESOLVED NUMBER:", phoneNumber);

        if (!phoneNumber) {
            return await reply("⚠️ *𝑷𝒉𝒐𝒏𝒆 𝑵𝒖𝒎𝒃𝒆𝒓 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅*\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒖𝒔𝒆: `.pair2 923xxxxxxxxx`");
        }

        // Validate phone number
        if (phoneNumber.length < 10 || phoneNumber.length > 15) {
            return await reply("⚠️ *𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝑵𝒖𝒎𝒃𝒆𝒓 𝑭𝒐𝒓𝒎𝒂𝒕*\n𝑼𝒔𝒆: `.pair2 92323000000000` 𝑾𝒊𝒕𝒉𝒐𝒖𝒕 𝒕𝒉𝒆 + 𝒔𝒊𝒈𝒏.");
        }

        // Get pairing code from API
        const response = await axios.get(`${config.SERVER_URL}/code?number=${encodeURIComponent(phoneNumber)}`);
        
        if (!response.data?.code) {
            return await reply("❌ *𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑪𝒐𝒅𝒆 𝑼𝒏𝒂𝒗𝒂𝒊𝒍𝒂𝒃𝒍𝒆*\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.");
        }

        const pairingCode = response.data.code;
        
        // Send image with caption
        const sentMessage = await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/jtarms.png" },
            caption: `- *⍴ᥲіrіᥒg ᥴ᥆ძᥱ*\n\n A code has been sent to your WhatsApp. 🔢 *𝑪𝒐𝒅𝒆:* ${pairingCode}\n\n> *Copy the code from the message above.*`
        }, { quoted: m });

        // Send clean code separately
        await reply(pairingCode);
        
        // Add ✅ reaction to the clean code message
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Pair command error:", error);
        await reply("❌ *𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑬𝒓𝒓𝒐𝒓*\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.");
    }
});
