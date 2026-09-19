const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

async function sendMenuWithChannelButton(conn, jid, caption, imageBuffer, mentionedJid, quoted) {
    try {
        let mediaData;
        if (imageBuffer) {
            mediaData = await prepareWAMessageMedia({ image: imageBuffer }, { upload: conn.waUploadToServer });
        } else {
            mediaData = await prepareWAMessageMedia({ image: { url: "https://files.catbox.moe/jtarms.png" } }, { upload: conn.waUploadToServer });
        }

        const msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: {
                        body: { text: caption },
                        footer: { text: "👑 MAZARI-MD" },
                        header: {
                            title: "",
                            hasMediaAttachment: true,
                            ...mediaData
                        },
                        contextInfo: {
                            mentionedJid: mentionedJid ? [mentionedJid] : [],
                            isForwarded: true
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📢 𝑽𝒊𝒆𝒘 𝑪𝒉𝒂𝒏𝒏𝒆𝒍",
                                        url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B",
                                        merchant_url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { quoted: quoted });

        await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
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
