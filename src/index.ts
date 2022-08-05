import {Client, GatewayIntentBits} from 'discord.js';
import env from './getEnv.js';
import MusicCommands from './musicCommands.js';

console.log('Starting bot...');

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() || !interaction.member || !interaction.guild) {
    return;
  }

  console.debug(interaction.commandName, interaction.options.getSubcommandGroup(), interaction.options.getSubcommand());


  const commandName = interaction.commandName;
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  if (commandName === 'music') {
    await MusicCommands(interaction, subcommandGroup ?? '', subcommand);
  }
});

await client.login(env.token);

console.log('Bot started!');
