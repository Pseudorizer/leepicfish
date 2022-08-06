import {
  ChatInputCommandInteraction, GuildMember,
  InteractionReplyOptions,
  MessagePayload,
  TextChannel,
} from 'discord.js';
import {AudioResource, createAudioPlayer, createAudioResource, VoiceConnection} from '@discordjs/voice';
import {joinVc} from './utils.js';
import ytsr, {Video} from 'ytsr';
import ytdl from 'ytdl-core';
import {
  clear,
  clearCache,
  dequeue,
  enqueue,
  getFromCache,
  getQueue,
  setCurrent,
  toggleRepeat,
  updateCache,
} from './queue.js';
import {client} from './index.js';
import env from './getEnv.js';

const audioPlayer = createAudioPlayer();
let currentAudioResource: AudioResource;
let volume = 1;
let cacheEnabled = true;

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

const search = async (query: string, interaction: Interaction, cacheEnabled: boolean) => {
  await interaction('Searching...');

  if (cacheEnabled) {
    const cachedResult = getFromCache(query);

    if (cachedResult) {
      return await stream(cachedResult, interaction);
    }
  }

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

  if (cacheEnabled) {
    updateCache(query, searchResults[0].url);
  }

  return await stream(searchResults[0].url, interaction);
};

const play = async (url: string, interaction: Interaction, cacheEnabled: boolean) => {
  let finalUrl;

  if (/^((?:https?:)?\/\/)?((?:www|m)\.)?(youtube(-nocookie)?\.com|youtu.be)(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/.test(
    url)) {
    finalUrl = await stream(url, interaction);
  } else {
    finalUrl = await search(url, interaction, cacheEnabled);
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
      const channel = await client.channels.fetch(env.commandChannelId) as TextChannel;
      await play(next, async (message) => {
        if (typeof message === 'string' || message instanceof MessagePayload) {
          await channel.send(message);
        }
      }, cacheEnabled);
    }
  }
});

const MusicCommands = async (interaction: ChatInputCommandInteraction, subcommandGroup: string, subcommand: string) => {
  if (!interaction.member || !interaction.guild) {
    return;
  }

  const onVcReady = async (vc: VoiceConnection) => {
    const interactionCallback: Interaction = async (message) => {
      await interaction.followUp(message);
    };

    if (subcommand === 'play') {
      const query = interaction.options.getString('query');
      const noCache = !(interaction.options.getBoolean('no-search-cache', false) ?? false) && cacheEnabled;

      if (!query) {
        await interaction.reply({ content: 'Query argument not found', ephemeral: true });
        return;
      }

      setCurrent(query);

      await interaction.reply({ content: 'Starting...', ephemeral: true });

      await play(query, interactionCallback, noCache);
    } else if (subcommand === 'pause') {
      audioPlayer.pause();
      await interaction.reply({ content: 'Paused', ephemeral: true });
    } else if (subcommand === 'skip') {
      await interaction.reply('Skipping...');

      const next = dequeue();

      if (next) {
        await play(next, interactionCallback, cacheEnabled);
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
      await interaction.reply(`Repeat is now ${current ? 'enabled' : 'disabled'}`);
    } else if (subcommand === 'leave') {
      vc.destroy(true);
      await interaction.reply('Bot left!');
    }
  };

  const onReady = async () => {
    if (subcommand === 'show-next') {
      await interaction.reply(`Showing the next ${interaction.options.getInteger('amount', false) ?? 1} songs`);
    } else if (subcommand === 'join') {
      await interaction.reply('I have arrived');
    } else if (subcommand === 'queue') {
      await interaction.reply(getQueue());
    } else if (subcommand === 'toggle-search-cache') {
      cacheEnabled = !cacheEnabled;
      await interaction.reply(`Search cache is now ${cacheEnabled ? 'enabled' : 'disabled'}`);
    } else if (subcommand === 'clear-cache') {
      const query = interaction.options.getString('query', false);

      clearCache(query);

      if (query) {
        await interaction.reply(`Search cache entry for ${query} cleared`);
      } else {
        await interaction.reply('Search cache cleared');
      }
    }
  };

  if (subcommandGroup === 'controls') {
    await joinVc(interaction.member as GuildMember, interaction.guild, audioPlayer, onVcReady);
  } else {
    await onReady();
  }
};

export default MusicCommands;
