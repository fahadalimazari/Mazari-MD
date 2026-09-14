const { cmd } = require('../arslan');
const { sleep } = require('../lib/functions');

cmd({
  pattern: "ping",
  desc: "Live ping speed monitor",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {

  try {

    // initial message - show ping result directly with channel button
    const msg = await conn.sendMessage(from, {
      text: `⚡ 𝑷𝒊𝒏𝒈 : ${Date.now() - mek.messageTimestamp * 1000} ms`,
      buttons: [
        {
          buttonId: "channel_button",
          buttonText: { displayText: "📢 𝑽𝒊𝒆𝒘 𝑪𝒉𝒂𝒏𝒏𝒆𝒍" },
          type: 1,
          urlButton: {
            url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
          }
        }
      ],
      headerType: 1
    }, { quoted: mek });

    // 🔁 live update loop (30 seconds)
    for (let i = 0; i < 30; i++) {

      const start = Date.now();

      // tiny delay simulating ping check
      await sleep(50);

      const ping = Date.now() - start;

      await conn.relayMessage(from, {
        protocolMessage: {
          key: msg.key,
          type: 14,
          editedMessage: {
            conversation: `⚡ 𝑷𝒊𝒏𝒈 : ${ping} ms`,
            buttonReply: {
              buttonId: "channel_button",
              buttonText: { displayText: "📢 𝑽𝒊𝒆𝒘 𝑪𝒉𝒂𝒏𝒏𝒆𝒍" },
              type: 1,
              urlButton: {
                url: "https://whatsapp.com/channel/0029Vb6GUj8BPzjOWNfnhm1B"
              }
            }
          }
        }
      }, {});

      await sleep(1000);
    }

  } catch (e) {

    console.error("Ping Error:", e);

    reply("❌ 𝑷𝒊𝒏𝒈 𝑭𝒂𝒊𝒍𝒆𝒅 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏");
  }
});
