import 'dotenv/config';
import { configure, getLogger } from 'log4js';
import { z } from 'zod';

configure({
  appenders: {
    file: {
      type: 'dateFile',
      filename: 'logs/trader.log',
      pattern: '-yyyy-MM-dd',
      backups: 7,
    },
    console: { type: 'stdout' },
  },
  categories: {
    default: {
      appenders: ['file', 'console'],
      level: 'ALL',
    },
  },
});

const envVariables = z.object({
  APCA_API_BASE_URL: z.string(),
  APCA_API_KEY_ID: z.string(),
  APCA_API_SECRET_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  DISCORD_TOKEN: z.string(),
  DISCORD_CHANNEL_ID: z.string(),
});

envVariables.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

getLogger().info(`Hello World!`);
