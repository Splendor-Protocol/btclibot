const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { inspectExecute } = require('./btcli/inspect');
// const { emissionExecute, emissionExecuteRaw } = require('./btcli/emission');
// const { incentiveExecute, incentiveExecuteRaw } = require('./btcli/incentive');
const { metagraphExecuteRaw } = require('./btcli/metagraph');
const { stakeExecute } = require('./btcli/stake');
const { helpExecute } = require('./btcli/help');
const { generateExecute } = require('./btcli/generate');
const {
  factorExecute,
  factorExecuteRaw,
  factorHistoryExecute,
} = require('./btcli/factor');
const { allowExecute } = require('./btcli/allow');
const { chainParameterExecute } = require('./btcli/chain');
const { factors, chain } = require('./const/btclicommands');
const modalevent = require('./events/modal');
const networkevent = require('./events/network');

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
  Partials,
} = require('discord.js');
const { token, dbusername, dbpassword, dbname } = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
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
  if (
    !interaction.isChatInputCommand() &&
    !interaction.isModalSubmit() &&
    !interaction.isSelectMenu()
  )
    return;

  if (interaction.isChatInputCommand()) {
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
  }
  if (interaction.type === InteractionType.ModalSubmit) {
    modalevent.execute(interaction);
  }
  if (interaction.isSelectMenu()) {
    networkevent.execute(client, interaction);
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  const discordMessage = msg.content.replace(/\s+/g, ' ');
  const messageArray = discordMessage.split(' ');
  if (discordMessage.slice(0, 6) === '$btcli' && discordMessage.length <= 80) {
    if (messageArray.length == 2 && messageArray[1] === 'allow') {
      allowExecute(msg);
    } else if (
      messageArray.length == 4 &&
      messageArray[1] === 'stake' &&
      (messageArray[2] === '--uid' || messageArray[2] === '—uid')
    ) {
      const uid = messageArray[3];
      stakeExecute(uid, msg);
    } else if (
      messageArray.length == 4 &&
      messageArray[1] === 'inspect' &&
      (messageArray[2] === '--uid' || messageArray[2] === '—uid')
    ) {
      const uid = messageArray[3];
      inspectExecute(uid, msg);
    } else if (messageArray.length === 2 && factors.includes(messageArray[1])) {
      factorExecute(msg, messageArray[1]);
    } else if (
      messageArray.length === 3 &&
      factors.includes(messageArray[1]) &&
      (messageArray[2] === '--raw' || messageArray[2] === '—raw')
    ) {
      factorExecuteRaw(msg, 'raw', messageArray[1]);
    } else if (
      messageArray.length === 4 &&
      factors.includes(messageArray[1]) &&
      (messageArray[2] === '--raw' || messageArray[2] === '—raw') &&
      ['--ascending', '--descending', '—ascending', '—descending'].includes(
        messageArray[3]
      )
    ) {
      factorExecuteRaw(msg, messageArray[3], messageArray[1]);
    } else if (messageArray.length === 2 && chain.includes(messageArray[1])) {
      chainParameterExecute(msg, messageArray[1]);
    } else if (
      messageArray.length === 6 &&
      factors.includes(messageArray[1]) &&
      (messageArray[2] === '--uid' || messageArray[2] === '—uid') &&
      (messageArray[4] === '--range' || messageArray[4] === '—range')
    ) {
      factorHistoryExecute(
        msg,
        messageArray[1],
        messageArray[3],
        messageArray[5]
      );
    } else if (messageArray[1] === 'generate') {
      generateExecute(msg, messageArray);
    } else if (messageArray.length === 1) {
      helpExecute(msg);
    } else if (
      messageArray.length === 2 &&
      (messageArray[1] === '--help' ||
        messageArray[1] === '—help' ||
        messageArray[1] === 'help')
    ) {
      helpExecute(msg);
    } else if (
      messageArray.length === 3 &&
      messageArray[1] === 'help' &&
      messageArray[2] === 'generate'
    ) {
      helpExecute(msg, 'generate');
    } else {
      switch (discordMessage) {
        case '$btcli metagraph --raw': {
          metagraphExecuteRaw(msg);
          break;
        }
        case '$btcli metagraph —raw': {
          metagraphExecuteRaw(msg);
          break;
        }
        default:
          const errorEmbed = new EmbedBuilder()
            .setColor(0xee0000)
            .setDescription(
              `**$btcli: ${discordMessage.slice(
                6
              )}** is not a btcli command. See **$btcli --help**.`
            );
          msg.channel.send({
            embeds: [errorEmbed],
          });
          break;
      }
    }
  } else return;
});

client.login(token);

// MongoDB connection:
// const db = require('./models');

// db.mongoose
//   .connect(
//     `mongodb+srv://${dbusername}:${dbpassword}@bittensordb.3afdc.mongodb.net/${dbname}?retryWrites=true&w=majority`,
//     {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     }
//   )
//   .then(() => {
//     console.log('Successfully connect to MongoDB.');
//   })
//   .catch((err) => {
//     console.error('Connection error', err);
//     process.exit();
//   });

// simple route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to bittensor Tao Bot.' });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
