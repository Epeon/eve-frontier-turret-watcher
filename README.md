# EVE Frontier Turret Control Bot

A Discord bot and chain watcher for EVE Frontier Smart Turrets, built for the EVE Frontier x Sui Hackathon 2026.

## Overview

This bot provides a two-way control panel for EVE Frontier Smart Turrets via Discord. It watches the Sui blockchain for aggression events and posts real-time alerts, while also allowing turret owners to change targeting modes and configure friendly tribes directly from Discord slash commands.

## Features

- **Slash command control** - change turret mode and friendly tribe from Discord
- **Real-time aggression alerts** - Discord embeds when your turret detects an attacker
- **On-chain transactions** - mode changes submit real Sui blockchain transactions
- **Status dashboard** - view current turret extension configuration at a glance

## Slash Commands

| Command | Description |
|---------|-------------|
| `/setmode` | Set targeting mode (Whitelist, Aggressor, or Sentry) |
| `/settribe` | Set the friendly tribe ID that the turret will never fire on |
| `/setalertchannel` | Set the current channel to receive aggression alerts |
| `/status` | Show current turret extension configuration |

## Targeting Modes

| Mode | Behavior |
|------|----------|
| Whitelist | Shoots everyone except the configured friendly tribe |
| Aggressor | Only shoots players who have attacked first |
| Sentry | Passive until attacked, then engages aggressors only |

## Requirements

- Node.js v18+
- A deployed instance of the EVE Frontier Turret Extension
- A Discord bot token
- A Discord server

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
PACKAGE_ID=your_package_id
EXTENSION_CONFIG_ID=your_extension_config_id
ADMIN_CAP_ID=your_admin_cap_id
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_WEBHOOK_URL=your_webhook_url
POLL_INTERVAL_MS=5000
SUI_PRIVATE_KEY=your_sui_private_key
```

## Creating a Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **New Application** and name it
3. Click **Bot** and reset/copy your token
4. Enable **Message Content Intent** under Privileged Gateway Intents
5. Go to **OAuth2 > URL Generator**, select `bot` and `applications.commands` scopes
6. Select permissions: Send Messages, Embed Links, Use Slash Commands
7. Copy the generated URL and open it to invite the bot to your server

## Usage

Start the event watcher and bot:
```bash
node index.js    # chain watcher only
node bot.js      # Discord bot with slash commands and alerts
```

In Discord:
1. Run `/setalertchannel` in the channel where you want alerts
2. Run `/setmode` and select your targeting mode
3. Run `/settribe` and enter your friendly tribe ID
4. Run `/status` to confirm everything is configured

## Deployed Contracts (Testnet)

| Object | ID |
|--------|----|
| Package | `0xd089c5c7d94951106cb578e55950f9357dc9c50b14e8f2e8b9bb4d5fddd43ac5` |
| ExtensionConfig | `0x298e700b7b00a16473798c79c4f24bc71ffb6f38bf34166ca29f875eb266841c` |
| AdminCap | `0xca77365947d1187e503fdadd3ccff1647776b05f776ec2fbfe2e40ec230a09e4` |

## How It Works

1. The turret extension emits `AggressionDetectedEvent` on-chain when an attacker enters range
2. The bot polls the Sui RPC every 5 seconds for new events
3. When an event is found it posts a rich embed alert to your Discord alert channel
4. Slash commands use the Sui CLI to sign and submit transactions that update turret configuration on-chain

## Related

- [EVE Frontier Turret Extension](https://github.com/Epeon/eve-frontier-turret-extension) - the on-chain smart contract
- [EVE Frontier](https://evefrontier.com) - the game
- [Sui Blockchain](https://sui.io) - the chain everything runs on

## Hackathon

Built for the **EVE Frontier x Sui Hackathon 2026** (March 11-31, 2026).

- Hackathon registration: [deepsurge.xyz/evefrontier2026](https://deepsurge.xyz/evefrontier2026)
