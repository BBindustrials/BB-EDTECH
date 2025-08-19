import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/adaptive'; // Change to your deployed backend URL in production

// Helper to handle API response and errors
const handleResponse = async (promise) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    console.error("❌ API Request Failed:", err.response?.data || err.message);
    throw new Error(
      err.response?.data?.error || 'Unexpected error from adaptive tutor backend.'
    );
  }
};

/**
 * Fetch initial diagnostic questions for a topic
 * @param {string} topic
 */
export const fetchDiagnostic = async (topic) => {
  if (!topic || typeof topic !== 'string') {
    throw new Error("Invalid topic provided for diagnostic.");
  }

  return handleResponse(
    axios.post(`${BASE_URL}/diagnostic`, { topic })
  );
};

/**
 * Submit an answer to the adaptive tutor
 * @param {{ topic: string, question: string, answer: string }} payload
 */
export const submitAnswer = async (payload) => {
  const { topic, question, answer } = payload;
  if (!topic || !question || !answer) {
    throw new Error("Missing topic, question, or answer.");
  }

  return handleResponse(
    axios.post(`${BASE_URL}/submit-answer`, payload)
  );
};

/**
 * Get the next lesson for a topic
 * @param {string} topic
 */
export const getNextLesson = async (topic) => {
  if (!topic) throw new Error("Missing topic for next lesson.");

  return handleResponse(
    axios.post(`${BASE_URL}/next-lesson`, { topic })
  );
};
