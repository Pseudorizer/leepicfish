import {ChatInputCommandInteraction, Client, GatewayIntentBits, Guild, GuildMember} from 'discord.js';
import env from './getEnv.js';
import {createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel} from '@discordjs/voice';
import ytdl from 'ytdl-core';
import ytsr, {Video} from 'ytsr';

console.log('Starting bot...');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
});

const audioPlayer = createAudioPlayer();

const getVc = (targetMember: GuildMember, guild: Guild) => {
  let vc = getVoiceConnection(guild.id);

  if (!vc) {
    vc = joinVoiceChannel({
      guildId: guild.id,
      channelId: targetMember.voice.channelId ?? '',
      adapterCreator: guild.voiceAdapterCreator,
    });
    vc.subscribe(audioPlayer);
  }

  return vc;
};

const stream = async (url: string, interaction: ChatInputCommandInteraction) => {
  const info = await ytdl.getInfo(url);
  const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 251 });

  await interaction.followUp('Starting stream...');

  const audioResource = createAudioResource(ytdl(url, {
    format: format,
  }));
  audioPlayer.play(audioResource);

  return url;
};

const search = async (query: string, interaction: ChatInputCommandInteraction) => {
  await interaction.followUp('Searching...');

  const filterSearch = await ytsr.getFilters(query);
  const filters = filterSearch.get('Type')?.get('Video');

  if (!filters?.url) {
    await interaction.followUp('Failed to get filters');
    return;
  }

  const initialSearchResults = await ytsr(filters.url);
  const searchResults = initialSearchResults.items as Video[];

  if (searchResults.length === 0) {
    await interaction.followUp('No results found :(');
    return;
  }

  await interaction.followUp('Found some results');

  return await stream(searchResults[0].url, interaction);
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() || !interaction.member || !interaction.guild) {
    return;
  }

  console.debug(interaction.commandName, interaction.options.getSubcommandGroup(), interaction.options.getSubcommand());

  const vc = getVc(interaction.member as GuildMember, interaction.guild);


  if (interaction.commandName === 'music') {
    if (interaction.options.getSubcommandGroup() === 'controls') {
      if (vc.state.status === 'disconnected') {
        await interaction.reply('You must have me join a VC first');
      } else if (vc.state.status === 'connecting' || vc.state.status === 'signalling') {
        await interaction.reply('I\'m still connecting hold the fuck on...');
      } else if (vc.state.status === 'ready') {
        if (interaction.options.getSubcommand() === 'play') {
          const song = interaction.options.getString('song');

          if (!song) {
            await interaction.reply({ content: 'Song argument not found', ephemeral: true });
            return;
          }

          await interaction.reply({ content: 'Starting...', ephemeral: true });

          let url;

          if (/^((?:https?:)?\/\/)?((?:www|m)\.)?(youtube(-nocookie)?\.com|youtu.be)(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/.test(
            song)) {
            url = await stream(song, interaction);
          } else {
            url = await search(song, interaction);
          }

          if (url) {
            await interaction.followUp(`Playing ${url}`);
          }
        } else if (interaction.options.getSubcommand() === 'pause') {
          audioPlayer.pause();
          await interaction.reply({ content: 'Paused', ephemeral: true });
        } else if (interaction.options.getSubcommand() === 'skip') {
          await interaction.reply('Skipping something');
        } else if (interaction.options.getSubcommand() === 'unpause') {
          audioPlayer.unpause();
          await interaction.reply({ content: 'Unpaused', ephemeral: true });
        }
      } else {
        console.error(`Unhandled status: ${vc.state.status}`);
        await interaction.reply('idk what\'s going on rn');
      }
    } else {
      if (interaction.options.getSubcommand() === 'show-next') {
        await interaction.reply(`Showing the next ${interaction.options.getInteger('amount', false) ?? 1} songs`);
      } else if (interaction.options.getSubcommand() === 'leave') {
        vc.destroy(true);
        await interaction.reply('Bot left!');
      } else if (interaction.options.getSubcommand() === 'join') {
        await interaction.reply('I have arrived');
      }
    }
  }
});

await client.login(env.token);

console.log('Bot started!');
