import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          solveMath: "Let's solve your math question",
          submit: "Submit",
          correct: "✅ Correct!",
          incorrect: "❌ Try again. Here's the explanation:",
        }
      },
      fr: {
        translation: {
          solveMath: "Résolvons votre question mathématique",
          submit: "Soumettre",
          correct: "✅ Correct!",
          incorrect: "❌ Réessayez. Voici l'explication:",
        }
      },
    }
  });

export default i18n;
