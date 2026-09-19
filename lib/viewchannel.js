const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

async function sendMenuWithChannelButton(conn, jid, caption, imageBuffer, mentionedJid, quoted) {
    try {
        await conn.sendMessage(jid, {
            image: imageBuffer ? imageBuffer : { url: "https://files.catbox.moe/jtarms.png" },
            caption: caption,
            contextInfo: {
                mentionedJid: mentionedJid ? [mentionedJid] : [],
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400318546224@newsletter',
                    newsletterName: '📢 𝑽𝒊𝒆𝒘 𝑪𝒉𝒂𝒏𝒏𝒆𝒍',
                    serverMessageId: 143
                }
            }
        }, { quoted: quoted });
    } catch (e) {
        console.error("ViewChannel Helper Error:", e);
        // Fallback if interactive message fails
        await conn.sendMessage(jid, {
            image: imageBuffer ? imageBuffer : { url: "https://files.catbox.moe/jtarms.png" },
            caption: caption,
            contextInfo: { mentionedJid: mentionedJid ? [mentionedJid] : [] }
        }, { quoted: quoted });
    }
}

module.exports = {
    sendMenuWithChannelButton
};
