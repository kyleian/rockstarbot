import * as fs from "fs";
import * as path from "path";
import { Message } from "discord.js";
import { maskId, maskSensitiveInfo } from './maskData';

// Define cache directory - matching the one in pollUserData.ts
const CACHE_DIR = path.join(__dirname, '../../cache');

/**
 * Takes a guild cache file and separates messages by user
 * @param guildCacheFilePath Path to guild cache file
 * @returns Map of user IDs to their cache file paths
 */
export function separateMessagesByUser(guildCacheFilePath: string): Record<string, string> {
  try {
    // Read the cache file
    const cacheData = JSON.parse(fs.readFileSync(guildCacheFilePath, 'utf-8'));
    
    // Group messages by user ID
    const messagesByUser: Record<string, any[]> = {};
    
    cacheData.messages.forEach((msg: any) => {
      const userId = msg.author.id;
      if (!messagesByUser[userId]) {
        messagesByUser[userId] = [];
      }
      messagesByUser[userId].push(msg);
    });
    
    // Create individual files for each user
    const userFilePaths: Record<string, string> = {};
    
    for (const userId in messagesByUser) {
      const userMessages = messagesByUser[userId];
      const userCacheFilePath = path.join(
        CACHE_DIR,
        `user_${userId}_guild_${cacheData.guildId}_channel_${cacheData.channelId}_${cacheData.timeSpanMonths}m.json`
      );
      
      // Create a new cache file just for this user's messages
      const userData = {
        fetchDate: cacheData.fetchDate,
        guildId: cacheData.guildId,
        channelId: cacheData.channelId,
        timeSpanMonths: cacheData.timeSpanMonths,
        userId: userId,
        messageCount: userMessages.length,
        messages: userMessages
      };
      
      fs.writeFileSync(userCacheFilePath, JSON.stringify(userData, null, 2), 'utf-8');
      console.log(`Created user cache file with ${userMessages.length} messages for user ${maskSensitiveInfo(userId)}`);
      userFilePaths[userId] = userCacheFilePath;
    }
    
    return userFilePaths;
  } catch (error) {
    console.error("Error separating messages by user:", error);
    return {};
  }
}

/**
 * Get messages for a specific user from cache
 */
export function getUserMessages(userId: string, guildId: string, channelId: string, timeSpanMonths: number): Message[] | null {
  // Check for user-specific cache first
  const userCacheFilePath = path.join(
    CACHE_DIR,
    `user_${userId}_guild_${guildId}_channel_${channelId}_${timeSpanMonths}m.json`
  );
  
  if (fs.existsSync(userCacheFilePath)) {
    try {
      const userData = JSON.parse(fs.readFileSync(userCacheFilePath, 'utf-8'));
      console.log(`Found cached messages for user ${maskId(userId)} from ${userData.fetchDate}`);
      
      // Check if cache is still valid (less than 24 hours old)
      const cacheDate = new Date(userData.fetchDate);
      const now = new Date();
      const cacheAgeHours = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60);
      
      if (cacheAgeHours < 24) {
        console.log(`Using cached user messages (${cacheAgeHours.toFixed(2)} hours old)`);
        return userData.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          author: msg.author
        } as unknown as Message));
      }
    } catch (error) {
      console.error("Error reading user cache file:", error);
    }
  }
  
  // No valid user cache found, check if we can create it from guild cache
  const guildCacheFilePath = path.join(
    CACHE_DIR,
    `guild_${guildId}_channel_${channelId}_${timeSpanMonths}m.json`
  );
  
  if (fs.existsSync(guildCacheFilePath)) {
    console.log(`Separating guild cache into user-specific files...`);
    const userFilePaths = separateMessagesByUser(guildCacheFilePath);
    
    // If we've just created a user file, try to load it
    if (userFilePaths[userId]) {
      return getUserMessages(userId, guildId, channelId, timeSpanMonths);
    }
  }
  
  console.log(`No cached messages found for user ${maskId(userId)}`);
  return null;
}
