import {
  ChatInputCommandInteraction, GuildMember,
  InteractionReplyOptions,
  MessagePayload,
  TextChannel,
} from 'discord.js';
import {AudioResource, createAudioPlayer, createAudioResource} from '@discordjs/voice';
import {getVc} from './utils.js';
import ytsr, {Video} from 'ytsr';
import ytdl from 'ytdl-core';
import {clear, dequeue, enqueue, getQueue, setCurrent, toggleRepeat} from './queue.js';
import {client} from './index.js';

const audioPlayer = createAudioPlayer();
let currentAudioResource: AudioResource;
let volume = 1;

type Interaction = (message: string | MessagePayload | InteractionReplyOptions) => Promise<void>

const stream = async (url: string, interaction: Interaction) => {
  const info = await ytdl.getInfo(url);
  const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 251 });

  await interaction('Starting stream...');

  currentAudioResource = createAudioResource(ytdl(url, {
    format: format,
  }), { inlineVolume: true });
  currentAudioResource.volume?.setVolume(volume);
  audioPlayer.play(currentAudioResource);

  return url;
};

const search = async (query: string, interaction: Interaction) => {
  await interaction('Searching...');

  const filterSearch = await ytsr.getFilters(query);
  const filters = filterSearch.get('Type')?.get('Video');

  if (!filters?.url) {
    await interaction('Failed to get filters');
    return;
  }

  const initialSearchResults = await ytsr(filters.url);
  const searchResults = initialSearchResults.items as Video[];

  if (searchResults.length === 0) {
    await interaction('No results found :(');
    return;
  }

  await interaction('Found some results');

  return await stream(searchResults[0].url, interaction);
};

const play = async (url: string, interaction: Interaction) => {
  let finalUrl;

  if (/^((?:https?:)?\/\/)?((?:www|m)\.)?(youtube(-nocookie)?\.com|youtu.be)(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/.test(
    url)) {
    finalUrl = await stream(url, interaction);
  } else {
    finalUrl = await search(url, interaction);
  }

  if (finalUrl) {
    await interaction(`Playing ${finalUrl}`);
  }

  return finalUrl;
};

audioPlayer.on('stateChange', async (oldState, newState) => {
  if (oldState.status === 'playing' && newState.status === 'idle') {
    const next = dequeue();

    if (next) {
      const channel = await client.channels.fetch('733636237826719814') as TextChannel;
      await play(next, async (message) => {
        if (typeof message === 'string') {
          await channel.send(message);
        }
      });
    }
  }
});

const MusicCommands = async (interaction: ChatInputCommandInteraction, subcommandGroup: string, subcommand: string) => {
  if (!interaction.member || !interaction.guild) {
    return;
  }

  const vc = getVc(interaction.member as GuildMember, interaction.guild, audioPlayer);

  if (subcommandGroup === 'controls') {
    if (vc.state.status === 'disconnected') {
      await interaction.reply('You must have me join a VC first');
    } else if (vc.state.status === 'connecting' || vc.state.status === 'signalling') {
      await interaction.reply('I\'m still connecting hold the fuck on...');
    } else if (vc.state.status === 'ready') {
      if (subcommand === 'play') {
        const query = interaction.options.getString('query');

        if (!query) {
          await interaction.reply({ content: 'Query argument not found', ephemeral: true });
          return;
        }

        setCurrent(query);

        await interaction.reply({ content: 'Starting...', ephemeral: true });

        await play(query, async (message) => {
          await interaction.followUp(message);
        });
      } else if (subcommand === 'pause') {
        audioPlayer.pause();
        await interaction.reply({ content: 'Paused', ephemeral: true });
      } else if (subcommand === 'skip') {
        await interaction.reply('Skipping...');

        const next = dequeue();

        if (next) {
          await play(next, async (message) => {
            await interaction.followUp(message);
          });
        } else {
          await interaction.followUp('There are no more songs in the queue');
        }
      } else if (subcommand === 'unpause') {
        audioPlayer.unpause();
        await interaction.reply({ content: 'Unpaused', ephemeral: true });
      } else if (subcommand === 'vol-down') {
        const amount = (interaction.options.getInteger('amount', false) ?? 10) / 100;

        if (volume - amount < 0) {
          volume = 0;
          currentAudioResource.volume?.setVolume(0);
        } else {
          volume -= amount;
          currentAudioResource.volume?.setVolume(volume);
        }

        await interaction.reply({ content: `Volume decreased to ${volume * 100}%`, ephemeral: true });
      } else if (subcommand === 'vol-up') {
        const amount = (interaction.options.getInteger('amount', false) ?? 10) / 100;

        if (volume + amount > 1.5) {
          volume = 1.5;
          currentAudioResource.volume?.setVolume(1.5);
        } else {
          volume += amount;
          currentAudioResource.volume?.setVolume(volume);
        }

        await interaction.reply({ content: `Volume increased to ${volume * 100}%`, ephemeral: true });
      } else if (subcommand === 'stop') {
        toggleRepeat(false);
        clear();
        audioPlayer.stop();
        await interaction.reply('Audio stopped');
      } else if (subcommand === 'enqueue') {
        const query = interaction.options.getString('query');

        if (!query) {
          await interaction.reply({ content: 'Query argument not found', ephemeral: true });
          return;
        }

        enqueue(query);
        await interaction.reply('Song enqueued');
      } else if (subcommand === 'repeat-song') {
        const current = toggleRepeat();
        await interaction.reply(`Repeat ${current ? 'enabled' : 'disabled'}`);
      }
    } else {
      console.error(`Unhandled status: ${vc.state.status}`);
      await interaction.reply('idk what\'s going on rn');
    }
  } else {
    if (subcommand === 'show-next') {
      await interaction.reply(`Showing the next ${interaction.options.getInteger('amount', false) ?? 1} songs`);
    } else if (subcommand === 'leave') {
      vc.destroy(true);
      await interaction.reply('Bot left!');
    } else if (subcommand === 'join') {
      await interaction.reply('I have arrived');
    } else if (subcommand === 'queue') {
      await interaction.reply(getQueue());
    }
  }
};

export default MusicCommands;
