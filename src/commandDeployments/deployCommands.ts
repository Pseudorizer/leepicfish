import {Routes} from 'discord.js';
import {REST} from '@discordjs/rest';
import musicCommands from './musicCommands.js';
import env from '../getEnv.js';

const commands = [
  musicCommands,
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(env.token);

try {
  await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId),
    { body: commands });
} catch (exception) {
  console.log(`Slash Command Error: ${exception}`);
  process.exit(1);
}

console.log('Slash commands registered');
