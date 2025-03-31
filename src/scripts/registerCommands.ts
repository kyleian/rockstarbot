import { registerCommands } from '../discord/commands/registerCommands';
import { config } from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { config as appConfig } from '../config';

// Load environment variables
config();

async function main() {
  console.log('Registering slash commands with Discord...');
  
  // Create a temporary client to get the correct bot ID
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  
  try {
    // Login to get the bot ID
    await client.login(appConfig.token);
    
    // Wait for the client to be ready
    await new Promise<void>((resolve) => {
      client.once('ready', () => {
        console.log(`Logged in as ${client.user?.tag}`);
        
        // Update the client ID if it doesn't match
        if (client.user && client.user.id !== appConfig.clientId) {
          console.log(`Updating client ID from ${appConfig.clientId} to ${client.user.id}`);
          appConfig.clientId = client.user.id;
        }
        
        resolve();
      });
    });
    
    // Register the commands
    await registerCommands();
    console.log('Commands registered successfully!');
  } catch (error) {
    console.error('Failed to register commands:', error);
  } finally {
    // Always destroy the client
    client.destroy();
  }
}

main().catch(console.error);
