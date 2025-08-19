// server/utils/evaluateAnswer.js

export const evaluateAnswer = (question, studentAnswer) => {
  // This is a placeholder. Replace with a real math evaluation engine.
  try {
    const correct = eval(question); // ⚠️ Not safe in production!
    return parseFloat(studentAnswer) === parseFloat(correct);
  } catch (err) {
    console.error("Error evaluating answer:", err);
    return false;
  }
};
