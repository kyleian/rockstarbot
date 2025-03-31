import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

// Constants
const CACHE_DIR = path.join(__dirname, '../../cache');

/**
 * Removes all cache files related to a specific user ID
 */
function removeUserData(userId: string): void {
  console.log(`Searching for cached data related to user ID: ${userId}`);
  
  // Ensure the cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    console.log('Cache directory does not exist. Nothing to clean.');
    return;
  }
  
  let filesRemoved = 0;
  
  try {
    // Get all files in the cache directory
    const files = fs.readdirSync(CACHE_DIR);
    
    // Look for files matching user_[userId] pattern
    const userFiles = files.filter(file => 
      file.includes(`user_${userId}`) && file.endsWith('.json')
    );
    
    console.log(`Found ${userFiles.length} user-specific cache files to remove.`);
    
    // Delete each file
    userFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`Removed: ${file}`);
      filesRemoved++;
    });
    
    // Now check guild files that might contain this user's data
    const guildFiles = files.filter(file => 
      file.startsWith('guild_') && file.endsWith('.json')
    );
    
    console.log(`Checking ${guildFiles.length} guild cache files for user data...`);
    
    // For each guild file, check if it contains messages from the user
    // If so, filter them out and rewrite the file
    guildFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Check if this file contains messages from the target user
        const userMessages = data.messages.filter((msg: any) => msg.author?.id === userId);
        
        if (userMessages.length > 0) {
          console.log(`Guild file ${file} contains ${userMessages.length} messages from target user.`);
          
          // Remove the user's messages from the file
          const filteredMessages = data.messages.filter((msg: any) => msg.author?.id !== userId);
          data.messages = filteredMessages;
          data.messageCount = filteredMessages.length;
          
          // Save the updated file
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          console.log(`Updated ${file}, removed ${userMessages.length} messages from user ${userId}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    });
    
    console.log(`\nCleanup complete for user ${userId}. Removed ${filesRemoved} user-specific cache files.`);
    console.log(`Checked and filtered messages from ${guildFiles.length} guild cache files.`);
    
  } catch (error) {
    console.error(`Error during cleanup for user ${userId}:`, error);
  }
}

function maskSensitiveData(data: string): string {
  return `${data.substring(0, 4)}...${data.slice(-4)}`;
}

// Main function to process all excluded users
async function cleanExcludedUsersData() {
  console.log('Starting cleanup for excluded users from environment configuration');
  
  // Hide actual user IDs in logs by masking them
  const maskedIds = config.excludedUsers.map(id => maskSensitiveData(id));
  console.log(`Found ${config.excludedUsers.length} excluded users: ${maskedIds.join(', ')}`);
  
  if (config.excludedUsers.length === 0) {
    console.log('No excluded users specified in EXCLUDED_USERS. Nothing to clean.');
    return;
  }
  
  // Process each excluded user
  for (const userId of config.excludedUsers) {
    // Mask user ID in logs
    const maskedId = `${userId.substring(0, 4)}...${userId.slice(-4)}`;
    console.log(`\n--- Processing user ID: ${maskedId} ---`);
    removeUserData(userId);
  }
  
  console.log('\nAll excluded users have been processed.');
}

// Execute the cleanup for all excluded users
cleanExcludedUsersData().catch(error => {
  console.error('Error during excluded users cleanup:', error);
});
