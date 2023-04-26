import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { getLogger } from 'log4js';

export const discord = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

discord.login(process.env.DISCORD_TOKEN);

export let channel: TextChannel | undefined;

discord.on('ready', () => {
  getLogger().info(`Logged in as ${discord.user?.tag}!`);

  channel = discord.channels.cache.get(process.env.DISCORD_CHANNEL_ID || '') as TextChannel;

  if (channel) {
    getLogger().info(`Discord channel found -> ${channel}`);
  } else {
    getLogger().info(`Discord channel not found.`);
    throw 'Discord channel not found.';
  }
});
