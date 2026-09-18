const { cmd } = require('../arslan');
const pgDB = require('../lib/database-pg');
const { getAutoreact, setAutoreact } = pgDB;

// 📌 AUTOREACT COMMAND
cmd({
    pattern: "autoreact",
    alias: ["reactauto", "ar"],
    desc: "Enable/Disable intelligent AutoReact",
    category: "admin",
    react: "⚡",
    use: ".autoreact on/off/status"
},
async (conn, mek, m, { from, args, isGroup, sender, isOwner, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ *𝑮𝒓𝒐𝒖𝒑𝒔 𝑶𝒏𝒍𝒚*\n𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔 𝒐𝒏𝒍𝒚.");
        if (!isOwner) return reply("⚠️ *𝑨𝒄𝒄𝒆𝒔𝒔 𝑫𝒆𝒏𝒊𝒆𝒅*\n𝑶𝒘𝒏𝒆𝒓 𝒐𝒓 𝑺𝒖𝒅𝒐 𝒐𝒏𝒍𝒚.");

        const action = args[0] ? args[0].toLowerCase() : "";

        if (action === "on" || action === "enable") {
            await setAutoreact(from, true);
            return reply(`⚡ *𝑨𝒖𝒕𝒐𝑹𝒆𝒂𝒄𝒕 𝑬𝒏𝒂𝒃𝒍𝒆𝒅*\n𝑴𝑨𝒁𝑨𝑹𝑰 𝒘𝒊𝒍𝒍 𝒏𝒐𝒘 𝒓𝒆𝒂𝒄𝒕 𝒏𝒂𝒕𝒖𝒓𝒂𝒍𝒍𝒚.`);
        }

        if (action === "off" || action === "disable") {
            await setAutoreact(from, false);
            return reply(`🔕 *𝑨𝒖𝒕𝒐𝑹𝒆𝒂𝒄𝒕 𝑫𝒊𝒔𝒂𝒃𝒍𝒆𝒅*\n𝑨𝒖𝒕𝒐 𝒓𝒆𝒂𝒄𝒕𝒊𝒐𝒏𝒔 𝒂𝒓𝒆 𝒏𝒐𝒘 𝒐𝒇𝒇.`);
        }

        if (action === "status") {
            const status = await getAutoreact(from);
            if (status) {
                return reply(`⚡ *𝑨𝒖𝒕𝒐𝑹𝒆𝒂𝒄𝒕: 𝑶𝑵*\n𝑴𝑨𝒁𝑨𝑹𝑰 𝒊𝒔 𝒓𝒆𝒂𝒄𝒕𝒊𝒏𝒈 𝒏𝒂𝒕𝒖𝒓𝒂𝒍𝒍𝒚.`);
            } else {
                return reply(`🔕 *𝑨𝒖𝒕𝒐𝑹𝒆𝒂𝒄𝒕: 𝑶𝑭𝑭*\n𝑨𝒖𝒕𝒐 𝒓𝒆𝒂𝒄𝒕𝒊𝒐𝒏𝒔 𝒂𝒓𝒆 𝒅𝒊𝒔𝒂𝒃𝒍𝒆𝒅.`);
            }
        }

        return reply("⚠️ *Invalid Usage*\n𝑼𝒔𝒆: .autoreact on / off / status");
    } catch (e) {
        console.error("AutoReact command error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// 📌 AUTOREACT EVENT HANDLER
cmd({
    pattern: "autoreact_event",
    on: "body"
}, async (conn, mek, m, { from, body, isGroup }) => {
    try {
        if (!isGroup || !body) return;
        
        // 1. Ignore if message is from the bot itself
        if (m.key.fromMe) return;

        // 2. Ignore broadcast/status messages
        if (m.key.remoteJid === "status@broadcast") return;

        // 3. Check if enabled for this group
        const isEnabled = await getAutoreact(from);
        if (!isEnabled) return;

        // 4. Pattern matcher for intelligent reactions
        const text = body.toLowerCase();
        let reactEmoji = null;

        const patterns = [
            { regex: /\b(hello|hi|hey|salam)\b/i, emojis: ['👋', '😊'] },
            { regex: /\b(thanks|thank you|thx)\b/i, emojis: ['❤️', '🙌'] },
            { regex: /\b(lol|haha|lmao|😂|🤣)\b/i, emojis: ['😂', '🤣'] },
            { regex: /\b(love|good|awesome|amazing|nice)\b/i, emojis: ['❤️', '🥰', '🔥'] },
            { regex: /\b(done|success|congrats|✅|🎉)\b/i, emojis: ['✅', '🎉'] },
            { regex: /\b(error|warning|issue|problem|⚠️)\b/i, emojis: ['⚠️'] },
            { regex: /\b(sad|sorry|😔|😢)\b/i, emojis: ['😔'] },
            { regex: /\b(how|what|why|when|where|\?)\b/i, emojis: ['🤔'] }
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(text)) {
                reactEmoji = pattern.emojis[Math.floor(Math.random() * pattern.emojis.length)];
                break;
            }
        }

        // 5. Normal/fallback reaction with 15% probability to avoid spam
        if (!reactEmoji && Math.random() < 0.15) {
            reactEmoji = '👍';
        }

        // 6. Send reaction if one was chosen
        if (reactEmoji) {
            await conn.sendMessage(from, { react: { text: reactEmoji, key: m.key } });
        }

    } catch (e) {
        console.error("AutoReact event error:", e);
    }
});
