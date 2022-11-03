const { requestData } = require('../utils/data');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  async matagraphExecuteRaw(msg, order) {
    const message = await msg.channel.send({
      content: 'loading data...',
    });
    requestData()
      .then(async (res) => {
        await message.delete();
        let NeuronData = res?.data?.neuron;
        let csvContent = NeuronData.map((neuron, index) =>
          [
            `${neuron.uid}`,
            `${neuron.hotkey}`,
            `${neuron.coldkey}`,
            `${neuron.stake / 1000000000}`,
            `${neuron.rank / 18446744073709551615}`,
            `${neuron.trust / 18446744073709551615}`,
            `${neuron.consensus / 18446744073709551615}`,
            `${neuron.incentive / 18446744073709551615}`,
            `${neuron.dividends / 18446744073709551615}`,
            `${neuron.emission / 1000000000}`,
            `${neuron.active}`,
          ].join(', ')
        );
        csvContent.unshift(
          'UID, HotKey, ColdKey, Stake, Rank, Trust, Consensus, Incentive, Dividends, Emission, Active'
        );
        csvContent = csvContent.join('\n');
        const buffer = Buffer.from(csvContent, 'utf-8');
        const file = new AttachmentBuilder(buffer, {
          name: 'metagraph.csv',
        });
        msg.channel.send({
          content: 'Metagraph raw value',
          files: [file],
        });
      })
      .catch((err) => {
        msg.channel.send({
          content: `${err}`,
        });
      });
  },
};
