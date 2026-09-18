const axios = require("axios");
const { cmd } = require('../arslan');

const defaultCaption = `╭━━━〔 📸 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷
┃ 📸 ✦ 𝑰𝑵𝑺𝑻𝑨𝑮𝑹𝑨𝑴 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫
┃ 📥 ✦ 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑫 𝑺𝑼𝑪𝑪𝑬𝑺𝑺𝑭𝑼𝑳𝑳𝒀 ✓
┃ ⚡ ✦ 𝑬𝒏𝒋𝒐𝒚 𝒚𝒐𝒖𝒓 𝒎𝒆𝒅𝒊𝒂!
╰━━━━━━━━━━━━━━━━━━━━⊷`;

cmd({
    pattern: "igdl",
    alias: ["instagram", "insta", "ig"],
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "downloader",
    use: ".igdl <Instagram URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, q }) => {
    try {
        const url = q || m.quoted?.text;
        if (!url || !url.includes("instagram.com")) {
            return reply("⚠️ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒗𝒂𝒍𝒊𝒅 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝒍𝒊𝒏𝒌.");
        }

        // Show processing reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Fetch from API
        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);

        if (!response.data?.status || !response.data.data?.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒇𝒆𝒕𝒄𝒉 𝒎𝒆𝒅𝒊𝒂.");
        }

        // Send all media items
        for (const item of response.data.data) {
            await conn.sendMessage(from, {
                [item.type === 'video' ? 'video' : 'image']: { url: item.url },
                caption: defaultCaption
            });
        }

        // Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('IGDL Error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝒇𝒂𝒊𝒍𝒆𝒅. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.");
    }
});

cmd({
  pattern: "igdl4",
  alias: ["instagram4", "insta4", "ig4", "igvideo4"],
  react: '📶',
  desc: "Download videos from Instagram (Alternative API)",
  category: "download",
  use: ".igdl2 <Instagram URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const igUrl = args[0];
    if (!igUrl || !igUrl.includes("instagram.com")) {
      return reply("⚠️ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒗𝒂𝒍𝒊𝒅 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝒍𝒊𝒏𝒌.");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://bk9.fun/download/instagram?url=${encodeURIComponent(igUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data?.status || !response.data?.BK9?.[0]?.url) {
      await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
      return reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑼𝒏𝒂𝒃𝒍𝒆 𝒕𝒐 𝒇𝒆𝒕𝒄𝒉 𝒕𝒉𝒆 𝒗𝒊𝒅𝒆𝒐.");
    }

    const videoUrl = response.data.BK9[0].url;
    await conn.sendMessage(from, { react: { text: '📶', key: m.key } });

    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    if (!videoResponse.data) {
      await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
      return reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝒇𝒂𝒊𝒍𝒆𝒅.");
    }

    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    await conn.sendMessage(from, {
      video: videoBuffer,
      caption: defaultCaption
    });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('Error downloading video:', error);
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑨𝑷𝑰 𝒇𝒂𝒊𝒍𝒆𝒅. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.");
  }
});

cmd({
  pattern: "igdl2",
  alias: ["instagram2", "ig2", "instadl2"],
  react: '📥',
  desc: "Download videos from Instagram (API v5)",
  category: "download",
  use: ".igdl5 <Instagram video URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const igUrl = args[0];
    if (!igUrl || !igUrl.includes("instagram.com")) {
      return reply("⚠️ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒗𝒂𝒍𝒊𝒅 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝒍𝒊𝒏𝒌.");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(igUrl)}`;
    const response = await axios.get(apiUrl);

    const data = response.data;

    if (!data.status || !data.result || !Array.isArray(data.result)) {
      return reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑼𝒏𝒂𝒃𝒍𝒆 𝒕𝒐 𝒇𝒆𝒕𝒄𝒉 𝒕𝒉𝒆 𝒗𝒊𝒅𝒆𝒐.");
    }

    const videoUrl = data.result[0];
    if (!videoUrl) return reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑵𝒐 𝒗𝒊𝒅𝒆𝒐 𝒇𝒐𝒖𝒏𝒅.");

    const metadata = data.metadata || {};
    const author = metadata.author || "Unknown";
    const caption = metadata.caption ? metadata.caption.slice(0, 300) + "..." : "No caption provided.";
    const likes = metadata.like || 0;
    const comments = metadata.comment || 0;

    await reply("⏳ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕...");

    const igdl2Caption = `╭━━━〔 📸 𝑴𝑨𝒁𝑨𝑹𝑰-𝑴𝑫 〕━━━⊷
┃ 📸 ✦ 𝑰𝑵𝑺𝑻𝑨𝑮𝑹𝑨𝑴 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫
┃ 👤 ✦ 𝑨𝑼𝑻𝑯𝑶𝑹 : ${author}
┃ ❤️ ✦ 𝑳𝑰𝑲𝑬𝑺 : ${likes}
┃ 💬 ✦ 𝑪𝑶𝑴𝑴𝑬𝑵𝑻𝑺 : ${comments}
┃ 📥 ✦ 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑺 𝑺𝑼𝑪𝑪𝑬𝑺𝑺𝑭𝑼𝑳𝑳𝒀 ✓
┃ ⚡ ✦ 𝑬𝒏𝒋𝒐𝒚 𝒚𝒐𝒖𝒓 𝒎𝒆𝒅𝒊𝒂!
╰━━━━━━━━━━━━━━━━━━━━⊷`;

    await conn.sendMessage(from, {
      video: { url: videoUrl },
      caption: igdl2Caption
    });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('IGDL5 Error:', error);
    reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝒇𝒂𝒊𝒍𝒆𝒅.");
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});

cmd({
    pattern: "ig3",
    alias: ["insta3", "instagram3"],
    desc: "Download Instagram video",
    category: "downloader",
    react: "⤵️",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q || !q.includes("instagram.com")) return reply("⚠️ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑹𝒆𝒒𝒖𝒆𝒔𝒕\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒗𝒂𝒍𝒊𝒅 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝒍𝒊𝒏𝒌.");
        
        reply("⏳ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅\n\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕...");
        
        const apiUrl = `https://rest-lily.vercel.app/api/downloader/igdl?url=${q}`;
        const { data } = await axios.get(apiUrl);
        
        if (!data.status || !data.data || !data.data[0]) return reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒇𝒆𝒕𝒄𝒉 𝒗𝒊𝒅𝒆𝒐.");
        
        const { url } = data.data[0];
        
        await conn.sendMessage(from, {
            video: { url: url },
            caption: defaultCaption,
            contextInfo: { mentionedJid: [m.sender] }
        });
        
    } catch (e) {
        console.error("Error in Instagram downloader command:", e);
        reply("❌ 𝑰𝒏𝒔𝒕𝒂𝒈𝒓𝒂𝒎 𝑬𝒓𝒓𝒐𝒓\n\n> 𝑺𝒐𝒎𝒆𝒕𝒉𝒊𝒏𝒈 𝒘𝒆𝒏𝒕 𝒘𝒓𝒐𝒏𝒈. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏.");
    }
});
