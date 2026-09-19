const { cmd } = require('../arslan');

cmd({
    pattern: "delete",
    alias: ["del", "dlt", "dele"],
    desc: "Delete replied message",
    category: "admin",
    filename: __filename
}, async (conn, mek, m, {
    from,
    isGroup,
    isBotAdmins,
    isAdmins,
    isOwner,
    isSudo,
    sender,
    senderNumber,
    reply
}) => {
    try {
        // Check if message is from me (for self-delete in private chat)
        const isFromMe = mek.key.fromMe;

        // Get quoted message using m.quoted structure
        // m.quoted contains: message, stanzaId, participant
        if (!m.quoted || !m.quoted.message) {
            // No reply case - show error but DON'T delete command message
            await conn.sendMessage(from, {
                text: `⚠️ 𝑫𝒆𝒍𝒆𝒕𝒆 > 𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆.`
            }, { quoted: mek });
            return;
        }

        // Get the quoted message key
        // stanzaId is the message ID, remoteJid is the chat
        const quotedKey = {
            remoteJid: from,
            id: m.quoted.stanzaId,
            fromMe: m.quoted.participant ? false : isFromMe,
            participant: m.quoted.participant || (isFromMe ? conn.user.id : null)
        };

        // Determine if user can delete this message
        // Can delete if: own message OR admin/owner/sudo
        
        // Check if quoted message was sent by current user
        const quotedSender = m.quoted.participant;
        const isOwnMessage = quotedSender === sender || isFromMe;
        
        const canDelete = isOwnMessage || isAdmins || isBotAdmins || isOwner || isSudo;

        if (!canDelete) {
            // Cannot delete - silently return, DO NOT delete anything
            return;
        }

        // Delete quoted message
        await conn.sendMessage(from, {
            delete: quotedKey
        });

        // Delete the .delete command message itself
        await conn.sendMessage(from, {
            delete: mek.key
        });

    } catch (error) {
        // Silent fail - no error message to user
        console.error('[DELETE] Error:', error.message);
    }
});
