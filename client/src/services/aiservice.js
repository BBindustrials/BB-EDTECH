// src/services/aiService.js
import axios from 'axios';

export const getSocraticResponse = async (chatHistory) => {
  const response = await axios.post('http://localhost:5000/api/socratic', {
    history: chatHistory,
  });
  return response.data.response;
};
