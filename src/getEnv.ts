export type Env = {
  token: string,
  guildId: string,
  clientId: string,
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

export default {
  token: TOKEN,
  clientId: CLIENT_ID,
  guildId: GUILD_ID,
} as Env;
