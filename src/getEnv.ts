export type Env = {
  token: string,
  guildId: string,
  clientId: string,
  commandChannelId: string,
}

const getEnvVariable = (name: string) => {
  const env = process.env[name];

  if (!env) {
    console.error(`ENV Variable ${name} not found`);
    process.exit(1);
  }

  return env;
};

const TOKEN = getEnvVariable('TOKEN');
const CLIENT_ID = getEnvVariable('CLIENT_ID');
const GUILD_ID = getEnvVariable('GUILD_ID');
const COMMAND_CHANNEL_ID = getEnvVariable('COMMAND_CHANNEL_ID');

export default {
  token: TOKEN,
  clientId: CLIENT_ID,
  guildId: GUILD_ID,
  commandChannelId: COMMAND_CHANNEL_ID,
} as Env;
