import { ChatInputCommandInteraction, Client, GuildMember, TextChannel, Collection, Message } from 'discord.js';
import { getUserIdFromUsername } from '../../utils/userUtils';
import { getUserMessages } from '../../utils/userMessageUtils';
import { generateExampleMessage } from '../../service/messageGenerator';
import * as path from 'path';
import * as fs from 'fs';
import { config as appConfig } from "../../config";
import { maskId, maskUsername } from '../../utils/maskData';

// Cache directory - matching the one in userMessageUtils
const CACHE_DIR = path.join(__dirname, '../../../cache');

/**
 * Save user messages to cache
 */
async function saveUserMessagesToCache(messages: Message[], userId: string, guildId: string, channelId: string, timeSpanMonths: number): Promise<void> {
  const userCacheFilePath = path.join(
    CACHE_DIR,
    `user_${userId}_guild_${guildId}_channel_${channelId}_${timeSpanMonths}m.json`
  );
  
  // Convert Message objects to plain objects for storage
  const messagesToCache = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    author: {
      id: msg.author.id,
      username: msg.author.username
    }
  }));
  
  const cacheData = {
    fetchDate: new Date().toISOString(),
    guildId,
    channelId,
    timeSpanMonths,
    userId,
    messageCount: messages.length,
    messages: messagesToCache
  };
  
  fs.writeFileSync(userCacheFilePath, JSON.stringify(cacheData, null, 2), 'utf-8');
  console.log(`Cached ${messages.length} messages for user ${userId} to ${userCacheFilePath}`);
}

/**
 * Fetch messages for a specific user from a channel
 */
async function fetchUserMessages(userId: string, channel: TextChannel, timeSpanMonths: number = 3): Promise<Message[]> {
  // Check if user is excluded
  if (appConfig.excludedUsers.includes(userId)) {
    console.log(`User ${maskId(userId)} is in excluded list. Skipping message fetch.`);
    return [];
  }
  
  const messages: Message[] = [];
  let lastId: string | undefined = undefined;
  let batchCount = 0;
  const MAX_BATCHES = 30; // Maximum number of batches to attempt
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - timeSpanMonths);
  console.log(`Fetching messages for user ${maskId(userId)} from ${cutoffDate.toISOString()} to now`);

  while (batchCount < MAX_BATCHES) {
    console.log(`Fetching batch ${++batchCount}${lastId ? ` before message ${lastId}` : ''}`);
    
    const fetchOptions = { limit: 100 } as { limit: number; before?: string };
    if (lastId) {
      fetchOptions.before = lastId;
    }

    try {
      const messageBatch = await channel.messages.fetch(fetchOptions);
      
      if (messageBatch.size === 0) {
        console.log('No more messages to fetch');
        break;
      }

      const messageArray = Array.from(messageBatch.values());
      
      // Filter by user and date
      const filteredMessages = messageArray.filter(
        (msg) => msg.author.id === userId && 
                msg.createdAt > cutoffDate &&
                !appConfig.excludedUsers.includes(msg.author.id)
      );
      
      if (messageArray.every(msg => msg.createdAt < cutoffDate)) {
        console.log('Reached messages older than cutoff date');
        break;
      }

      messages.push(...filteredMessages);
      console.log(`Batch ${batchCount}: Found ${filteredMessages.length} messages from user ${userId}`);

      const lastMessage = messageBatch.last();
      if (lastMessage) {
        lastId = lastMessage.id;
      }
    } catch (error) {
      console.error("Error fetching message batch:", error);
      break;
    }

    // If we've reached the maximum number of batches and found nothing, give up
    if (batchCount >= MAX_BATCHES && messages.length === 0) {
      console.log(`Reached maximum batch limit (${MAX_BATCHES}) with no messages found. Giving up.`);
      break;
    }
  }

  console.log(`Total messages collected for user ${maskId(userId)}: ${messages.length}`);
  return messages;
}

export async function handleSimpCommand(interaction: ChatInputCommandInteraction, client: Client) {
  await interaction.deferReply(); // Show a loading state while we process
  
  try {
    // Get the username parameter
    const username = interaction.options.getString('username', true);
    const maskedUsername = maskUsername(username); // Mask for logs
    console.log(`Processing command for username: ${maskedUsername}`);
    
    const guild = interaction.guild;
    
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    // Find the user by username
    const userId = await getUserIdFromUsername(username, guild);
    
    if (userId) {
      console.log(`Found user ID: ${maskId(userId)}`);
    }
    
    if (!userId) {
      await interaction.editReply(`Could not find user "${username}" in this server.`);
      return;
    }
    
    // Check if the user is in the excluded list
    if (appConfig.excludedUsers.includes(userId)) {
      await interaction.editReply(`Sorry, I can't analyze messages for ${username}.`);
      return;
    }

    // Check if we already have cached messages for this user
    const guildId = guild.id;
    const channelId = interaction.channelId;
    
    // Try to get user messages from cache
    let messages = getUserMessages(userId, guildId, channelId, 3);
    
    // If no cached messages, fetch them from Discord
    if (!messages || messages.length === 0) {
      await interaction.editReply(`No cached messages for ${username}. Fetching message history, please wait...`);
      
      const channel = interaction.channel as TextChannel;
      if (channel) {
        // Fetch messages for this user, passing userId to respect exclude list
        const fetchedMessages = await fetchUserMessages(userId, channel, 3);
        
        if (fetchedMessages.length > 0) {
          // Cache the messages for future use
          await saveUserMessagesToCache(fetchedMessages, userId, guildId, channelId, 3);
          messages = fetchedMessages;
        } else {
          await interaction.editReply(`No messages found for ${username} after searching. They may not be active in this channel.`);
          return;
        }
      } else {
        await interaction.editReply(`Could not access this channel to fetch messages.`);
        return;
      }
    }

    // Get message contents
    const messageContents = messages.map(msg => msg.content);
    
    // Skip empty messages
    const nonEmptyMessages = messageContents.filter(content => content && content.trim().length > 0);
    
    if (nonEmptyMessages.length === 0) {
      await interaction.editReply(`Found ${messages.length} messages from ${username}, but none contain text to analyze.`);
      return;
    }
    
    // Limit to 100 messages to avoid token issues
    const sampleContents = nonEmptyMessages.length > 100 
      ? nonEmptyMessages.slice(0, 100) 
      : nonEmptyMessages;
    
    // Generate an example message
    await interaction.editReply(`Analyzing ${nonEmptyMessages.length} messages from ${username}...`);
    const exampleMessage = await generateExampleMessage(sampleContents);
    
    // Send the simulated message
    await interaction.editReply({
      content: `Here's what ${username} would probably say:`,
      embeds: [{
        description: exampleMessage,
        color: 0x3498db,
        author: {
          name: username,
          icon_url: (interaction.guild?.members.cache.get(userId) as GuildMember)?.displayAvatarURL() || undefined
        },
        footer: {
          text: 'Message generated by AI based on user history'
        }
      }]
    });
    
  } catch (error) {
    console.error('Error handling simp command:', error);
    await interaction.editReply('An error occurred while processing your request. Please try again later.');
  }
}
