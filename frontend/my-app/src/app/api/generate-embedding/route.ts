// app/api/generate-embedding/route.ts
import { NextResponse } from 'next/server';
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

// Extract keywords and important terms
function extractKeywords(text: string): string {
  // Remove special characters but keep spaces
  const cleaned = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Get unique words
  const words = cleaned.split(' ');
  const uniqueWords = [...new Set(words)];
  
  // Return text with keywords emphasized
  return cleaned + ' ' + uniqueWords.slice(0, 50).join(' ');
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Enhance text with keywords for better matching
    const enhancedText = extractKeywords(text);
    const limitedText = enhancedText.substring(0, 5000);

    // Generate embedding with Cohere
    const response = await cohere.embed({
      texts: [limitedText],
      model: 'embed-english-v3.0',
      inputType: 'search_document',
      embeddingTypes: ['float'],
    });

    const embedding = response.embeddings.float[0];

    return NextResponse.json({
      success: true,
      embedding: embedding,
    });

  } catch (error: any) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding', details: error.message },
      { status: 500 }
    );
  }
}