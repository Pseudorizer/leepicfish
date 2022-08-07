import {SlashCommandBuilder} from 'discord.js';

const musicCommands =
        new SlashCommandBuilder()
          .setName('music')
          .setDescription('A music player')
          .addSubcommand(subcommand =>
            subcommand
              .setName('join')
              .setDescription('Have the bot join your current vc'))
          .addSubcommand(subcommand =>
            subcommand
              .setName('enqueue')
              .setDescription('Enqueue a song or set of songs to be played')
              .addStringOption(option =>
                option
                  .setName('query')
                  .setDescription(
                    'Can be a single search query or a Youtube URL or a comma seperated list (I.E. song1,song2')
                  .setRequired(true)))
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
                      .setName('query')
                      .setDescription('Can be a search query or a Youtube URL')
                      .setRequired(true))
                  .addBooleanOption(option =>
                    option
                      .setName('no-search-cache')
                      .setDescription(
                        'Disables the search cache used by the bot, useful if it found the wrong song when searching')),
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
                  .setName('resume')
                  .setDescription('Resume the paused song'))
              .addSubcommand(subcommand =>
                subcommand
                  .setName('vol-down')
                  .setDescription('Lower the volume, defaults to 10%')
                  .addIntegerOption(option =>
                    option
                      .setName('amount')
                      .setDescription('Amount to decrease by')
                      .setMinValue(0)))
              .addSubcommand(subcommand =>
                subcommand
                  .setName('vol-up')
                  .setDescription('Increase the volume, defaults to 10%')
                  .addIntegerOption(option =>
                    option
                      .setName('amount')
                      .setDescription('Amount to increase by')
                      .setMinValue(0)))
              .addSubcommand(subcommand =>
                subcommand
                  .setName('vol-set')
                  .setDescription('Set the volume to a specific value')
                  .addIntegerOption(option =>
                    option
                      .setName('volume')
                      .setDescription('Volume between 0 and 150')
                      .setMinValue(0)
                      .setMaxValue(150)
                      .setRequired(true)))
              .addSubcommand(subcommand =>
                subcommand
                  .setName('stop')
                  .setDescription('Stop the current song'))
              .addSubcommand(subcommand =>
                subcommand
                  .setName('repeat-song')
                  .setDescription('Toggle repeating the current song'))
              .addSubcommand(subcommand =>
                subcommand
                  .setName('leave')
                  .setDescription('Make the bot leave the current voice channel'))
              .addSubcommand(subcommand =>
                subcommand
                  .setName('start-queue')
                  .setDescription('Starts the current queue from the beginning')),
          ).addSubcommand(subcommand =>
            subcommand
              .setName('status')
              .setDescription('See current status of the music player'))
          .addSubcommand(subcommand =>
            subcommand
              .setName('show-queue')
              .setDescription('See the current queue'))
          .addSubcommand(subcommand =>
            subcommand
              .setName('toggle-search-cache')
              .setDescription(
                'Disables the searching cache used by the bot, useful if it found the wrong song when searching'))
          .addSubcommand(subcommand =>
            subcommand
              .setName('clear-cache')
              .setDescription('Clears the entire search cache or the cache for a specific query if supplied')
              .addStringOption(option =>
                option
                  .setName('query')
                  .setDescription('The search query to clear from the cache'),
              ));

export default musicCommands;
