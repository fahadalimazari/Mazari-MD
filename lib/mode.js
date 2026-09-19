const {
    getUserConfigFromPostgres,
    updateUserConfigInPostgres
} = require('./database-pg');

// Valid mode values
const VALID_MODES = ['public', 'private', 'private_inbox'];

// Mode display mapping (for menu)
const MODE_DISPLAY_MAP = {
    'public': '𝑷𝑼𝑩𝑳𝑰𝑪',
    'private': '𝑷𝑹𝑰𝑽𝑨𝑻𝑬',
    'private_inbox': '𝑷𝑹𝑰𝑽𝑨𝑻𝑬 𝑰𝑵𝑩𝑶𝑿'
};

/**
 * Get effective mode for a session
 * Priority: conn.userConfig.MODE > conn.userConfig.WORK_TYPE > config.MODE > config.WORK_TYPE > 'public'
 */
function getEffectiveMode(conn, config) {
    if (!conn || !conn.userConfig) return 'public';
    
    const rawMode = 
        conn.userConfig.MODE || 
        conn.userConfig.WORK_TYPE ||
        config.MODE ||
        config.WORK_TYPE ||
        'public';
    
    // Normalize mode values
    let mode = rawMode.toLowerCase().trim();
    
    // Handle aliases
    if (mode === 'private inbox') mode = 'private_inbox';
    if (mode === 'inbox') mode = 'private_inbox';  // FIX: 'inbox' is an alias for 'private_inbox'
    
    // Validate mode
    if (!VALID_MODES.includes(mode)) {
        mode = 'public';
    }
    
    return mode;
}

/**
 * Check if a command is allowed for normal users in given mode
 */
function isCommandAllowedForNormalUser(cmdName, cmdCategory, mode, isGroup) {
    // Owner/Sudo always allowed (this check should be done separately)
    if (!cmdName) return false;
    
    // Download category commands are allowed
    if (cmdCategory === 'download' || cmdCategory === 'downloader') {
        return true;
    }
    
    // Whitelisted public commands
    const publicCmds = ['ping', 'menu', 'alive', 'tagall', 'pair', 'video', 'tts'];
    if (publicCmds.includes(cmdName)) {
        return true;
    }
    
    // Mode-specific rules
    if (mode === 'private') {
        // Private mode: normal users cannot use any commands
        return false;
    }
    
    if (mode === 'public') {
        // Public mode: normal users can use in both group and inbox
        return isGroup || true; // Will be allowed if it matches any of the above
    }
    
    if (mode === 'private_inbox') {
        // Private inbox mode: only allowed in groups, not in inbox
        return isGroup;
    }
    
    return false;
}

/**
 * Update mode for a session
 */
async function updateMode(conn, number, newMode) {
    if (!VALID_MODES.includes(newMode)) {
        return { success: false, error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` };
    }
    
    try {
        // Normalize the mode
        let normalizedMode = newMode.toLowerCase().trim();
        if (normalizedMode === 'private inbox') normalizedMode = 'private_inbox';
        
        // Get existing config
        const existingConfig = await getUserConfigFromPostgres(number);
        
        // Update mode
        const updatedConfig = {
            ...existingConfig,
            MODE: normalizedMode,
            WORK_TYPE: normalizedMode // Keep both for compatibility
        };
        
        await updateUserConfigInPostgres(number, updatedConfig);
        
        // Update in-memory config if conn.userConfig exists
        if (conn && conn.userConfig) {
            conn.userConfig.MODE = normalizedMode;
            conn.userConfig.WORK_TYPE = normalizedMode;
        }
        
        return { success: true, mode: normalizedMode };
    } catch (error) {
        console.error('[MODE] Error updating mode:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get mode display string
 */
function getModeDisplay(mode) {
    return MODE_DISPLAY_MAP[mode] || '𝑷𝑼𝑩𝑳𝑰𝑪';
}

module.exports = {
    getEffectiveMode,
    isCommandAllowedForNormalUser,
    updateMode,
    getModeDisplay,
    VALID_MODES
};
