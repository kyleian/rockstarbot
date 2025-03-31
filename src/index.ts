import { startBot } from './discord/bot';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env
config();

// Setup required directories
const directories = {
  cache: path.join(__dirname, '../cache'),
  output: path.join(__dirname, '../output')
};

// Create directories if they don't exist
Object.entries(directories).forEach(([name, dir]) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created ${name} directory at ${dir}`);
  }
});

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

export { client };
