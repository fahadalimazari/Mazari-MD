// ============================================
// 📞 MAZARI-MD ANTI-CALL SYSTEM
// ============================================

const arslanLog = (message, type = 'info') => {
    const icons = { info: '📝', success: '✅', error: '❌', warning: '⚠️', debug: '🐛' };
    console.log(`${icons[type] || '📝'} [MAZARI-MD-MINI] ${new Date().toISOString()}: ${message}`);
};

/**
 * Register anti-call logic for a specific connection
 * @param {Object} conn - The WhatsApp socket connection
 * @param {Object} config - Global configuration
 */
function registerAntiCall(conn, config) {
    if (conn.__antiCallRegistered) return;
    conn.__antiCallRegistered = true;

    // Session-safe call tracker
    // Structure: Map(callerJid -> { count: number, lastCall: timestamp })
    conn.callCounts = new Map();

    conn.ev.on('call', async (calls) => {
        try {
            // Check if anti-call is enabled for this session
            const isEnabled = conn.userConfig?.ANTI_CALL === 'true' || config.ANTI_CALL === 'true';
            if (!isEnabled) return;

            for (const call of calls) {
                if (call.status === 'offer') {
                    const callerJid = call.from;
                    const now = Date.now();
                    
                    // Fetch or initialize caller data
                    let userData = conn.callCounts.get(callerJid) || { count: 0, lastCall: now };

                    // Reset counter if inactive for more than 5 minutes (300,000 ms)
                    if (now - userData.lastCall > 300000) {
                        userData.count = 0;
                    }

                    // Increment call count
                    userData.count++;
                    userData.lastCall = now;
                    conn.callCounts.set(callerJid, userData);

                    // 1st, 2nd, and 3rd calls are rejected
                    await conn.rejectCall(call.id, callerJid);
                    arslanLog(`Rejected call ${userData.count} from ${callerJid}`, 'info');

                    // ONLY on the 3rd call, send the warning message
                    if (userData.count === 3) {
                        await conn.sendMessage(callerJid, {
                            text: `⚠️ 𝑨𝒏𝒕𝒊-𝑪𝒂𝒍𝒍\n> 𝑷𝒍𝒆𝒂𝒔𝒆 𝒅𝒐𝒏'𝒕 𝒄𝒂𝒍𝒍 — 𝑶𝒘𝒏𝒆𝒓 𝒊𝒔 𝒃𝒖𝒔𝒚. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒔𝒆𝒏𝒅 𝒂 𝒎𝒆𝒔𝒔𝒂𝒈𝒆.`
                        });
                        arslanLog(`Sent Anti-Call warning to ${callerJid}`, 'warning');
                    }
                }
            }
        } catch (err) {
            arslanLog(`Anti-call handling error: ${err.message}`, 'error');
        }
    });
}

module.exports = registerAntiCall;
