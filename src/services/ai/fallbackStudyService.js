import { limitText } from "../../utils/text.js";
import { shuffleArray } from "../../utils/array.js";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "have", "has",
  "you", "your", "about", "into", "which", "their", "there", "these", "those", "what", "when",
  "where", "why", "how", "can", "could", "would", "should", "will", "shall", "may", "might",
]);

const cleanText = (text = "") => text.replace(/\s+/g, " ").trim();

export const getSentences = (text = "", limit = 18) => {
  const normalized = cleanText(limitText(text, 9000));
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 45 && sentence.length < 360);

  return sentences.slice(0, limit);
};

export const getKeywords = (text = "", limit = 8) => {
  const counts = new Map();
  const words = cleanText(text)
    .toLowerCase()
    .match(/[a-z][a-z0-9-]{3,}/g) || [];

  words.forEach((word) => {
    if (!STOP_WORDS.has(word)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

export const fallbackSummary = (text) => {
  const sentences = getSentences(text, 8);

  if (!sentences.length) {
    return "I could not extract enough readable text to summarize this PDF. If this is a scanned PDF, upload a text-based version.";
  }

  return sentences.map((sentence) => `- ${sentence}`).join("\n");
};

export const fallbackFlashcards = (text) => {
  const keywords = getKeywords(text, 10);
  const sentences = getSentences(text, 12);

  return (keywords.length ? keywords : ["main idea", "important concept", "key detail", "fundamental principle", "critical definition", "core method", "key application", "primary objective", "theoretical framework", "empirical result"]).slice(0, 10).map((keyword, index) => ({
    question: `What does the PDF explain regarding ${keyword}?`,
    answer: sentences[index % Math.max(sentences.length, 1)] || "Review the uploaded PDF text for this concept.",
  }));
};

export const fallbackQuiz = (text) => {
  let keywords = getKeywords(text, 24);
  let sentences = getSentences(text, 30);

  // Shuffle keywords and sentences to randomize fallback quiz generation
  keywords = shuffleArray(keywords);
  sentences = shuffleArray(sentences);

  const cards = (keywords.length ? keywords : ["main idea", "important concept", "key detail", "fundamental principle", "critical definition", "core method", "key application", "primary objective", "theoretical framework", "empirical result"]).slice(0, 10).map((keyword, index) => ({
    question: `Based on the text, analyze the complex role of ${keyword}?`,
    answer: sentences[index % Math.max(sentences.length, 1)] || "Review the uploaded PDF text for this concept.",
  }));

  return cards.map((card, index) => {
    const correctAnswer = keywords[index] || "The core concept discussed in the context";
    const options = [
      correctAnswer,
      keywords[(index + 1) % keywords.length] || "An unrelated tertiary detail",
      keywords[(index + 2) % keywords.length] || "A minor supporting point",
      "Insufficient data presented in the text",
    ];

    return {
      question: card.question,
      options: shuffleArray(Array.from(new Set(options)).slice(0, 4)),
      correctAnswer,
    };
  });
};

export const fallbackResources = (text) => {
  const keywords = getKeywords(text, 5);

  return (keywords.length ? keywords : ["study skills", "document summary", "learning strategy"]).slice(0, 5).map((keyword) => ({
    topic: keyword,
    explanation: `This appears to be an important topic in the uploaded PDF.`,
    youtubeQuery: `${keyword} tutorial`,
    webQuery: `${keyword} study guide`,
  }));
};

export const fallbackAnswer = (text, message = "") => {
  const questionWords = new Set((message.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || []).filter((word) => !STOP_WORDS.has(word)));
  const sentences = getSentences(text, 24);
  const ranked = sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      let score = 0;
      questionWords.forEach((word) => {
        if (lower.includes(word)) score += 1;
      });
      return { sentence, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!ranked.length) {
    return fallbackSummary(text);
  }

  return ranked.map((item) => item.sentence).join("\n\n");
};

export const fallbackProfile = (text, filename) => {
  const keywords = getKeywords(text, 5);
  const sentences = getSentences(text, 2);

  return {
    detectedTitle: filename,
    subject: keywords[0] ? `${keywords[0][0].toUpperCase()}${keywords[0].slice(1)}` : "General",
    description: sentences[0] || "Readable text was extracted from this PDF and is ready for study.",
    keyTopics: keywords,
    suggestedQuestions: keywords.slice(0, 4).map((keyword) => `Explain ${keyword} from this PDF.`),
  };
};

