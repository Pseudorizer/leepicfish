import {Routes, REST} from 'discord.js';
import musicCommands from './musicCommands.js';
import env from '../getEnv.js';
import transcodeCommands from './transcodeCommands.js';

const commands = [
  musicCommands,
  transcodeCommands
].map(command => command.toJSON());

const rest = new REST().setToken(env.token);

try {
  await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId),
    { body: commands });
} catch (exception) {
  console.log(`Slash Command Error: ${exception}`);
  process.exit(1);
}

console.log('Slash commands registered');
