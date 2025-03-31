import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from '../../config';
import { maskId } from '../../utils/maskData';

const commands = [
  new SlashCommandBuilder()
    .setName('simp')
    .setDescription('Generate a message in the style of a user')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('The username to mimic')
        .setRequired(true))
    .toJSON(),
];

export async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log('Started refreshing application (/) commands:');
    console.log(`Using Client ID: ${maskId(config.clientId)}`);
    console.log(`Using Guild ID: ${maskId(config.guildId)}`);
    
    // Log each command being registered
    commands.forEach(command => {
      console.log(`• Registering command: /${command.name} - ${command.description}`);
      
      // Log options if any exist
      if (command.options && command.options.length > 0) {
        command.options.forEach((option: any) => {
          console.log(`  - Option: ${option.name} (${option.required ? 'required' : 'optional'})`);
        });
      }
    });

    try {
      // First try to register commands globally (might take up to an hour to propagate)
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands },
      );
      console.log('Commands registered globally (may take up to an hour to appear)');
    } catch (globalError) {
      console.error('Failed to register global commands:', globalError);
    }

    // Also register commands to the specific guild (shows up immediately)
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${commands.length} application (/) commands for guild.`);
  } catch (error) {
    console.error('Error registering slash commands:', error);
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    throw error; // Re-throw so we know if registration failed
  }
}
