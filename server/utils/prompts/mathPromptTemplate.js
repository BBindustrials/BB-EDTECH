function generateMathPrompt(question, level) {
  return `
You are a professional math tutor. A ${level.toLowerCase()} student asked:

"${question}"

Instructions:
1. Break the problem into steps (no skipping).
2. Use analogies and simple language.
3. Tailor explanation to a ${level} student.
4. Provide a clear, concise conclusion for the solution.
5. Focus on teaching the concept, not just solving.

Do not add any spoken version or voiceover.
Do not return JSON.
Only return the clean step-by-step explanation.
Keep each step short and focused.
  `.trim();
}
module.exports = generateMathPrompt;
