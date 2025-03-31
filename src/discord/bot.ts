import { Client, Events, GatewayIntentBits, Interaction } from 'discord.js';
import { config } from '../config';
import { registerCommands } from './commands/registerCommands';
import { handleSimpCommand } from './commands/commandHandler';
import { maskId } from '../utils/maskData';

export function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  // Register event handlers
  client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag.split('#')[0]}#****`);
    console.log(`Bot ID: ${maskId(c.user.id)}`);
    
    // Make sure the client ID matches our configured ID
    if (c.user.id !== config.clientId) {
      console.warn(`Warning: The bot's actual ID (${maskId(c.user.id)}) doesn't match the configured CLIENT_ID (${maskId(config.clientId)})`);
      console.warn('Updating client ID to match the bot');
      config.clientId = c.user.id;
    }
    
    try {
      // Register slash commands
      await registerCommands();
    } catch (error) {
      console.error("Failed to register commands on startup:", error);
    }
  });

  // Handle slash command interactions
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'simp') {
      await handleSimpCommand(interaction, client);
    }
  });

  // Login to Discord
  client.login(config.token).catch(console.error);

  return client;
}
