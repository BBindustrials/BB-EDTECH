// server/services/logger.js

export const logMathAttempt = async (userId, question, answer, correct) => {
  console.log(`[LOG] User ${userId} attempted: "${question}" | Answer: "${answer}" | Correct: ${correct}`);
  // TODO: Save to database if needed
};
