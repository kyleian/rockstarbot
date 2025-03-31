import { config as dotenvConfig } from 'dotenv';
import { maskId } from './utils/maskData';

// Load .env file
dotenvConfig();

export const config = {
  // Discord configuration
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  
  // Service configuration
  timeSpanMonths: parseInt(process.env.TIME_SPAN_MONTHS || '3', 10),
  cacheExpiryHours: parseInt(process.env.CACHE_EXPIRY_HOURS || '24', 10),
  
  // User filtering
  excludedUsers: (process.env.EXCLUDED_USERS || '')
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0),
  
  // OpenAI configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Default model
  openaiAnalysisModel: process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Model for analysis
  openaiSimulationModel: process.env.OPENAI_SIMULATION_MODEL || process.env.OPENAI_MODEL || 'gpt-4', // Model for user simulation
  
  // Claude configuration
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  useClaudeModel: process.env.USE_CLAUDE === 'true',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-2.1',
  
  // System paths
  cacheDir: process.env.CACHE_DIR || 'cache',
  outputDir: process.env.OUTPUT_DIR || 'output',

  // User ID
  userId: process.env.USER_ID || '',
  
  // Add validation logging that masks sensitive data
  validate() {
    const checks = [
      { name: 'DISCORD_TOKEN', value: this.token?.substring(0, 8) + '...' },
      { name: 'CLIENT_ID', value: maskId(this.clientId) },
      { name: 'GUILD_ID', value: maskId(this.guildId) },
      { name: 'USER_ID', value: this.userId ? maskId(this.userId) : 'not set' },
      { name: 'OPENAI_API_KEY', value: this.openaiApiKey?.substring(0, 3) + '...' },
      { name: 'CLAUDE_API_KEY', value: this.claudeApiKey ? '***' : 'not set' }
    ];
    
    checks.forEach(({name, value}) => {
      console.log(`Loaded ${name}: ${value}`);
    });
  }
};

// Validate required configuration
if (!config.token) throw new Error('DISCORD_TOKEN is required');
if (!config.clientId) throw new Error('CLIENT_ID is required');
if (!config.guildId) throw new Error('GUILD_ID is required');
if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY is required');

// Add Claude validation if enabled
if (config.useClaudeModel && !config.claudeApiKey) {
  throw new Error('CLAUDE_API_KEY is required when USE_CLAUDE is true');
}

config.validate();
