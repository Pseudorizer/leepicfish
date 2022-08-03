export type Env = {
  token: string,
  guildId: string,
  clientId: string,
}

const getEnvVariable = (name: string, env?: string) => {
  if (!env) {
    console.error(`ENV Variable ${name} not found`);
    process.exit(1);
  }

  return env;
};

const TOKEN = getEnvVariable('TOKEN', process.env.TOKEN);
const CLIENT_ID = getEnvVariable('CLIENT_ID', process.env.CLIENT_ID);
const GUILD_ID = getEnvVariable('GUILD_ID', process.env.GUILD_ID);

export default {
  token: TOKEN,
  clientId: CLIENT_ID,
  guildId: GUILD_ID,
} as Env;
