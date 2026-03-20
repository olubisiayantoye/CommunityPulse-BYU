import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SentimentRequest {
  text: string;
}

interface SentimentResponse {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text }: SentimentRequest = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const hfApiKey = Deno.env.get('HUGGING_FACE_API_KEY');

    if (!hfApiKey) {
      console.warn('HUGGING_FACE_API_KEY not set, using fallback sentiment analysis');
      const fallbackResult = analyzeSentimentFallback(text);
      return new Response(
        JSON.stringify(fallbackResult),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = await fetch(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!response.ok) {
      console.error('Hugging Face API error:', await response.text());
      const fallbackResult = analyzeSentimentFallback(text);
      return new Response(
        JSON.stringify(fallbackResult),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const hfResult = await response.json();
    const sentiment = mapHuggingFaceSentiment(hfResult);

    return new Response(
      JSON.stringify(sentiment),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in analyze-sentiment:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze sentiment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function mapHuggingFaceSentiment(hfResult: any[][]): SentimentResponse {
  const results = hfResult[0];
  const positive = results.find((r: any) => r.label === 'POSITIVE');
  const negative = results.find((r: any) => r.label === 'NEGATIVE');

  const positiveScore = positive?.score || 0;
  const negativeScore = negative?.score || 0;

  if (positiveScore > 0.6) {
    return { sentiment: 'positive', score: positiveScore };
  } else if (negativeScore > 0.6) {
    return { sentiment: 'negative', score: negativeScore };
  } else {
    return { sentiment: 'neutral', score: Math.max(positiveScore, negativeScore) };
  }
}

function analyzeSentimentFallback(text: string): SentimentResponse {
  const lowerText = text.toLowerCase();

  const positiveWords = ['great', 'good', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'thank'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'poor', 'disappointed', 'frustrated', 'angry', 'worst'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) {
    return { sentiment: 'positive', score: Math.min(0.5 + (positiveCount * 0.1), 0.95) };
  } else if (negativeCount > positiveCount) {
    return { sentiment: 'negative', score: Math.min(0.5 + (negativeCount * 0.1), 0.95) };
  } else {
    return { sentiment: 'neutral', score: 0.5 };
  }
}
