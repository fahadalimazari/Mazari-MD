const axios = require('axios')
const yts = require('yt-search')
const { cmd } = require('../arslan')

cmd({
pattern: "video",
alias: ["vid","playvideo"],
desc: "Download YouTube Video (Fast)",
category: "download",
react: "🎬",
filename: __filename
},
async (conn, mek, m, { from, reply, text }) => {

try {

if (!text) {
return reply(`⚠️ 𝑽𝒊𝒅𝒆𝒐 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n> 𝑬𝒏𝒕𝒆𝒓 𝒂 𝒀𝒐𝒖𝑻𝒖𝒃𝒆 𝒗𝒊𝒅𝒆𝒐 𝒕𝒊𝒕𝒍𝒆 𝒐𝒓 𝒍𝒊𝒏𝒌.\n> 💡 𝑬𝒙𝒂𝒎𝒑𝒍𝒆: .video pasoori`)
}

/* 🔍 Search */
const search = await yts(text)

if (!search.videos.length) {
return reply(`❌ 𝑽𝒊𝒅𝒆𝒐 𝑵𝒐𝒕 𝑭𝒐𝒖𝒏𝒅\n> 𝑵𝒐 𝒎𝒂𝒕𝒄𝒉𝒊𝒏𝒈 𝒗𝒊𝒅𝒆𝒐 𝒘𝒂𝒔 𝒇𝒐𝒖𝒏𝒅.`)
}

const vid = search.videos[0]

/* 🎨 Preview */

const caption = `🎬 𝑽𝒊𝒅𝒆𝒐 𝑭𝒐𝒖𝒏𝒅\n\n📌 𝑻𝒊𝒕𝒍𝒆: ${vid.title}\n⏱️ 𝑫𝒖𝒓𝒂𝒕𝒊𝒐𝒏: ${vid.timestamp}\n\n⚡ 𝑷𝒓𝒆𝒑𝒂𝒓𝒊𝒏𝒈 𝒗𝒊𝒅𝒆𝒐...`

await conn.sendMessage(from,{
image:{url:vid.thumbnail},
caption
})

/* 🎥 API */

const api = `https://arslan-apis-v2.vercel.app/download/ytmp4?url=${encodeURIComponent(vid.url)}`

const res = await axios.get(api,{timeout:60000})

if(
!res.data ||
!res.data.status ||
!res.data.result ||
!res.data.result.download ||
!res.data.result.download.url
){
return reply(`❌ 𝑽𝒊𝒅𝒆𝒐 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑭𝒂𝒊𝒍𝒆𝒅\n> 𝑻𝒉𝒆 𝒗𝒊𝒅𝒆𝒐 𝒄𝒐𝒖𝒍𝒅 𝒏𝒐𝒕 𝒃𝒆 𝒅𝒐𝒘𝒏𝒍𝒐𝒂𝒅𝒆𝒅.`)
}

const videoUrl = res.data.result.download.url
const title = res.data.result.metadata.title || vid.title

/* 🚀 SEND VIDEO DIRECT */

await conn.sendMessage(from,{
video:{url:videoUrl},
mimetype:"video/mp4",
caption: `*╭━━━〔 🎬 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷*\n*┃*\n*┃ 🎵 ✦ ${title}*\n*┃*\n*┃ 📥 ✦ 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑫 𝑺𝑼𝑪𝑪𝑬𝑺𝑺𝑭𝑼𝑳𝑳𝒀 ✓*\n*┃*\n*┃ ⚡ ✦ 𝑬𝒏𝒋𝒐𝒚 𝒚𝒐𝒖𝒓 𝒗𝒊𝒅𝒆𝒐!*\n*┃*\n*╰━━━━━━━━━━━━━━━━━━━━⊷*`
}, { quoted: mek })

}catch(err){

console.log(err)
reply(`❌ 𝑽𝒊𝒅𝒆𝒐 𝑬𝒓𝒓𝒐𝒓\n> 𝑺𝒐𝒎𝒆𝒕𝒉𝒊𝒏𝒈 𝒘𝒆𝒏𝒕 𝒘𝒓𝒐𝒏𝒈. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.`)

}

})
