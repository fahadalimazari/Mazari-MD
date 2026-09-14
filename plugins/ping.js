const { cmd } = require('../arslan');
const { sleep } = require('../lib/functions');

cmd({
  pattern: "ping",
  desc: "Live ping speed monitor",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {

  try {

    // Record start time before sending the message
    const start = Date.now();

    // Send initial message with channel button - measures real bot latency
    const msg = await conn.sendMessage(from, {
      interactiveMessage: {
        body: {
          text: `⚡ 𝑷𝒊𝒏𝒈 : ${Date.now() - start} ms`
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
    }, { quoted: mek });

    // 🔁 live update loop (30 seconds) - measure real latency on each iteration
    for (let i = 0; i < 30; i++) {

      const start = Date.now();

      // Wait for a moment to measure bot response time
      await sleep(100);

      const ping = Date.now() - start;

      await conn.sendMessage(from, {
          interactiveMessage: {
            body: { text: `⚡ 𝑷𝒊𝒏𝑔 : ${ping} ms` },
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
        }, { quoted: mek });

      await sleep(1000);
    }

  } catch (e) {

    console.error("Ping Error:", e);

    reply("❌ 𝑷𝒊𝒏𝒈 𝑭𝒂𝒊𝒍𝒆𝒅 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏");
  }
});
