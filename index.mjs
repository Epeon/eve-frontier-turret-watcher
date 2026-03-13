import { JsonRpcProvider } from './node_modules/@mysten/sui.js/dist/index.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
const PACKAGE_ID = process.env.PACKAGE_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000');

let lastCursor = null;

async function poll() {
    try {
        const result = await client.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::turret_extension::AggressionDetectedEvent` },
            cursor: lastCursor,
            limit: 10,
            order: 'ascending'
        });
        for (const event of result.data) {
            console.log('Aggression event:', JSON.stringify(event.parsedJson, null, 2));
        }
        if (result.data.length > 0) lastCursor = result.nextCursor;
    } catch (err) {
        console.error('Poll error:', err.message);
    }
}

console.log('Turret watcher started. Monitoring:', PACKAGE_ID);
poll();
setInterval(poll, POLL_INTERVAL_MS);
