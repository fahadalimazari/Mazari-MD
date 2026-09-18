const { cmd } = require("../arslan");
const config = require("../config");

cmd({
    pattern: "alive2",
    desc: "Check if the bot is active.",
    category: "owner",
    react: "💡",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        const pushname = m.pushName || "User";
        const currentTime = moment().format("HH:mm:ss");
        const currentDate = moment().format("dddd, MMMM Do YYYY");

        const runtimeMilliseconds = Date.now() - botStartTime;
        const runtimeSeconds = Math.floor((runtimeMilliseconds / 1000) % 60);
        const runtimeMinutes = Math.floor((runtimeMilliseconds / (1000 * 60)) % 60);
        const runtimeHours = Math.floor(runtimeMilliseconds / (1000 * 60 * 60));

        const formattedInfo = `
╭┄┄┄┄[ *MAZARI-MD status* ]┄┄┄┄
┊
┊     Hi 🫵🏽 ${pushname}
┊
┊🕒 *ᴛɪᴍᴇ*: ${currentTime}
┊📅 *ᴅᴀᴛᴇ*: ${currentDate}
┊⏳ *ᴜᴘᴛɪᴍᴇ*: ${runtimeHours} hours, ${runtimeMinutes} minutes, ${runtimeSeconds} seconds
╰───────────────

> 🤖 *Status*: *MAZARI-MD-MINI is Alive and Ready!*

🎉 *Enjoy the Service!*
        `.trim();

        // Check if the image is defined
        if (!ALIVE_IMG || !ALIVE_IMG.startsWith("http")) {
            throw new Error("Invalid ALIVE_IMG URL. Please set a valid image URL.");
        }

        // Send the message with image and caption
        await conn.sendMessage(from, {
            image: { url: ALIVE_IMG },
            caption: formattedInfo,
            contextInfo: {
                mentionedJid: [m.sender]
            }
        });

    } catch (error) {
        console.error("Error in alive command: ", error);
        
        // Respond with error details 
        const errorMessage = `
❌ *𝑨𝒍𝒊𝒗𝒆 𝑪𝒉𝒆𝒄𝒌 𝑭𝒂𝒊𝒍𝒆𝒅*
🛠️ *𝑬𝒓𝒓𝒐𝒓:*
${error.message}

𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.
        `.trim();
        return reply(errorMessage);
    }
});
