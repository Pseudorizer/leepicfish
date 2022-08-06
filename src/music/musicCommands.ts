import {ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessagePayload, TextChannel} from 'discord.js';
import {AudioPlayerStatus, VoiceConnection} from '@discordjs/voice';
import {joinVc} from './utils.js';
import {clear, clearSearchCache, dequeue, enqueue, getQueue, getRepeat, setCurrent, toggleRepeat} from './queue.js';
import {
  audioPlayer,
  currentAudioResource,
  currentAudioResourceLength,
  currentAudioResourceTitle,
  Interaction,
  play,
} from './streamer.js';
import {client} from '../index.js';
import env from '../getEnv.js';

let cacheEnabled = true;
export let volume = 1;

audioPlayer.on('stateChange', async (oldState, newState) => {
  if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
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
        currentAudioResource?.volume?.setVolume(0);
      } else {
        volume -= amount;
        currentAudioResource?.volume?.setVolume(volume);
      }

      await interaction.reply({ content: `Volume decreased to ${volume * 100}%`, ephemeral: true });
    } else if (subcommand === 'vol-up') {
      const amount = (interaction.options.getInteger('amount', false) ?? 10) / 100;

      if (volume + amount > 1.5) {
        volume = 1.5;
        currentAudioResource?.volume?.setVolume(1.5);
      } else {
        volume += amount;
        currentAudioResource?.volume?.setVolume(volume);
      }

      await interaction.reply({ content: `Volume increased to ${volume * 100}%`, ephemeral: true });
    } else if (subcommand === 'stop') {
      toggleRepeat(false);
      clear();
      audioPlayer.stop();
      await interaction.reply({ content: 'Stopped', ephemeral: true });
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
    } else if (subcommand === 'start-queue') {
      const next = dequeue();

      if (next) {
        await play(next, interactionCallback, cacheEnabled);
      } else {
        await interaction.followUp('There are no songs in the queue');
      }
    } else if (subcommand === 'join') {
      await interaction.reply('I have arrived');
    }
  };

  const onReady = async () => {
    if (subcommand === 'show-next') {
      await interaction.reply(`Showing the next ${interaction.options.getInteger('amount', false) ?? 1} songs`);
    } else if (subcommand === 'queue') {
      await interaction.reply(getQueue());
    } else if (subcommand === 'toggle-search-cache') {
      cacheEnabled = !cacheEnabled;
      await interaction.reply(`Search cache is now ${cacheEnabled ? 'enabled' : 'disabled'}`);
    } else if (subcommand === 'clear-cache') {
      const query = interaction.options.getString('query', false);

      clearSearchCache(query);

      if (query) {
        await interaction.reply(`Search cache entry for ${query} cleared`);
      } else {
        await interaction.reply('Search cache cleared');
      }
    } else if (subcommand === 'status') {
      let playStatus;

      if (audioPlayer.state.status === AudioPlayerStatus.Playing) {
        playStatus = ':arrow_forward:';
      } else if (audioPlayer.state.status === AudioPlayerStatus.Paused) {
        playStatus = ':pause_button:';
      } else if (audioPlayer.state.status === AudioPlayerStatus.Idle) {
        playStatus = ':stop_button:';
      } else if (audioPlayer.state.status === AudioPlayerStatus.Buffering) {
        playStatus = ':arrows_counterclockwise:';
      } else {
        playStatus = ':question:';
      }

      let volumeStatus;

      if (volume >= .8) {
        volumeStatus = ':loud_sound:';
      } else if (volume >= .2) {
        volumeStatus = ':sound:';
      } else {
        volumeStatus = ':mute:';
      }

      let duration = '00:00';
      let totalTime = '00:00';
      let progress = '[-------------------]';

      if (currentAudioResource?.playbackDuration) {
        duration = new Date(currentAudioResource?.playbackDuration ?? 0).toLocaleTimeString('en-GB',
          { minute: '2-digit', second: '2-digit' });
      }

      if (currentAudioResourceLength) {
        totalTime = new Date(currentAudioResourceLength ?? 0).toLocaleTimeString('en-GB',
          { minute: '2-digit', second: '2-digit' });
      }

      if (currentAudioResource?.playbackDuration && currentAudioResourceLength) {
        const played = Math.ceil((currentAudioResource.playbackDuration / currentAudioResourceLength) * 20);
        const left = 20 - played;
        progress = `[${'#'.repeat(played)}${'-'.repeat(left)}]`;
      }

      const statusEmbed = new EmbedBuilder()
        .setTitle(`Playing - ${currentAudioResourceTitle ?? 'Nothing'} :musical_note:`)
        .setDescription(`${playStatus} ${duration}/${totalTime} **${progress}** ${volumeStatus} **${volume *
        100}%**${getRepeat() ? ' :arrows_counterclockwise:' : ''}`);

      await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
    }
  };

  if (subcommandGroup === 'controls') {
    await joinVc(interaction.member as GuildMember, interaction.guild, audioPlayer, onVcReady);
  } else {
    await onReady();
  }
};

export default MusicCommands;
