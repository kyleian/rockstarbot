import { Client, GatewayIntentBits, Collection, Message, Guild, TextChannel, DMChannel } from "discord.js";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { config as appConfig } from "../config";

config(); // Load environment variables

const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
const FETCH_MODE = process.env.FETCH_MODE as string; // "guild" or "dm"
const GUILD_ID = process.env.GUILD_ID as string;
const CHANNEL_ID = process.env.CHANNEL_ID as string;
const USER_ID = process.env.USER_ID as string;

// Define cache directory
const CACHE_DIR = path.join(__dirname, '../../cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Get cached messages if they exist
 */
function getCachedMessages(guildId: string, channelId: string, timeSpanMonths: number): Message[] | null {
  const cacheFilePath = path.join(CACHE_DIR, `guild_${guildId}_channel_${channelId}_${timeSpanMonths}m.json`);
  
  if (fs.existsSync(cacheFilePath)) {
    try {
      const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
      console.log(`Found cached messages from ${cacheData.fetchDate}`);
      
      // Check if cache is still valid (less than 24 hours old)
      const cacheDate = new Date(cacheData.fetchDate);
      const now = new Date();
      const cacheAgeHours = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60);
      
      if (cacheAgeHours < 24) {
        console.log(`Using cached messages (${cacheAgeHours.toFixed(2)} hours old)`);
        return cacheData.messages.map((msg: any) => {
          // Convert back to partial Message objects with essential properties
          return {
            id: msg.id,
            content: msg.content,
            createdAt: new Date(msg.createdAt),
            author: msg.author
          } as unknown as Message;
        });
      } else {
        console.log(`Cache is ${cacheAgeHours.toFixed(2)} hours old, fetching fresh data`);
        return null;
      }
    } catch (error) {
      console.error("Error reading cache file:", error);
      return null;
    }
  }
  return null;
}

/**
 * Save messages to cache
 */
function saveMessagesToCache(messages: Message[], guildId: string, channelId: string, timeSpanMonths: number): void {
  const cacheFilePath = path.join(CACHE_DIR, `guild_${guildId}_channel_${channelId}_${timeSpanMonths}m.json`);
  
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
    messageCount: messages.length,
    messages: messagesToCache
  };
  
  fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2), 'utf-8');
  console.log(`Cached ${messages.length} messages to ${cacheFilePath}`);
}

// Add utility function for masking sensitive data
function maskSensitiveData(data: string): string {
  return `${data.substring(0, 4)}...${data.slice(-4)}`;
}

export async function pollUserData(
    providedClient?: Client,
    guildId: string = GUILD_ID,
    channelId: string = CHANNEL_ID,
    timeSpanMonths: number = 3,
    userId?: string
): Promise<Message[]> {
    // Don't fetch data for excluded users
    if (userId && appConfig.excludedUsers.includes(userId)) {
        // Mask user ID in logs
        const maskedId = userId ? `${userId.substring(0, 4)}...${userId.slice(-4)}` : 'undefined';
        console.log(`User ${maskedId} is in excluded list. Skipping message polling.`);
        return [];
    }

    // Check cache first
    const cachedMessages = getCachedMessages(guildId, channelId, timeSpanMonths);
    if (cachedMessages) {
        return cachedMessages;
    }
    
    const client = providedClient || new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages
        ],
    });

    if (!providedClient) {
        await client.login(DISCORD_TOKEN);
        console.log(`Logged in as ${maskSensitiveData(client.user?.tag || '')}`);
    }

    try {
        console.log("Accessible guilds:");
        client.guilds.cache.forEach((guild) => {
            console.log(`- ${guild.name} (${maskSensitiveData(guild.id)})`);
        });

        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
            console.log('Guild not found!');
            return [];
        }
        console.log(`Guild found: ${guild.name} (${maskSensitiveData(guild.id)})`);

        const channel = await guild.channels.fetch(channelId) as TextChannel;
        if (!channel) {
            console.log('Channel not found!');
            return [];
        }
        console.log(`Channel found: ${channel.name} (${maskSensitiveData(channel.id)})`);

        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - timeSpanMonths);
        console.log(`Fetching messages from ${cutoffDate.toISOString()} to now`);

        const messages: Message[] = [];
        let lastId: string | undefined = undefined;
        let batchCount = 0;
        const MAX_BATCHES = 30; // Limit to prevent excessive fetching

        while (batchCount < MAX_BATCHES) {
            console.log(`Fetching batch ${++batchCount}${lastId ? ` before message ${lastId}` : ''}`);
            
            // Properly type the fetch options
            const fetchOptions = { limit: 100 } as { limit: number; before?: string };
            if (lastId) {
                fetchOptions.before = lastId;
            }

            try {
                // Get messages as a Collection
                const messageBatch = await channel.messages.fetch(fetchOptions);
                
                if (messageBatch.size === 0) {
                    console.log('No more messages to fetch');
                    break;
                }

                // Convert the Collection to an array of properly typed Message objects
                const messageArray = Array.from(messageBatch.values()) as Message[];
                
                // Filter messages by date and exclude specified users
                const filteredMessages = messageArray.filter(
                    (msg) => msg.createdAt > cutoffDate && 
                             !appConfig.excludedUsers.includes(msg.author.id)
                );
                
                if (filteredMessages.length === 0) {
                    console.log('No messages found in this batch that meet criteria');
                    
                    // If we've hit our batch limit with no results, give up
                    if (batchCount >= MAX_BATCHES) {
                        console.log(`Reached maximum batch limit (${MAX_BATCHES}) with no valid messages found. Giving up.`);
                        break;
                    }
                } else {
                    // Add messages to our collection
                    messages.push(...filteredMessages);
                    console.log(`Batch ${batchCount}: Found ${filteredMessages.length} messages within timespan`);
                }

                // Get the ID of the last message for pagination
                const lastMessage = messageBatch.last();
                if (lastMessage) {
                    lastId = lastMessage.id;
                }
            } catch (error) {
                console.error("Error fetching message batch:", error);
                break;
            }
        }

        console.log(`Total messages collected: ${messages.length}`);
        
        // Cache the messages for future use
        saveMessagesToCache(messages, guildId, channelId, timeSpanMonths);
        
        return messages;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    } finally {
        if (!providedClient) {
            client.destroy();
        }
    }
}

// Remove or deprecate pollUserDataOld
