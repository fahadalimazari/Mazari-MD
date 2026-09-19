const { cmd } = require('../arslan');

cmd({
    pattern: "delete",
    alias: ["del", "dlt", "dele"],
    desc: "Delete replied message (Admin only)",
    category: "admin",
    filename: __filename
}, async (conn, mek, m, {
    from,
    isGroup,
    isBotAdmins,
    isAdmins,
    isOwner,
    isSudo,
    reply
}) => {
    try {
        // Only work in groups
        if (!isGroup) return;

        // Permission check: Admin, Bot Admin, Owner, or Sudo
        if (!isAdmins && !isBotAdmins && !isOwner && !isSudo) return;

        // Get quoted message
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMessage) return;

        // Extract message key from quoted message
        const quotedKey = quotedMessage.key || quotedMessage?.extendedTextMessage?.contextInfo?.key;
        
        if (!quotedKey) return;

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
