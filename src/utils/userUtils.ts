import { Collection, Guild, GuildMember } from 'discord.js';

/**
 * Find a user ID by username, display name, or nickname in a guild
 */

// Helper to mask usernames in logs
function maskUsername(username: string): string {
  if (!username || username.length <= 2) return username;
  return `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}`;
}

export async function getUserIdFromUsername(username: string, guild: Guild): Promise<string | null> {
  try {
    console.log(`Looking up user "${maskUsername(username)}" in server "${guild.name}"`);
    
    // Fetch all members (this may take a while for large servers)
    await guild.members.fetch();
    console.log(`Fetched ${guild.members.cache.size} members from the server`);
    
    // First try an exact match (case insensitive) with multiple name fields
    const lowerUsername = username.toLowerCase();
    
    // Try exact match on displayName, username, nickname, and tag
    const exactMatches = guild.members.cache.filter(member => 
      member.displayName.toLowerCase() === lowerUsername ||
      member.user.username.toLowerCase() === lowerUsername || 
      (member.nickname && member.nickname.toLowerCase() === lowerUsername) ||
      member.user.tag.toLowerCase() === lowerUsername
    );
    
    if (exactMatches.size === 1) {
      const member = exactMatches.first()!;
      console.log(`Found exact match: ${maskUsername(member.user.username)} (${maskUsername(member.displayName)})`);
      return member.id;
    } else if (exactMatches.size > 1) {
      console.log(`Found ${exactMatches.size} exact matches. Using the first one.`);
      const member = exactMatches.first()!;
      console.log(`Selected: ${maskUsername(member.user.username)}`);
      return member.id;
    }
    
    // If no exact match, try a partial match
    const partialMatches = guild.members.cache.filter(member => 
      member.displayName.toLowerCase().includes(lowerUsername) ||
      member.user.username.toLowerCase().includes(lowerUsername) || 
      (member.nickname && member.nickname.toLowerCase().includes(lowerUsername))
    );
    
    if (partialMatches.size === 1) {
      const member = partialMatches.first()!;
      console.log(`Found partial match: ${member.user.tag} (${member.displayName})`);
      return member.id;
    } else if (partialMatches.size > 1) {
      console.log(`Found ${partialMatches.size} partial matches. Using the first one.`);
      // Sort by length of name to get closest match
      const sortedMatches = Array.from(partialMatches.values())
        .sort((a, b) => {
          const aName = a.displayName.toLowerCase();
          const bName = b.displayName.toLowerCase();
          
          // Exact match gets priority
          if (aName === lowerUsername) return -1;
          if (bName === lowerUsername) return 1;
          
          // Otherwise sort by shortest name first
          return aName.length - bName.length;
        });
        
      console.log(`Selected: ${sortedMatches[0].user.tag} (${sortedMatches[0].displayName})`);
      return sortedMatches[0].id;
    }
    
    console.log(`No matches found for "${maskUsername(username)}"`);
    return null;
  } catch (error) {
    console.error('Error finding user by username:', error);
    return null;
  }
}
