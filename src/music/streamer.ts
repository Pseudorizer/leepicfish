import ytdl from 'ytdl-core';
import {AudioResource, createAudioPlayer, createAudioResource} from '@discordjs/voice';
import {getFromSearchCache, updateSearchCache} from './queue.js';
import ytsr, {Video} from 'ytsr';
import {InteractionReplyOptions, MessagePayload} from 'discord.js';
import {volume} from './musicCommands.js';
import {isUrl} from './utils.js';

export type Interaction = (message: string | MessagePayload | InteractionReplyOptions) => Promise<void>

export const audioPlayer = createAudioPlayer();
export let currentAudioResource: AudioResource | undefined;
export let currentAudioResourceLength: number | undefined;
export let currentAudioResourceTitle: string | undefined;

export const startDownload = async (url: string) => {
  const info = await ytdl.getInfo(url);

  currentAudioResourceLength = Number.parseInt(info.videoDetails.lengthSeconds) * 1000;
  currentAudioResourceTitle = info.videoDetails.title;

  const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 251 });

  return ytdl(url, {
    format: format,
  });
};

export const stream = async (url: string, interaction: Interaction) => {
  await interaction('Starting stream...');

  currentAudioResource = createAudioResource(await startDownload(url), { inlineVolume: true });
  currentAudioResource.volume?.setVolume(volume);
  audioPlayer.play(currentAudioResource);
};

export const search = async (query: string, interaction: Interaction, cacheEnabled: boolean) => {
  await interaction('Searching...');

  if (cacheEnabled) {
    const cachedResult = getFromSearchCache(query);

    if (cachedResult) {
      return cachedResult;
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

  return searchResults[0].url;
};

export const play = async (url: string, interaction: Interaction, cacheEnabled: boolean) => {
  let finalUrl: string | undefined = url;

  if (isUrl(url)) {
    await stream(url, interaction);
  } else {
    finalUrl = await search(url, interaction, cacheEnabled);

    if (finalUrl) {
      await stream(finalUrl, interaction);
    }
  }

  if (finalUrl) {
    await interaction(`Playing ${finalUrl}`);
  }

  return finalUrl;
};
