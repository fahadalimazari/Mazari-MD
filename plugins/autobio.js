const { cmd } = require('../arslan');
const config = require('../config');

cmd({
  pattern: "autobio",
  alias: ["bioauto", "setautobio"],
  react: "😎",
  category: "owner",
  desc: "Auto bio on/off",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
  try {

    // 🔐 Owner only
    if (!isOwner) {
      return reply("*❌ Owner only command*");
    }

    const state = q?.toLowerCase();

    // ❓ Help / status
    if (!state || !["on", "off"].includes(state)) {
      return reply(
        `*AUTO BIO COMMAND*\n\n` +
        `• .autobio on\n` +
        `• .autobio off\n` +
        `• Current status: ${conn.userConfig?.autoBio ? "✅ ON" : "❌ OFF"}`
      );
    }

    const { updateUserConfigInPostgres } = require('../lib/database-pg');

    // ✅ Set state
    if (!conn.userConfig) conn.userConfig = {};
    conn.userConfig.autoBio = state === "on";
    await updateUserConfigInPostgres(conn.user.id.split(':')[0], conn.userConfig);

    if (conn.userConfig.autoBio) {
      updateBio(conn);
    }

    return reply(`*✅ Auto-Bio set to ${state.toUpperCase()}*`);

  } catch (e) {
    console.log("AUTOBIO ERROR:", e);
    reply("*❌ Error occurred*");
  }
});


// ================= BIO UPDATER =================
async function updateBio(conn) {
  if (!conn.userConfig?.autoBio) return;

  try {
    const uptime = clockString(process.uptime() * 1000);
    const botname = config.BOT_NAME || "MAZARI-MD";

    const bio = `👑 ${botname} ACTIVE (${uptime}) 👑`;
    await conn.updateProfileStatus(bio);

    console.log("✅ BIO UPDATED:", bio);
  } catch (err) {
    console.log("❌ BIO UPDATE FAILED:", err.message);
  }

  // ⏱️ 1 minute loop
  setTimeout(() => updateBio(conn), 60 * 1000);
}


// ================= TIME FORMAT =================
function clockString(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000) % 24;
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;

  let str = "";
  if (d) str += `${d}D `;
  if (h) str += `${h}H `;
  if (m) str += `${m}M `;
  if (s) str += `${s}S`;
  return str.trim();
}
