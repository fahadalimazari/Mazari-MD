const { cmd } = require('../arslan');
const config = require('../config');

cmd({
    pattern: "anti-call",
    react: "👑",
    alias: ["anticall_old"],
    desc: "Enable or disable welcome messages for new members",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("🔒 𝑶𝒘𝒏𝒆𝒓 𝑶𝒏𝒍𝒚\n\n> 𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒊𝒔 𝒇𝒐𝒓 𝒐𝒘𝒏𝒆𝒓 𝒐𝒏𝒍𝒚.");

    const status = args[0]?.toLowerCase();

    if (status === "on") {
        config.ANTI_CALL = "true";
        return reply("✅ 𝑨𝒏𝒕𝒊 𝑪𝒂𝒍𝒍 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅\n\n> 𝑨𝒏𝒕𝒊 𝒄𝒂𝒍𝒍 𝒊𝒔 𝒏𝒐𝒘 𝒆𝒏𝒂𝒃𝒍𝒆𝒅.");
    } else if (status === "off") {
        config.ANTI_CALL = "false";
        return reply("❌ 𝑨𝒏𝒕𝒊 𝑪𝒂𝒍𝒍 𝑫𝒊𝒔𝒂𝒃𝒍𝒆𝒅\n\n> 𝑨𝒏𝒕𝒊 𝒄𝒂𝒍𝒍 𝒊𝒔 𝒏𝒐𝒘 𝒅𝒊𝒔𝒂𝒃𝒍𝒆𝒅.");
    } else {
        return reply("⚙️ 𝑨𝒏𝒕𝒊 𝑪𝒂𝒍𝒍\n\n> 𝑼𝒔𝒆 : .anti-call on / off");
    }
});
