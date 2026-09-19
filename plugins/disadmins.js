const { cmd } = require('../arslan');
const config = require('../config');

cmd({
    pattern: "disadmins",
    alias: ["dadmin", "disall", "dall"],
    desc: "Demote all other admins in the group",
    category: "admin",
    react: "📉",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, groupMetadata, groupAdmins, isBotAdmins, isAdmins }) => {
    try {
        if (!isGroup) return;
        if (!isAdmins) return;
        if (!isBotAdmins) return;

        const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        
        // Use config.OWNER_NUMBER array to build a list of owner JIDs
        const ownerJids = (config.OWNER_NUMBER || []).map(num => num.trim() + "@s.whatsapp.net");
        
        const allParticipants = groupMetadata.participants;
        
        const targetAdmins = allParticipants.filter(member => 
            (member.admin === "admin" || member.admin === "superadmin") && 
            member.id !== botJid && 
            !ownerJids.includes(member.id)
        );

        if (targetAdmins.length === 0) {
            return;
        }

        for (let participant of targetAdmins) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "demote");
                // Adding a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                console.error(`Failed to demote ${participant.id}:`, e);
            }
        }
    } catch (e) {
        console.error("Disadmins Error:", e);
    }
});
