import 'dotenv/config';
import {Routes} from 'discord.js';
import {REST} from '@discordjs/rest';
import musicCommands from './musicCommands.js';

const commands = [
  musicCommands,
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN ?? '');

try {
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENTID ?? '', process.env.GUILDID ?? ''),
    { body: commands });
} catch (exception) {
  console.debug(`Slash Command Error: ${exception}`);
  process.exit(1);
}

console.debug('Slash commands registered');
