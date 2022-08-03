import 'dotenv/config';
import {Client, GatewayIntentBits} from 'discord.js';
import {createAudioPlayer, joinVoiceChannel} from '@discordjs/voice';
import env from './getEnv.js';

console.debug('Starting bot...');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'music') {
    if (interaction.options.getSubcommandGroup() === 'controls') {
      const guild = interaction.guild;

      if (!guild) {
        // ERROR MESSAGE LATER
        return;
      }

      const k = await guild.members.fetch(interaction.user);

      const p = createAudioPlayer();

      const vc = joinVoiceChannel({
        channelId: k.voice.channelId ?? '',
        guildId: env.guildId,
        adapterCreator: guild.voiceAdapterCreator,
      });

      if (interaction.options.getSubcommand() === 'play') {
        const song = interaction.options.getString('song');

        if (!song) {
          await interaction.reply({ content: 'Song argument not found', ephemeral: true });
          return;
        }

        await interaction.reply(`Playing ${interaction.options.getString('song')}`);
      } else if (interaction.options.getSubcommand() === 'pause') {
        await interaction.reply('Paused something');
      } else if (interaction.options.getSubcommand() === 'skip') {
        await interaction.reply('Skipping something');
      }
    } else {
      if (interaction.options.getSubcommand() === 'show-next') {
        await interaction.reply(`Showing the next ${interaction.options.getInteger('amount', false) ?? 1} songs`);
      }
    }
  }
});

await client.login(env.token);

console.debug('Bot started!');
