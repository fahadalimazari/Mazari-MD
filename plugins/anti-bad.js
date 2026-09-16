// ============================================
// 🚫 ANTI-BAD WORDS - MAZARI-MD MINI
// 👑 Developer: MAZARI HACKER
// 🔥 Auto delete bad words + Warn + Kick
// ============================================

const { cmd } = require('../arslan');
const config = require('../config');

// ─── BAD WORDS LIST ───
const BAD_WORDS = [
    // English
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap',
    'dick', 'pussy', 'cock', 'whore', 'slut', 'bastard', 'motherfucker',
    'nigga', 'nigger', 'retard', 'idiot', 'stupid', 'dumb',
    
    // Urdu/Hindi
    'bhosdi', 'bhosri', 'chutiya', 'chut', 'gand', 'gaand',
    'madarchod', 'behenchod', 'bhenchod', 'lode', 'lund',
    'kutti', 'kutta', 'harami', 'nalayak', 'hijda',
    
    // Roman Urdu
    'bsdk', 'mc', 'bc', 'mkc', 'bkc', 'rndi', 'randi',
    'chutiyapa', 'bhosdike', 'bhosdiwale', 'madarchod',
    'bhenkelode', 'bhenkelund', 'teri maa ki', 'teri behan ki'
];

// ─── BAD WORD PATTERNS (Regex) ───
const BAD_PATTERNS = [
    /f[uck]+/gi,
    /s[h!]?it/gi,
    /b[i!]tch/gi,
    /a[s$]sho[l!]e/gi,
    /b[s$]dk/gi,
    /mc/gi,
    /bc/gi,
    /mkc/gi,
    /bkc/gi,
    /chutiya/gi,
    /g[a@]nd/gi,
    /l[u@]nd/gi,
    /r[a@]ndi/gi,
    /h[a@]rami/gi
];

// ============================================
// 📌 MAIN COMMAND
// ============================================
cmd({
    pattern: "antibad",
    alias: ["ab", "badword", "filterbad", "badfilter"],
    desc: "🚫 Anti-Bad Words System for groups",
    category: "admin",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args, prefix }) => {

    // ─── CHECK GROUP ───
    if (!isGroup) {
        return reply("⚠️ *𝑮𝒓𝒐𝒖𝒑𝒔 𝑶𝒏𝒍𝒚*\n𝑻𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅 𝒘𝒐𝒓𝒌𝒔 𝒊𝒏 𝒈𝒓𝒐𝒖𝒑𝒔 𝒐𝒏𝒍𝒚.");
    }

    // ─── CHECK ADMIN PERMISSION ───
    if (!isAdmins && !isOwner) {
        return reply("🔒 *𝑨𝒅𝒎𝒊𝒏 𝑶𝒏𝒍𝒚*\n𝑨𝒅𝒎𝒊𝒏 𝒑𝒆𝒓𝒎𝒊𝒔𝒔𝒊𝒐𝒏 𝒊𝒔 𝒓𝒆𝒒𝒖𝒊𝒓𝒆𝒅.");
    }

    if (!isBotAdmins) {
        return reply("🛡️ *𝑨𝒅𝒎𝒊𝒏 𝑹𝒆𝒒𝒖𝒊𝒓𝒆𝒅*\n𝑴𝒂𝒌𝒆 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏 𝒇𝒊𝒓𝒔𝒕.");
    }

    // ─── INIT GLOBAL ───
    if (!global.ANTIBAD_STATUS) global.ANTIBAD_STATUS = {};
    if (!global.ANTIBAD_ACTION) global.ANTIBAD_ACTION = {};
    if (!global.ANTIBAD_WARN) global.ANTIBAD_WARN = {};

    // ─── GET ARGUMENT ───
    const action = args[0]?.toLowerCase() || '';
    const actionType = args[1]?.toLowerCase() || 'warn';

    // ─── SHOW STATUS ───
    if (!action || (action !== 'on' && action !== 'off')) {
        const status = global.ANTIBAD_STATUS[from] ? '✅ ON' : '❌ OFF';
        const actionMode = global.ANTIBAD_ACTION[from] || 'warn';
        
        return reply(`🚫 *𝑨𝒏𝒕𝒊-𝑩𝒂𝒅 𝑾𝒐𝒓𝒅𝒔*

📌 *𝑺𝒕𝒂𝒕𝒖𝒔:* ${status}
⚡ *𝑨𝒄𝒕𝒊𝒐𝒏:* ${actionMode.toUpperCase()}

📌 *𝑪𝒐𝒎𝒎𝒂𝒏𝒅𝒔:*
• ${prefix}antibad on warn — 𝑾𝒂𝒓𝒏 𝒐𝒏 𝒃𝒂𝒅 𝒘𝒐𝒓𝒅𝒔
• ${prefix}antibad on delete — 𝑫𝒆𝒍𝒆𝒕𝒆 𝒃𝒂𝒅 𝒘𝒐𝒓𝒅𝒔
• ${prefix}antibad on kick — 𝑲𝒊𝒄𝒌 𝒐𝒏 𝒃𝒂𝒅 𝒘𝒐𝒓𝒅𝒔
• ${prefix}antibad off — 𝑫𝒊𝒔𝒂𝒃𝒍𝒆 𝒔𝒚𝒔𝒕𝒆𝒎

💖 *Powered by MAZARI-MD*`);
    }

    // ─── TOGGLE ON ───
    if (action === 'on') {
        global.ANTIBAD_STATUS[from] = true;
        global.ANTIBAD_ACTION[from] = actionType || 'warn';
        
        const actionMsg = {
            'warn': '⚠️ Warn user',
            'delete': '🗑️ Delete message + Warn',
            'kick': '👢 Kick user + Warn'
        }[actionType] || '⚠️ Warn user';

        await reply(`✅ *𝑨𝒏𝒕𝒊-𝑩𝒂𝒅 𝑾𝒐𝒓𝒅𝒔 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅!*

📌 *𝑨𝒄𝒕𝒊𝒐𝒏:* ${actionMsg}
🛡️ *𝑩𝒂𝒅 𝒘𝒐𝒓𝒅𝒔 𝒘𝒊𝒍𝒍 𝒏𝒐𝒘 𝒃𝒆 𝒇𝒊𝒍𝒕𝒆𝒓𝒆𝒅.*

💖 Powered by MAZARI-MD`);

        await conn.sendMessage(from, {
            text: `╭────────────────────◇
│✦ *🚫 ANTI-BAD ACTIVATED* 🔥
│✦ Group: ${mek.pushName || 'Unknown'}
│✦ Status: ✅ ON
│✦ Action: ${actionMsg}
│✦ Admin: @${mek.key.participant?.split('@')[0] || 'Unknown'}
╰────────────────────○
*© Powered by MAZARI-MD*`,
            mentions: [mek.key.participant]
        });

    // ─── TOGGLE OFF ───
    } else if (action === 'off') {
        global.ANTIBAD_STATUS[from] = false;
        delete global.ANTIBAD_ACTION[from];
        
        await reply(`❌ *𝑨𝒏𝒕𝒊-𝑩𝒂𝒅 𝑫𝒆𝒂𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅!*

📌 *𝑩𝒂𝒅 𝒘𝒐𝒓𝒅 𝒇𝒊𝒍𝒕𝒆𝒓𝒊𝒏𝒈 𝒊𝒔 𝒏𝒐𝒘 𝒅𝒊𝒔𝒂𝒃𝒍𝒆𝒅.*

💖 Powered by MAZARI-MD`);
    }
});

// ============================================
// 📌 ANTI-BAD WORDS HANDLER (Auto)
// ============================================

// ─── LISTEN FOR MESSAGES ───
cmd({
    pattern: "antibad_handler",
    on: "body",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, senderNumber, reply }) => {

    // ─── SKIP IF NOT GROUP ───
    if (!isGroup) return;

    // ─── SKIP IF ANTI-BAD OFF ───
    if (!global.ANTIBAD_STATUS?.[from]) return;

    // ─── SKIP IF BOT NOT ADMIN ───
    if (!isBotAdmins) return;

    // ─── SKIP ADMINS & OWNER ───
    if (isAdmins || isOwner) return;

    // ─── GET MESSAGE BODY ───
    const body = mek.message?.conversation || 
                 mek.message?.extendedTextMessage?.text || 
                 mek.message?.imageMessage?.caption ||
                 mek.message?.videoMessage?.caption || '';
    
    if (!body) return;

    // ─── CHECK FOR BAD WORDS ───
    let foundBadWord = false;
    let badWord = '';

    // Check word list
    for (const word of BAD_WORDS) {
        if (body.toLowerCase().includes(word.toLowerCase())) {
            foundBadWord = true;
            badWord = word;
            break;
        }
    }

    // Check patterns
    if (!foundBadWord) {
        for (const pattern of BAD_PATTERNS) {
            if (pattern.test(body)) {
                foundBadWord = true;
                badWord = body.match(pattern)?.[0] || 'bad word';
                break;
            }
        }
    }

    if (!foundBadWord) return;

    // ─── GET ACTION ───
    const action = global.ANTIBAD_ACTION[from] || 'warn';

    // ─── INIT WARN COUNT ───
    if (!global.ANTIBAD_WARN[from]) global.ANTIBAD_WARN[from] = {};
    if (!global.ANTIBAD_WARN[from][senderNumber]) global.ANTIBAD_WARN[from][senderNumber] = 0;

    // ─── INCREMENT WARN ───
    global.ANTIBAD_WARN[from][senderNumber]++;

    // ─── WARN USER ───
    const warnCount = global.ANTIBAD_WARN[from][senderNumber];
    const maxWarns = 3;
    const warnMsg = `⚠️ *𝑩𝒂𝒅 𝑾𝒐𝒓𝒅 𝑫𝒆𝒕𝒆𝒄𝒕𝒆𝒅*

📌 *𝑾𝒐𝒓𝒅:* \`${badWord}\`
👤 *𝑼𝒔𝒆𝒓:* @${senderNumber}
📊 *𝑾𝒂𝒓𝒏𝒊𝒏𝒈:* ${warnCount}/${maxWarns}

💖 Powered by MAZARI-MD`;

    await conn.sendMessage(from, {
        text: warnMsg,
        mentions: [sender]
    }, { quoted: mek });

    // ─── DELETE BAD MESSAGE ───
    try {
        await conn.sendMessage(from, {
            delete: mek.key
        });
        console.log(`[AntiBad] 🗑️ Deleted bad message from ${senderNumber}`);
    } catch (e) {
        console.log('[AntiBad] Delete error:', e.message);
    }

    // ─── ACTION: KICK ───
    if (action === 'kick' && warnCount >= maxWarns) {
        try {
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, {
                text: ` *𝑼𝒔𝒆𝒓 𝑹𝒆𝒎𝒐𝒗𝒆𝒅*

📌 *𝑹𝒆𝒂𝒔𝒐𝒏:* 𝑹𝒆𝒑𝒆𝒂𝒕𝒆𝒅 𝒃𝒂𝒅 𝒘𝒐𝒓𝒅𝒔 (${warnCount} 𝒘𝒂𝒓𝒏s)
👤 *𝑼𝒔𝒆𝒓:* @${senderNumber}

💖 Powered by MAZARI-MD`,
                mentions: [sender]
            }, { quoted: mek });
            
            delete global.ANTIBAD_WARN[from][senderNumber];
            console.log(`[AntiBad] 👢 Kicked ${senderNumber} for bad words`);
        } catch (e) {
            console.log('[AntiBad] Kick error:', e.message);
        }
    }
});

console.log('🚫 MAZARI-MD - Anti-Bad Words Plugin Loaded! 💖');
