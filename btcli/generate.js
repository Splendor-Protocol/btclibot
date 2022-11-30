const axios = require('axios');
let { options, paramOptions } = require('../store/option');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  async generateExecute(msg, messageArray) {
    const message = await msg.channel.send({
      content: 'loading data...',
    });
    let optionsInstance = Object.assign({}, options);
    let optionItem = '';
    let paramDetected = false;
    for (i = 2; i < messageArray.length; i++) {
      if (paramOptions.includes(messageArray[i])) {
        optionItem = messageArray[i].slice(2);
        optionsInstance[optionItem] = '';
        paramDetected = true;
      } else if (paramDetected) {
        if (!!optionsInstance[optionItem])
          optionsInstance[optionItem] = optionsInstance[optionItem].concat(
            ' ',
            messageArray[i]
          );
        else
          optionsInstance[optionItem] = optionsInstance[optionItem].concat(
            messageArray[i]
          );
      } else {
        await message.delete();
        const generateEmbed = new EmbedBuilder()
          .setTitle('Please specify the correct options')
          .setDescription('Type **$btcli help generate** to see the options');
        msg.channel.send({
          embeds: [generateEmbed],
        });
        return;
      }
    }

    await axios
      .post('https://playground-api.bittensor.com/seq2seq', {
        do_sample: optionsInstance.do_sample === 'true' ? true : false,
        early_stopping:
          optionsInstance.early_stopping === 'true' ? true : false,
        network: optionsInstance.network,
        no_repeat_ngram_size: Number(optionsInstance.no_repeat_ngram_size),
        num_beams: Number(optionsInstance.num_beams),
        num_return_sequences: Number(optionsInstance.num_return_sequences),
        num_to_generate: Number(optionsInstance.num_to_generate),
        prompt: optionsInstance.prompt,
        top_p: Number(optionsInstance.top_p),
        topk: Number(optionsInstance.topk),
        uid: optionsInstance.uid.split(',').map((i) => Number(i)),
      })
      .then(async (res) => {
        await message.delete();
        if (
          res.data.response[0] === 'Error! Endpoint not available.' ||
          res.data.response[0] === 'Error! UID not synced, Request timeout.' ||
          res.data.response[0] === 'Error! Modality not implemented.'
        ) {
          console.log('ERROR', res.data.response[0]);
          msg.channel.send({
            content: `No data found`,
          });
        } else {
          let result = res.data.response[0].split('\n');
          // msg.channel.send({
          //   content: `Prompt: ${result[0]}\nResponse: ${result.slice(1)}`,
          // });
          msg.channel.send({
            content: `Prompt: ${optionsInstance.prompt}\nResponse: ${res.data.response[0]}`,
          });
        }
      })
      .catch(async (err) => {
        await message.delete();
        console.log('ERROR', err);
        const errorEmbed = new EmbedBuilder()
          .setColor(0xee0000)
          .setDescription(`⚠️ No data found`);
        msg.channel.send({ embeds: [errorEmbed] });
      });
  },
};
