import {AudioPlayer, getVoiceConnection, joinVoiceChannel} from '@discordjs/voice';
import {Guild, GuildMember} from 'discord.js';

export const getVc = (targetMember: GuildMember, guild: Guild, audioPlayer: AudioPlayer) => {
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
}
