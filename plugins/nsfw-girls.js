const { cmd } = require("../arslan");

cmd({
  pattern: "boobs",
  alias: ["xboobs", "bobs"],
  desc: "Random Anime Girl Image",
  category: "download",
  react: "🌸",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const apiUrl = "https://arslan-apis-v2.vercel.app/api/boobs";

    await conn.sendMessage(from, {
      image: { url: apiUrl },
      caption: "🌸 *Random X Girl*\n\n© MAZARI-MD"
    });

  } catch (err) {
    console.log(err);
    reply("⚠️ Image send nahi ho saki.");
  }
});

cmd({
  pattern: "xgirl",
  alias: ["xgirls", "ximg"],
  desc: "Random Anime Girl Image",
  category: "download",
  react: "🌸",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const apiUrl = "https://arslan-apis-v2.vercel.app/api/girls-pack";

    await conn.sendMessage(from, {
      image: { url: apiUrl },
      caption: "🌸 *Random X Girl*\n\n© MAZARI-MD"
    });

  } catch (err) {
    console.log(err);
    reply("⚠️ Image send nahi ho saki.");
  }
});
