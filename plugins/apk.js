const { cmd } = require('../arslan');
const axios = require('axios');

cmd({
  pattern: "apk",
  alias: ["app", "playstore", "application"],
  react: "☺️",
  desc: "Download APK via Aptoide",
  category: "download",
  use: ".apk <name>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!q) return reply("⚠️ 𝑨𝑷𝑲 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒆𝒏𝒕𝒆𝒓 𝒂𝒏 𝑨𝑷𝑲 𝒏𝒂𝒎𝒆.\n💡 𝑬𝒙𝒂𝒎𝒑𝒍𝒆: .apk whatsapp");

    const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}/limit=1`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.datalist || !data.datalist.list.length) {
      return reply("❌ 𝑨𝑷𝑲 𝑵𝒐𝒕 𝑭𝒐𝒖𝒏𝒅\n> 𝑵𝒐 𝒎𝒂𝒕𝒄𝒉𝒊𝒏𝒈 𝑨𝑷𝑲 𝒘𝒂𝒔 𝒇𝒐𝒖𝒏𝒅.");
    }

    const app = data.datalist.list[0];
    const appSize = (app.size / 1048576).toFixed(2);

    let caption = `*╭━━━〔 📦 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷*
*┃*
*┃ ✦╭────〔 📱 𝑨𝑷𝑲 𝑰𝑵𝑭𝑶 〕────⊷*
*┃ ✦│▸ 𝑵𝑨𝑴𝑬 : ${app.name.toUpperCase()}*
*┃ ✦│▸ 📦 𝑺𝑰𝒁𝑬 : ${appSize} MB*
*┃ ✦│▸ 🆔 𝑷𝑨𝑪𝑲𝑨𝑮𝑬 : ${app.package.toUpperCase()}*
*┃ ✦│▸ 🔖 𝑽𝑬𝑹𝑺𝑰𝑶𝑵 : ${app.file.vername}*
*┃ ✦╰─────────────┈⊷*
*┃*
*┃ 📥 ✦ 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑰𝑵𝑮...*
*┃*
*╰━━━━━━━━━━━━━━━━━━━━⊷*`;

    await conn.sendMessage(from, { image: { url: app.icon }, caption }, { quoted: mek });

    await conn.sendMessage(from, {
      document: { url: app.file.path || app.file.path_alt },
      mimetype: "application/vnd.android.package-archive",
      fileName: `${app.name.toUpperCase()}.apk`
    }, { quoted: mek });

    await m.react("😍");
  } catch (err) {
    reply("❌ 𝑨𝑷𝑲 𝑬𝒓𝒓𝒐𝒓\n> 𝑺𝒐𝒎𝒆𝒕𝒉𝒊𝒏𝒈 𝒘𝒆𝒏𝒕 𝒘𝒓𝒐𝒏𝒈. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.");
  }
});
                   
