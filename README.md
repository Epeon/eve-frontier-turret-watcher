# EVE Frontier Turret Watcher

A lightweight Discord notification service for EVE Frontier Smart Turrets, built for the EVE Frontier x Sui Hackathon 2026.

## Overview

This service polls the Sui blockchain for aggression events emitted by the [EVE Frontier Smart Turret Extension](https://github.com/Epeon/eve-frontier-turret-extension) and sends real-time Discord webhook alerts when your turret detects an attacker.

## Features

- **Real-time alerts** — polls the Sui chain every 5 seconds for aggression events
- **Discord webhooks** — rich embed notifications with attacker details
- **Zero dependencies** — uses Node.js native fetch, no heavy SDK required
- **Configurable** — set your own package ID, webhook URL, and poll interval via .env

## Requirements

- Node.js v18+
- A deployed instance of the EVE Frontier Turret Extension
- A Discord webhook URL

## Installation
```bash
git clone https://github.com/Epeon/eve-frontier-turret-watcher.git
cd eve-frontier-turret-watcher
npm install
```

## Configuration

Copy the example env file and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```
PACKAGE_ID=0xd089c5c7d94951106cb578e55950f9357dc9c50b14e8f2e8b9bb4d5fddd43ac5
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook
POLL_INTERVAL_MS=5000
```

### Getting a Discord Webhook URL

1. Open your Discord server
2. Go to **Server Settings → Integrations → Webhooks**
3. Click **New Webhook**
4. Choose a channel and copy the webhook URL
5. Paste it into your `.env` file

## Usage
```bash
node index.js
```

Example output:
```
Turret watcher started. Monitoring: 0xd089...
Aggression event: {
  "turret_id": "0x1234...",
  "attacker_tribe": 5001
}
Discord alert sent!
```

## Discord Alert Format

When an aggressor is detected, the watcher posts a rich embed to your Discord channel:
```
🚨 Turret Aggression Detected!
Turret ID:      0x1234...
Attacker Tribe: 5001
Time:           Thu, 13 Mar 2026 00:00:00 GMT
```

## How It Works

1. The turret extension emits an `AggressionDetectedEvent` on-chain whenever a confirmed attacker enters targeting range
2. This service polls the Sui RPC endpoint for new events matching your package ID
3. When an event is found, it formats the data and sends a Discord webhook notification
4. The cursor is tracked so events are never processed twice

## Architecture
```
index.js          # Main polling loop and Discord webhook sender
.env              # Configuration (not committed)
.env.example      # Example configuration template
```

## Related

- [EVE Frontier Turret Extension](https://github.com/Epeon/eve-frontier-turret-extension) — the on-chain smart contract this service monitors
- [EVE Frontier](https://evefrontier.com) — the game
- [Sui Blockchain](https://sui.io) — the chain everything runs on

## Hackathon

Built for the **EVE Frontier x Sui Hackathon 2026** (March 11-31, 2026).

- Hackathon registration: [deepsurge.xyz/evefrontier2026](https://deepsurge.xyz/evefrontier2026)
