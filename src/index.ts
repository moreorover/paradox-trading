import 'dotenv/config';
import { z } from 'zod';

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

console.log('Hello World!');
