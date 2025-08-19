// quotes.js - Daily quotes for the dashboard
export const menducationQuotes = [
  // Days 1-30 DISCOVER
  "Know who you are before you try to lead others.",
  "Manhood begins when you embrace who God made you to be.",
  "Education without identity is like a ship without a compass.",
  "Strength without character is weakness in disguise.",
  "True wisdom is knowing you are still a student of life.",
  "Don't borrow the world's definition of manhood—define it by truth.",
  "A boy asks, 'What can I get?' A man asks, 'Who can I become?'",
  "Faith gives direction; education gives the tools.",
  "A clear purpose is worth more than a thousand ambitions.",
  "Be a man whose mind is informed and whose heart is transformed.",
  "Knowing yourself is the first step to leading yourself.",
  "Courage begins with clarity of purpose.",
  "Identity is the foundation for every lesson you will learn.",
  "Great leaders are first great learners.",
  "The man who ignores his purpose will chase distractions.",
  "Discovering your calling is an education in itself.",
  "Every man has a story—write yours with integrity.",
  "Education informs the mind; faith reforms the heart.",
  "A strong man knows his limits but never stops expanding them.",
  "The first subject every man must master is himself.",
  "Manhood is more than age—it's accountability in action.",
  "A purpose-driven man cannot be easily misled.",
  "You can't lead others to places you've never explored yourself.",
  "Every skill is stronger when built on solid values.",
  "Your education should reflect your calling, not just your career.",
  "Discovering who you are makes every challenge meaningful.",
  "A man with vision outlasts a man with only ambition.",
  "Growth begins with the humility to admit you don't know it all.",
  "Knowledge is power, but wisdom directs the power.",
  "Faith shapes the man; learning equips the man.",
  
  // Days 31-60 DEVELOP
  "Build discipline before you handle power.",
  "Discipline is the bridge between dreams and reality.",
  "The man who can lead himself can lead a team.",
  "Consistency is the foundation of credibility.",
  "Power without restraint becomes destruction.",
  "Every great man was first a man of small, faithful habits.",
  "Money follows discipline, not the other way around.",
  "Strong bodies and strong minds grow together.",
  "Emotional maturity is the secret ingredient of leadership.",
  "Communication builds bridges or burns them—choose wisely.",
  "You can't manage others if you can't manage your time.",
  "A leader's words are as important as his actions.",
  "Good habits build the man you will become.",
  "Every hour you waste is a seed you failed to plant.",
  "The best investment is in your own growth.",
  "Mentorship multiplies what education initiates.",
  "Success demands structure.",
  "Your health is an asset—guard it.",
  "Strength is measured in how you handle challenges, not in avoiding them.",
  "The habit you master today will serve you tomorrow.",
  "True leadership is service multiplied by skill.",
  "Patience turns potential into performance.",
  "A disciplined man earns respect without asking for it.",
  "You can't inspire others if you can't inspire yourself.",
  "Personal growth is the seed for community growth.",
  "A wise man learns from every conversation.",
  "Great men prepare before opportunity knocks.",
  "Resilience is built one trial at a time.",
  "The more disciplined you are, the freer you become.",
  "Leadership starts at home before it reaches the world.",
  
  // Days 61-90 DEPLOY
  "Manhood is a mission, not a title.",
  "Service is the proof of true strength.",
  "Legacy is not what you leave behind, but who you leave behind.",
  "Marriage is leadership in its most personal form.",
  "Fatherhood is a lifetime mentorship program.",
  "Your mission is greater than your comfort.",
  "A man's real wealth is the lives he has improved.",
  "The measure of a man is in his willingness to serve.",
  "Give more than you take, and you'll always have enough.",
  "Accountability turns intentions into results.",
  "The greatest title you can have is 'Servant.'",
  "True power is used for the benefit of others.",
  "A man's work should outlive him.",
  "Mentorship is the bridge between generations.",
  "Leadership is a responsibility, not a reward.",
  "You were blessed so you could be a blessing.",
  "Your influence is strongest where your integrity is deepest.",
  "Legacy is written in people, not in plaques.",
  "A mission without service is self-promotion.",
  "Build people, and they will build the future.",
  "A man's impact is multiplied by the values he imparts.",
  "Serve in the small things before you lead in the great things.",
  "Community begins with committed individuals.",
  "Leadership without accountability is a threat, not a gift.",
  "The man who serves today leads tomorrow.",
  "Influence is borrowed; character is owned.",
  "To lead well is to love well.",
  "Marriage is not the end of freedom but the expansion of purpose.",
  "Leave a legacy worth repeating.",
  "Responsibility is the crown of manhood.",
  
  // Extra 30 Quotes
  "Education gives you knowledge; service gives you purpose.",
  "A man's true height is measured by the depth of his humility.",
  "Learn until you lead, and lead until you teach.",
  "The man who refuses to grow will be replaced by one who does.",
  "Purpose without preparation is like a seed without soil.",
  "Knowledge that isn't shared becomes wasted treasure.",
  "A man with wisdom in his heart and work in his hands is unstoppable.",
  "Integrity is what you do when no one is watching.",
  "Every challenge is a classroom for the willing.",
  "You can't build a strong future with weak values.",
  "Leadership is influence; influence is earned.",
  "A disciplined mind can turn any obstacle into opportunity.",
  "To lead well, you must first listen well.",
  "Great men are not remembered for what they took, but for what they gave.",
  "Time is life's most valuable currency—spend it wisely.",
  "Learning without applying is like reading without understanding.",
  "A man's real strength is revealed in how he treats the weak.",
  "Your daily habits are building your future or destroying it.",
  "No man is too busy to grow; he's just too distracted.",
  "True manhood serves others before serving self.",
  "Education should make you useful, not just knowledgeable.",
  "The best leaders create leaders, not followers.",
  "A man's words are seeds—plant them with care.",
  "You cannot mentor others if you have not mastered yourself.",
  "The best investment you'll ever make is in people.",
  "Faith is the courage to start when you don't see the finish line.",
  "A man's mission should outlive his lifetime.",
  "The right education teaches you how to live, not just how to earn.",
  "Responsibility is the true mark of maturity.",
  "Lead with your actions, guide with your words, and inspire with your life."
];

// Function to get daily quote based on current date
export const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const quoteIndex = dayOfYear % menducationQuotes.length;
  return menducationQuotes[quoteIndex];
};

// Function to get quote phase based on day
export const getQuotePhase = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const cycleDay = (dayOfYear % 120) + 1; // 120-day cycle (4 months)
  
  if (cycleDay <= 30) {
    return "DISCOVER";
  } else if (cycleDay <= 60) {
    return "DEVELOP";
  } else if (cycleDay <= 90) {
    return "DEPLOY";
  } else {
    return "WISDOM"; // Extra quotes phase
  }
};