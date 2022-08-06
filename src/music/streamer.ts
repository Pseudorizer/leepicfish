import ytdl from 'ytdl-core';
import {AudioResource, createAudioPlayer, createAudioResource} from '@discordjs/voice';
import {getFromSearchCache, updateSearchCache} from './queue.js';
import ytsr, {Video} from 'ytsr';
import {InteractionReplyOptions, MessagePayload} from 'discord.js';
import {volume} from './musicCommands.js';

export type Interaction = (message: string | MessagePayload | InteractionReplyOptions) => Promise<void>

export const audioPlayer = createAudioPlayer();
export let currentAudioResource: AudioResource;

export const stream = async (url: string, interaction: Interaction) => {
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

export const search = async (query: string, interaction: Interaction, cacheEnabled: boolean) => {
  await interaction('Searching...');

  if (cacheEnabled) {
    const cachedResult = getFromSearchCache(query);

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
    updateSearchCache(query, searchResults[0].url);
  }

  return await stream(searchResults[0].url, interaction);
};

export const play = async (url: string, interaction: Interaction, cacheEnabled: boolean) => {
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
