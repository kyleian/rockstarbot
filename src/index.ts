import { startBot } from './discord/bot';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env
config();

// Ensure cache directory exists
const CACHE_DIR = path.join(__dirname, '../cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Ensure output directory exists
const OUTPUT_DIR = path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Setup process error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Keep the process running despite errors
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Keep the process running despite errors
});

// Start the Discord bot service
console.log('Starting Discord bot service...');
const client = startBot();

// Export client for potential programmatic use
export { client };
