import { PermissionsBitField, TextChannel } from 'discord.js';
import { config } from '../config';

export function getInviteUrl() {
    const permissions = new PermissionsBitField([
        'ViewChannel',
        'ReadMessageHistory',
        'SendMessages',
        'ManageMessages',
        'EmbedLinks',
        'AttachFiles',
        'UseExternalEmojis',
        'AddReactions',
        'UseApplicationCommands'
    ]).bitfield;

    const baseUrl = 'https://discord.com/api/oauth2/authorize';
    const params = new URLSearchParams({
        client_id: config.clientId,
        scope: 'bot applications.commands', // Both bot and application.commands scopes are needed
        permissions: permissions.toString(),
    });
    
    return `${baseUrl}?${params.toString()}`;
}

export async function createServerInvite(channel: TextChannel) {
    try {
        const invite = await channel.createInvite({
            maxAge: 0, // 0 = never expires
            maxUses: 0 // 0 = unlimited uses
        });
        return invite.url;
    } catch (error) {
        console.error('Failed to create invite:', error);
        return null;
    }
}

// Use this function to get the URL, then reinvite the bot to the server
// console.log(getInviteUrl());
