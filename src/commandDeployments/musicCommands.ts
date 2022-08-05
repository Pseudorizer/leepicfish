import {SlashCommandBuilder} from 'discord.js';

const musicCommands =
        new SlashCommandBuilder()
          .setName('music')
          .setDescription('A music player')
          .addSubcommand(subcommand =>
            subcommand
              .setName('join')
              .setDescription('Have the bot join your current vc'))
          .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
              .setName('controls')
              .setDescription('Music Controls')
              .addSubcommand(subcommand =>
                subcommand
                  .setName('play')
                  .setDescription('Play or enqueue a song')
                  .addStringOption(option =>
                    option
                      .setName('song')
                      .setDescription('Youtube URL of the song to play')
                      .setRequired(true)),
              ).addSubcommand(subcommand =>
              subcommand
                .setName('pause')
                .setDescription('Pauses the current song'),
            ).addSubcommand(subcommand =>
              subcommand
                .setName('skip')
                .setDescription('Skip the current song'),
            ).addSubcommand(subcommand =>
              subcommand
                .setName('unpause')
                .setDescription('Unpause the song')),
          ).addSubcommand(subcommand =>
            subcommand
              .setName('show-next')
              .setDescription('See what song is next')
              .addIntegerOption(option =>
                option
                  .setName('amount')
                  .setDescription('Number of upcoming songs to display, defaults to 1')
                  .setMaxValue(5)
                  .setMinValue(1)))
          .addSubcommand(subcommand =>
            subcommand
              .setName('leave')
              .setDescription('Make the bot leave the current voice channel'))
          .addSubcommand(subcommand =>
            subcommand
              .setName('status')
              .setDescription('See current status of the music player'));

export default musicCommands;
