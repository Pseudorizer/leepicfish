import {SlashCommandBuilder} from 'discord.js';
import {languages} from '../transcode/transcodeCommands.js'

const transcodeCommands =
  new SlashCommandBuilder()
    .setName('transcode')
    .setDescription('Text Transcoder')
    .addSubcommand(subcommand =>
      subcommand
        .setName('text')
        .setDescription('Transcode text')
    .addStringOption(option => {
      return option
        .setName('function')
        .setDescription(
          'Encode (translate TO language) or Decode (translate FROM language)?')
        .addChoices(
          {name: 'Encode', value: 'encode'},
          {name: 'Decode', value: 'decode'})
        .setRequired(true);
    })
    .addStringOption(option => {
      return option
        .setName('language')
        .setDescription(
          'Language to translate to')
        .addChoices(...Object.entries(languages).map((entry) => ({
          name: entry[1].name,
          value: entry[0]
        })))
        .setRequired(true);
    })
    .addStringOption(option => {
      return option
        .setName('text')
        .setDescription(
          'Text to translate')
        .setRequired(true);
    }));


export default transcodeCommands;
