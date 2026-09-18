const { cmd } = require('../arslan');
const axios = require('axios');

cmd({
  pattern: "fb",
  react: "☺️",
  alias: ["facebook", "fbdl"],
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("⚠️ 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝒗𝒊𝒅𝒆𝒐 𝒍𝒊𝒏𝒌.");

    const apiUrl = `https://movanest.xyz/v2/fbdown?url=${encodeURIComponent(q)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    // 🔎 API status check
    if (data.status !== true) {
      return reply("❌ 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝑨𝑷𝑰 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.");
    }

    // 🔎 Results check
    if (!Array.isArray(data.results) || data.results.length === 0) {
      return reply("❌ 𝑽𝒊𝒅𝒆𝒐 𝑵𝒐𝒕 𝑭𝒐𝒖𝒏𝒅\n\n> 𝑵𝒐 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝒗𝒊𝒅𝒆𝒐 𝒘𝒂𝒔 𝒇𝒐𝒖𝒏𝒅.");
    }

    const result = data.results[0];

    // 🎥 Quality selection (API ke mutabiq)
    const videoUrl = result.hdQualityLink
      ? result.hdQualityLink
      : result.normalQualityLink;

    if (!videoUrl) {
      return reply("⚠️ 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝒗𝒊𝒅𝒆𝒐 𝒍𝒊𝒏𝒌.");
    }

    // 📝 Caption API data se
    const caption = `╭━━━〔 🎬 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷
┃
┃ 📘 ✦ 𝑭𝑨𝑪𝑬𝑩𝑶𝑶𝑲 𝑽𝑰𝑫𝑬𝑶
┃
┃ ⏱️ ✦ 𝑫𝑼𝑹𝑨𝑻𝑰𝑶𝑵 : ${result.duration}
┃ 👤 ✦ 𝑪𝑹𝑬𝑨𝑻𝑶𝑹 : ${data.creator}
┃
┃ 📥 ✦ 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑫 𝑺𝑼𝑪𝑪𝑬𝑺𝑺𝑭𝑼𝑳𝑳𝒀 ✓
┃
╰━━━━━━━━━━━━━━━━━━━━⊷`;

    await conn.sendMessage(
      from,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption: caption
      },
      { quoted: mek }
    );

  } catch (err) {
    console.log(err);
    reply("❌ 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.");
  }
});
