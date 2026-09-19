const { cmd } = require('../arslan');
const { getEffectiveMode, updateMode, getModeDisplay, VALID_MODES } = require('./lib/mode');

cmd({
    pattern: "mode",
    alias: ["worktype", "setmode"],
    desc: "Set bot working mode (Owner/Sudo only)",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, reply, isOwner, isSudo }) => {
    try {
        // Permission check
        if (!isOwner && !isSudo) {
            return await reply('❌ Mode change is Owner/Sudo only.');
        }

        // Get the new mode from arguments (join all args for multi-word modes like "private inbox")
        const newMode = (args.join(' ') || '').toLowerCase().trim();

        // Helper to build selection message
        const buildSelectionMessage = () => {
            const currentMode = getEffectiveMode(conn, require('../config'));
            return `*⚙️ Mode Setting*\n\n> Select a mode:\n• public\n• private\n• privateinbox\n\n*Current Mode: ${getModeDisplay(currentMode)}*`;
        };

        if (!newMode) {
            // No mode provided - show selection
            return await reply(buildSelectionMessage());
        }

        // Validate mode
        let normalizedMode = newMode;
        if (normalizedMode === 'privateinbox') normalizedMode = 'private_inbox';
        if (normalizedMode === 'private inbox') normalizedMode = 'private_inbox';
        if (normalizedMode === 'inbox') normalizedMode = 'private_inbox';
        
        if (!VALID_MODES.includes(normalizedMode)) {
            return await reply(buildSelectionMessage());
        }

        // Get bot number
        const botNumber = conn.user.id.split(':')[0].split('@')[0];

        // Update mode
        const result = await updateMode(conn, botNumber, normalizedMode);

        if (!result.success) {
            return await reply(`❌ Failed to update mode: ${result.error}`);
        }

        await reply(`*✅ Mode Updated*\n> Current mode: ${getModeDisplay(result.mode)}`);
    } catch (error) {
        console.error('[MODE-COMMAND] Error:', error.message);
        await reply(`❌ Mode command error: ${error.message}`);
    }
});
