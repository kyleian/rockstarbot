import * as fs from "fs";
import * as path from "path";
import { separateMessagesByUser } from "../utils/userMessageUtils";
import { config } from "dotenv";

// Load environment variables from .env
config();

const CACHE_DIR = path.join(__dirname, '../../cache');

/**
 * Find all guild cache files and separate them by user
 */
async function separateAllGuildCaches() {
    console.log(`Looking for guild cache files in ${CACHE_DIR}`);
    
    try {
        // Get all files in the cache directory
        const files = fs.readdirSync(CACHE_DIR);
        
        // Filter for guild cache files
        const guildCacheFiles = files.filter(file => file.startsWith('guild_') && file.endsWith('.json'));
        
        if (guildCacheFiles.length === 0) {
            console.log("No guild cache files found. Run pollUserData first.");
            return;
        }
        
        console.log(`Found ${guildCacheFiles.length} guild cache files`);
        
        // Process each guild cache file
        for (const file of guildCacheFiles) {
            const filePath = path.join(CACHE_DIR, file);
            console.log(`Processing ${file}...`);
            
            // Separate messages by user
            const userFilePaths = separateMessagesByUser(filePath);
            const userCount = Object.keys(userFilePaths).length;
            
            console.log(`Generated ${userCount} user cache files from ${file}`);
            
            // Report on individual users
            Object.entries(userFilePaths).forEach(([userId, filePath]) => {
                try {
                    const userData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    console.log(`  - User ${userId}: ${userData.messageCount} messages`);
                } catch (e) {
                    console.log(`  - User ${userId}: unknown message count`);
                }
            });
        }
        
        console.log("\nDone! User cache files are ready to use.");
    } catch (error) {
        console.error("Error processing cache files:", error);
    }
}

// Run the script
separateAllGuildCaches().catch(console.error);
