var commands = [];

function cmd(info, func) {
    var data = info;
    data.function = func;
    
    // Si pas de pattern, on utilise cmdname
    if (!data.pattern && data.cmdname) data.pattern = data.cmdname;
    
    if (!data.alias) data.alias = [];
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!data.desc) data.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!data.category) data.category = 'misc';
    
    // ========== DUPLICATE PROTECTION ==========
    const pattern = data.pattern;
    const aliases = data.alias || [];
    
    // Check for duplicate pattern
    const existingByPattern = commands.find(cmd => cmd.pattern === pattern);
    if (existingByPattern) {
        console.warn(`⚠️  [MAZARI-MD] Duplicate command pattern "${pattern}" detected - skipping registration`);
        return data;
    }
    
    // Check for duplicate aliases
    for (const alias of aliases) {
        const existingByAlias = commands.find(cmd => 
            cmd.pattern === alias || 
            (cmd.alias && cmd.alias.includes(alias))
        );
        if (existingByAlias) {
            console.warn(`⚠️  [MAZARI-MD] Duplicate command alias "${alias}" detected - skipping registration`);
            return data;
        }
    }
    
    commands.push(data);
    return data;
}

module.exports = {
    cmd,
    AddCommand: cmd,
    Function: cmd,
    commands,
};

