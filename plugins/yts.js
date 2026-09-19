const { cmd } = require('../arslan')
const yts = require('yt-search')

cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    react: "☺️",
    desc: "Search videos on YouTube",
    category: "download",
    use: ".yts <video name>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("⚠️ 𝒀𝑻𝑺 𝑺𝒆𝒂𝒓𝒄𝒉\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒆𝒏𝒕𝒆𝒓 𝒂 𝒀𝒐𝒖𝑻𝒖𝒃𝒆 𝒔𝒆𝒂𝒓𝒄𝒉 𝒕𝒆𝒓𝒎.")
        }

        const search = await yts(q)
        const videos = search.videos.slice(0, 10) // top 10 results

        if (videos.length === 0) {
            return reply("⚠️ 𝒀𝑻𝑺 𝑺𝒆𝒂𝒓𝒄𝒉\n> 𝑵𝒐 𝒗𝒊𝒅𝒆𝒐𝒔 𝒇𝒐𝒖𝒏𝒅.")
        }

        let text = `╭━━━〔 🔎 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷
┃
┃ 🎬 ✦ 𝒀𝑶𝑼𝑻𝑼𝑩𝑬 𝑺𝑬𝑨𝑹𝑪𝑯
┃
`

        for (let i = 0; i < videos.length; i++) {
            const v = videos[i]
            text += `┃ ${i + 1}. ✦ ${v.title}
┃ ⏱️ ✦ ${v.timestamp}
┃ 👁️ ✦ ${v.views} 𝒗𝒊𝒆𝒘𝒔
┃ 🔗 ✦ ${v.url}
┃
`
        }

        text += `╰━━━━━━━━━━━━━━━━━━━━⊷`

        await conn.sendMessage(
            from,
            { text },
            { quoted: mek }
        )

    } catch (e) {
        console.log("YTS ERROR:", e)
        reply("❌ 𝒀𝑻𝑺 𝑺𝒆𝒂𝒓𝒄𝒉\n> 𝑺𝒆𝒂𝒓𝒄𝒉 𝒇𝒂𝒊𝒍𝒆𝒅 — 𝒑𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.")
    }
})
