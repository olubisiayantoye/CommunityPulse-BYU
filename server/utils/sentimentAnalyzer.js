import { analyzeSentiment as analyzeWithHf } from '../config/hf-api.js';

const positiveLexicon = ['great', 'helpful', 'excellent', 'love', 'good', 'amazing'];
const negativeLexicon = ['bad', 'poor', 'terrible', 'unsafe', 'hate', 'frustrated'];

export const analyzeSentiment = async (text) => {
  if (!text || !text.trim()) {
    return { label: 'NEUTRAL', score: 1 };
  }

  try {
    return await analyzeWithHf(text);
  } catch (error) {
    return fallbackSentiment(text);
  }
};

export const fallbackSentiment = (text) => {
  const normalized = text.toLowerCase();
  let score = 0;

  for (const word of positiveLexicon) {
    if (normalized.includes(word)) score += 1;
  }

  for (const word of negativeLexicon) {
    if (normalized.includes(word)) score -= 1;
  }

  if (score > 0) return { label: 'POSITIVE', score: Math.min(0.99, 0.65 + score * 0.08) };
  if (score < 0) return { label: 'NEGATIVE', score: Math.min(0.99, 0.65 + Math.abs(score) * 0.08) };
  return { label: 'NEUTRAL', score: 1 };
};

export default {
  analyzeSentiment,
  fallbackSentiment
};
