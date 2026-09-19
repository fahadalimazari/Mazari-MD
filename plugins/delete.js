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
        // Get quoted message
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMessage) {
            // No reply case - show error but DON'T delete command message
            await conn.sendMessage(from, {
                text: `⚠️ 𝑫𝒆𝒍𝒆𝒕𝒆 > 𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆.`
            }, { quoted: mek });
            return;
        }

        // Extract message key from quoted message
        const quotedKey = quotedMessage.key || quotedMessage?.extendedTextMessage?.contextInfo?.key;
        
        if (!quotedKey) return;

        // Get the sender of the quoted message
        const quotedSender = quotedKey.participant || quotedKey.fromMe ? sender : quotedKey.participant;
        
        // Determine if user can delete this message
        // Can delete if: own message OR admin/owner/sudo
        const isOwnMessage = quotedSender === sender || quotedKey.fromMe;
        const canDelete = isOwnMessage || isAdmins || isBotAdmins || isOwner || isSudo;

        if (!canDelete) {
            // Cannot delete - silently return, DO NOT delete command message
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
