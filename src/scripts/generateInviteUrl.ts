import { getInviteUrl } from '../utils/getInviteUrl';
import { config } from 'dotenv';

// Load environment variables
config();

// Generate and display invite URL
const inviteUrl = getInviteUrl();
console.log('Use this URL to invite the bot to your server:');
console.log(inviteUrl);
