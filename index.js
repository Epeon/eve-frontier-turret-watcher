require('dotenv').config();

const PACKAGE_ID = process.env.PACKAGE_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000');
const RPC_URL = 'https://fullnode.testnet.sui.io:443';

let lastCursor = null;

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

async function sendDiscordAlert(event) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') return;
    const data = event.parsedJson;
    await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [{
                title: 'Turret Aggression Detected!',
                color: 0xff0000,
                fields: [
                    { name: 'Turret ID', value: String(data.turret_id), inline: false },
                    { name: 'Attacker Tribe', value: String(data.attacker_tribe), inline: true },
                    { name: 'Time', value: new Date().toUTCString(), inline: false },
                ],
                footer: { text: 'EVE Frontier Turret Watcher' }
            }]
        })
    });
    console.log('Discord alert sent!');
}

async function poll() {
    try {
        const result = await rpc('suix_queryEvents', [
            { MoveEventType: `${PACKAGE_ID}::turret_extension::AggressionDetectedEvent` },
            lastCursor,
            10,
            false
        ]);
        for (const event of result.data) {
            console.log('Aggression event:', JSON.stringify(event.parsedJson, null, 2));
            await sendDiscordAlert(event);
        }
        if (result.data.length > 0) lastCursor = result.nextCursor;
    } catch (err) {
        console.error('Poll error:', err.message);
    }
}

console.log('Turret watcher started. Monitoring:', PACKAGE_ID);
poll();
setInterval(poll, POLL_INTERVAL_MS);
