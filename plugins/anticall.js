const { cmd } = require('../arslan');
const config = require('../config');


cmd({
    pattern: "anti-call",
    react: "👑",
    alias: ["anticall"],
    desc: "Enable or disable welcome messages for new members",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*❌ Owner only command*");

        if (status === "on") {
            config.ANTI_CALL = "true";
            return reply("*✅ Anti-call activated*");
        } else if (status === "off") {
            config.ANTI_CALL = "false";
            return reply("*✅ Anti-call deactivated*");
        } else {
            return reply(`*Usage:*\n.anti-call on/off`);
        }
});
