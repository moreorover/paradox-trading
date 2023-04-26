import { ColorResolvable, EmbedBuilder } from 'discord.js';
import 'dotenv/config';
import { configure, getLogger } from 'log4js';
import WebSocket from 'ws';
import { z } from 'zod';
import { channel } from './discord';

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

// async function main() {
//   getLogger().info(`Started applicaiton.`);
//   await wait(2);
// }

// main();

function getColor(value: number) {
  // Calculate a value between 0 and 255 based on the input value
  var red = Math.round((255 * value) / 100);
  var blue = Math.round((255 * (100 - value)) / 100);

  // Convert the red and blue values to hex strings and pad them with zeros if necessary
  var redHex = red.toString(16).padStart(2, '0');
  var blueHex = blue.toString(16).padStart(2, '0');

  // Combine the red and blue components with a constant green component
  return '#' + redHex + '00' + blueHex;
}

function cleanText(text: string) {
  return text.replace(/&#(\d+);/g, function (match, dec) {
    return String.fromCharCode(dec);
  });
}

// const alpaca: Alpaca = new Alpaca();

// Server < -- > Data Source
// Communication can go both ways
// Data source can send us information
// Send data to the data source (Authenticate, ask what data we want)

// WebSockets are like push notifications on your phone
// Whenever an event happens (texts you, snapchat, anything) you get a notification

const wss: WebSocket = new WebSocket('wss://stream.data.alpaca.markets/v1beta1/news');

wss.on('open', function () {
  getLogger().info('Websocket connected!');

  // We now have to log in to the data source
  const authMsg = {
    action: 'auth',
    key: process.env.APCA_API_KEY_ID,
    secret: process.env.APCA_API_SECRET_KEY,
  };

  wss.send(JSON.stringify(authMsg)); // Send auth data to ws, "log us in"

  // Subscribe to all news feeds
  const subscribeMsg = {
    action: 'subscribe',
    news: ['*'], // ["TSLA"]
  };
  wss.send(JSON.stringify(subscribeMsg)); // Connecting us to the live data source of news
});

type AlpacaMessage = {
  T: string;
  id: number;
  headline: string;
  summary: string;
  author: string;
  created_at: Date;
  updated_at: Date;
  url: string;
  content: string;
  symbols: string[];
  source: string;
};

wss.on('message', async function (message: string) {
  getLogger().info('Message is ' + message);
  // message is a STRING
  const currentEvent = JSON.parse(message)[0];
  // "T": "n" newsEvent
  if (currentEvent.T === 'n') {
    // This is a news event
    let companyImpact = 0;

    // Ask ChatGPT its thoughts on the headline
    const apiRequestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Only respond with a number from 1-100 detailing the impact of the headline.',
        }, // How ChatGPT should talk to us
        {
          role: 'user',
          content:
            "Given the headline '" +
            cleanText(currentEvent.headline) +
            "', show me a number from 1-100 detailing the impact of this headline.",
        },
      ],
    };

    await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody),
    })
      .then((data) => {
        return data.json();
      })
      .then((data) => {
        // data is the ChatGPT response
        getLogger().info(data);
        companyImpact = parseInt(data.choices[0].message.content);
      });

    // Make trades based on the output (of the impact saved in companyImpact)
    const tickerSymbol = currentEvent.symbols[0];

    getLogger().info(`companyImpact: ${companyImpact}`);
    getLogger().info(`color: ${getColor(companyImpact)}`);

    const embed = new EmbedBuilder()
      .setColor(getColor(companyImpact) as ColorResolvable)
      .setTitle(cleanText(currentEvent.headline.slice(0, 240) + '...'))
      .setURL(currentEvent.url)
      .setAuthor({
        name: cleanText(currentEvent.author),
      })
      .addFields(
        {
          name: 'Ticker',
          value: currentEvent.symbols.join(', '),
          inline: true,
        },
        { name: 'ChatGPT guess', value: companyImpact.toString(), inline: true },
        // { name: 'Inline field title', value: 'Some value here', inline: true }
      )
      .setTimestamp();

    if (currentEvent.summary.length > 0) {
      embed.setDescription(cleanText(currentEvent.summary));
    }

    await channel?.send({ embeds: [embed] });
    // 1 - 100, 1 being the most negative, 100 being the most positive impact on a company.
    // if (companyImpact >= 70) {
    //   // if score >= 70 : BUY STOCK
    //   // Buy stock
    //   let order = await alpaca.createOrder({
    //     symbol: tickerSymbol,
    //     qty: 1,
    //     side: 'buy',
    //     type: 'market',
    //     time_in_force: 'day', // day ends, it wont trade.
    //   });
    // } else if (companyImpact <= 30) {
    //   // else if impact <= 30: SELL ALL OF STOCK
    //   // Sell stock
    //   let closedPosition = alpaca.closePosition(tickerSymbol); //(tickerSymbol);
    // }
  }
});
