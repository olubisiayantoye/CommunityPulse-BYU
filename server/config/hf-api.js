import { HfInference } from '@huggingface/inference';

// Initialize with API token from environment
const hf = new HfInference(process.env.HF_API_TOKEN);

// Recommended model for sentiment analysis: 
// Xenova/distilbert-base-uncased-finetuned-sst-2-english [[1]]
const SENTIMENT_MODEL = 'distilbert-base-uncased-finetuned-sst-2-english';

export const analyzeSentiment = async (text) => {
  try {
    // Validate input
    if (!text || text.trim().length < 3) {
      return { label: 'NEUTRAL', score: 1.0 };
    }

    // Call Hugging Face Inference API
    const result = await hf.textClassification({
      model: SENTIMENT_MODEL,
      inputs: text.trim(),
    });

    // Transform response to standardized format
    const sentiment = result[0];
    return {
      label: sentiment.label.toUpperCase(), // POSITIVE, NEGATIVE, or NEUTRAL
      score: parseFloat(sentiment.score.toFixed(4)),
      raw: result
    };
  } catch (error) {
    console.error('❌ Sentiment Analysis Error:', error.message);
    
    // Fallback: basic keyword-based sentiment if API fails
    return fallbackSentimentAnalysis(text);
  }
};

// Fallback analysis for resilience
const fallbackSentimentAnalysis = (text) => {
  const lower = text.toLowerCase();
  const positiveWords = ['great', 'excellent', 'love', 'happy', 'good', 'amazing', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'poor', 'awful', 'disappointed'];
  
  let score = 0;
  positiveWords.forEach(word => { if (lower.includes(word)) score++; });
  negativeWords.forEach(word => { if (lower.includes(word)) score--; });
  
  if (score > 0) return { label: 'POSITIVE', score: 0.7 + (score * 0.1) };
  if (score < 0) return { label: 'NEGATIVE', score: 0.7 + (Math.abs(score) * 0.1) };
  return { label: 'NEUTRAL', score: 1.0 };
};

export default hf;