const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const PACKAGE_ID = process.env.PACKAGE_ID;
const EXTENSION_CONFIG_ID = process.env.EXTENSION_CONFIG_ID;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000');
const RPC_URL = 'https://fullnode.testnet.sui.io:443';

let lastCursor = null;
let alertChannelId = null;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('setmode').setDescription('Set turret targeting mode')
        .addIntegerOption(opt => opt.setName('mode').setDescription('1=Whitelist 2=Aggressor 3=Sentry').setRequired(true)
            .addChoices(
                { name: 'Whitelist - shoot all except friendly tribe', value: 1 },
                { name: 'Aggressor - only shoot confirmed attackers', value: 2 },
                { name: 'Sentry - passive until attacked', value: 3 },
            )),
    new SlashCommandBuilder().setName('settribe').setDescription('Set the friendly tribe ID')
        .addIntegerOption(opt => opt.setName('tribe').setDescription('Tribe ID to protect').setRequired(true)),
    new SlashCommandBuilder().setName('setalertchannel').setDescription('Set this channel as the aggression alert channel'),
    new SlashCommandBuilder().setName('status').setDescription('Show current turret extension status'),
].map(cmd => cmd.toJSON());

async function rpc(method, params) {
    const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
}

async function suiCall(fn, args) {
    const { execSync } = require('child_process');
    const argStr = args.map(a => a.toString()).join(' ');
    const cmd = 'sui client call --package ' + PACKAGE_ID + ' --module turret_extension --function ' + fn + ' --args ' + argStr + ' --gas-budget 10000000';
    try {
        const result = execSync(cmd, { encoding: 'utf8' });
        const digestMatch = result.match(/Transaction Digest: (\S+)/);
        return digestMatch ? digestMatch[1] : 'unknown';
    } catch (err) {
        throw new Error(err.stderr || err.message);
    }
}

client.once('ready', async () => {
    console.log('Bot logged in as ' + client.user.tag);
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    for (const guild of client.guilds.cache.values()) {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands });
    }
    console.log('Slash commands registered');
    setInterval(pollEvents, POLL_INTERVAL_MS);
});

client.on('interactionCreate', async interaction => {
    await interaction.deferReply();
    try {
        if (interaction.commandName === 'setmode') {
            const mode = interaction.options.getInteger('mode');
            const modeNames = { 1: 'Whitelist', 2: 'Aggressor', 3: 'Sentry' };
            const digest = await suiCall('set_mode', [EXTENSION_CONFIG_ID, ADMIN_CAP_ID, mode]);
            const embed = new EmbedBuilder().setTitle('Turret Mode Updated').setColor(0x00ff00)
                .addFields({ name: 'New Mode', value: modeNames[mode], inline: true }, { name: 'Transaction', value: digest, inline: false });
            await interaction.editReply({ embeds: [embed] });
        } else if (interaction.commandName === 'settribe') {
            const tribe = interaction.options.getInteger('tribe');
            const digest = await suiCall('set_allowed_tribe', [EXTENSION_CONFIG_ID, ADMIN_CAP_ID, tribe]);
            const embed = new EmbedBuilder().setTitle('Friendly Tribe Updated').setColor(0x00ff00)
                .addFields({ name: 'Protected Tribe ID', value: String(tribe), inline: true }, { name: 'Transaction', value: digest, inline: false });
            await interaction.editReply({ embeds: [embed] });
        } else if (interaction.commandName === 'setalertchannel') {
            alertChannelId = interaction.channelId;
            await interaction.editReply('This channel will now receive turret aggression alerts!');
        } else if (interaction.commandName === 'status') {
            const embed = new EmbedBuilder().setTitle('EVE Frontier Turret Extension Status').setColor(0x0099ff)
                .addFields(
                    { name: 'Package ID', value: PACKAGE_ID, inline: false },
                    { name: 'Extension Config', value: EXTENSION_CONFIG_ID, inline: false },
                    { name: 'Alert Channel', value: alertChannelId ? '<#' + alertChannelId + '>' : 'Not set - use /setalertchannel', inline: false },
                    { name: 'Polling Interval', value: POLL_INTERVAL_MS + 'ms', inline: true }
                );
            await interaction.editReply({ embeds: [embed] });
        }
    } catch (err) {
        await interaction.editReply('Error: ' + err.message);
    }
});

async function pollEvents() {
    try {
        const result = await rpc('suix_queryEvents', [
            { MoveEventType: PACKAGE_ID + '::turret_extension::AggressionDetectedEvent' },
            lastCursor,
            10,
            false
        ]);
        for (const event of result.data) {
            const data = event.parsedJson;
            const channel = client.channels.cache.get(alertChannelId);
            if (channel) {
                const embed = new EmbedBuilder().setTitle('Turret Aggression Detected!').setColor(0xff0000)
                    .addFields(
                        { name: 'Turret ID', value: String(data.turret_id), inline: false },
                        { name: 'Attacker Tribe', value: String(data.attacker_tribe), inline: true },
                        { name: 'Time', value: new Date().toUTCString(), inline: false }
                    ).setFooter({ text: 'EVE Frontier Turret Watcher' });
                await channel.send({ embeds: [embed] });
            }
        }
        if (result.data.length > 0) lastCursor = result.nextCursor;
    } catch (err) {
        console.error('Poll error:', err.message);
    }
}

client.login(BOT_TOKEN);
