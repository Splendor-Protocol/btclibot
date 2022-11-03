const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { requestData } = require('./utils/data');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { Chart } = require('chart.js');
const { generateCanva } = require('./utils/chartNeuron');
const { BtcliCommands } = require('./const/btclicommands');
const { inspectExecute } = require('./btcli/inspect');
const { emissionExecute, emissionExecuteRaw } = require('./btcli/emission');
const { incentiveExecute, incentiveExecuteRaw } = require('./btcli/incentive');
const { matagraphExecuteRaw } = require('./btcli/metagraph');
const { stakeExecute } = require('./btcli/stake');

const app = express();
var corsOptions = {
  origin: '*',
};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  InteractionType,
  EmbedBuilder,
  MessageEmbed,
  MessageAttachment,
  AttachmentBuilder,
} = require('discord.js');
const { token } = require('./config');

//neuron data from MongoDB
// let BitCliData = 'No Data';
// Promise.resolve(requestData())
//   .then((res) => {
//     BitCliData = res;
//   })
//   .catch((err) => {
//     BitCliData = `Can't get data`;
//   });

//integrate polkadot for bittensor substrate
// const { realNeuron } = require('./polkadot/neuron');
// let NeuronData = 'No Data';

// const { NETWORKS } = require('./config/network');

// const { api } = require('./polkadot/api');

// let apiCtx;
// const getNeurons = async () => {
//   // let myInterval;
//   try {
//     apiCtx = await api(NETWORKS[0].endpoints);
//     console.log('apiCtx', apiCtx);
//     // NeuronData = await realNeuron(apiCtx);
//     // myInterval = setInterval(async () => {
//     // NeuronData = await realNeuron(apiCtx);
//     // }, 120000);
//   } catch (err) {
//     // clearInterval(myInterval);
//     getNeurons();
//   }
// };
// getNeurons();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log('Ready!');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  const discordMessage = msg.content.replace(/\s+/g, ' ');
  if (discordMessage.slice(0, 6) === '$btcli' && discordMessage.length <= 50) {
    if (discordMessage.slice(0, 12) === '$btcli stake') {
      stakeExecute(discordMessage, msg);
    } else if (discordMessage.slice(0, 14) === '$btcli inspect') {
      inspectExecute(discordMessage, msg);
    } else {
      switch (discordMessage) {
        case '$btcli': {
          msg.channel.send({
            content: `${BtcliCommands}`,
          });
          break;
        }
        case '$btcli --help': {
          msg.channel.send({
            content: `${BtcliCommands}`,
          });
          break;
        }
        case '$btcli metagraph --raw': {
          matagraphExecuteRaw(msg);
          break;
        }
        case '$btcli incentive': {
          incentiveExecute(msg);
          break;
        }
        case '$btcli incentive --raw': {
          incentiveExecuteRaw(msg, 'raw');
          break;
        }
        case '$btcli incentive --raw --ascending': {
          incentiveExecuteRaw(msg, 'ascending');
          break;
        }
        case '$btcli incentive --raw --descending': {
          incentiveExecuteRaw(msg, 'descending');
          break;
        }
        case '$btcli emission': {
          emissionExecute(msg);
          break;
        }
        case '$btcli emission --raw': {
          emissionExecuteRaw(msg);
          break;
        }
        default:
          msg.channel.send({
            content: `**$btcli: ${discordMessage.slice(
              6
            )}** is not a btcli command. See **$btcli --help**.`,
          });
          break;
      }
    }
  } else return;
});

client.login(token);

// simple route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to bittensor Tao Bot.' });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

//backend API from MongoDB
// setInterval(() => {
//   Promise.resolve(requestData())
//     .then((res) => {
//       BitCliData = res;
//     })
//     .catch((err) => {
//       BitCliData = `Can't get data`;
//     });
// }, 100000);

// setInterval(() => {
//   getNeurons();
// }, 500000);
