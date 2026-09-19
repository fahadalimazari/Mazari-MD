const { cmd } = require('../arslan')

cmd({
    pattern: "vv",
    alias: ["viewonce", "view", "open"],
    react: "🥺",
    desc: "Retrieve view-once media (Owner only)",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, isSudo, reply }) => {
    try {
        if (!isOwner && !isSudo)
            return reply("❌ 𝑽𝒊𝒆𝒘 𝑶𝒏𝒄𝒆\n𝑶𝒘𝒏𝒆𝒓/𝑺𝒖𝒅𝒐 𝒐𝒏𝒍𝒚.")

        if (!m.quoted)
            return reply("⚠️ 𝑽𝒊𝒆𝒘 𝑶𝒏𝒄𝒆\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂 𝑽𝒊𝒆𝒘 𝑶𝒏𝒄𝒆 𝒎𝒆𝒅𝒊𝒂.")

        // 🔥 VIEW ONCE FIX
        let quoted = m.quoted
        let msg = quoted.message

        if (msg?.viewOnceMessageV2) {
            msg = msg.viewOnceMessageV2.message
        } else if (msg?.viewOnceMessageV2Extension) {
            msg = msg.viewOnceMessageV2Extension.message
        } else if (msg?.viewOnceMessage) {
            msg = msg.viewOnceMessage.message
        }

        const type = Object.keys(msg).find(k => k === 'imageMessage' || k === 'videoMessage' || k === 'audioMessage') || Object.keys(msg)[0]
        
        // Native Baileys Download
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
        const mediaType = type.replace('Message', '')
        const stream = await downloadContentFromMessage(msg[type], mediaType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        let content = {}

        if (type === "imageMessage") {
            content = {
                image: buffer,
                caption: `${msg[type]?.caption || ""}\n\n> 𝑶𝒑𝒆𝒏𝒆𝒅 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚\n> 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫`.trim()
            }
        } 
        else if (type === "videoMessage") {
            content = {
                video: buffer,
                caption: `${msg[type]?.caption || ""}\n\n> 𝑶𝒑𝒆𝒏𝒆𝒅 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚\n> 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫`.trim()
            }
        } 
        else if (type === "audioMessage") {
            content = {
                audio: buffer,
                mimetype: "audio/mp4",
                ptt: false
            }
        } 
        else {
            return reply("⚠️ 𝑽𝒊𝒆𝒘 𝑶𝒏𝒄𝒆\n𝑻𝒉𝒊𝒔 𝒎𝒆𝒅𝒊𝒂 𝒕𝒚𝒑𝒆 𝒊𝒔 𝒏𝒐𝒕 𝒔𝒖𝒑𝒑𝒐𝒓𝒕𝒆𝒅.")
        }

        await conn.sendMessage(from, content, { quoted: mek })

    } catch (e) {
        console.log("VV ERROR:", e)
        reply("❌ 𝑽𝒊𝒆𝒘 𝑶𝒏𝒄𝒆\n𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒐𝒑𝒆𝒏 𝒕𝒉𝒊𝒔 𝒎𝒆𝒅𝒊𝒂.")
    }
})
