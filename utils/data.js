const axios = require('axios');
// const controller = require('../controllers/bot.controller');
const requestData = async () => {
  const response = await axios.get(
    'https://bittensor-backend.vercel.app/api/bot',
    {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
  return response;
};

const requestChain = async () => {
  const response = await axios.get('http://127.0.0.1:5000/bot', {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return response;
};

const requestHistory = async (params) => {
  const response = await axios.get('http://127.0.0.1:5000/subtensorapi', {
    data: params,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return response;
};

module.exports = {
  requestData: requestData,
  requestChain: requestChain,
  requestHistory: requestHistory,
};
