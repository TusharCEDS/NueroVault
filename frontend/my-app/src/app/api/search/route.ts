// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { CohereClient } from 'cohere-ai';
import { createClient } from '@supabase/supabase-js';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json();

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    // Generate embedding for search query
    const embeddingResponse = await cohere.embed({
      texts: [query.toLowerCase()],
      model: 'embed-english-v3.0',
      inputType: 'search_query',
    });

    // @ts-expect-error - Cohere SDK type inconsistency
const queryEmbedding = embeddingResponse.embeddings[0];

    // First: Try semantic search with vector similarity
    const { data: vectorResults, error: vectorError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_user_id: userId,
      match_threshold: 0.1,
      match_count: 20,
    });

    if (vectorError) {
      console.error('Vector search error:', vectorError);
    }

    // Second: Also do text-based search for exact/partial matches
    const searchTerms = query.toLowerCase().split(' ').filter((w: string) => w.length > 2);
    const { data: textResults, error: textError } = await supabase
      .from('file_embeddings')
      .select('*')
      .eq('user_id', userId)
      .or(searchTerms.map((term: string) => 
        `content_text.ilike.%${term}%,file_name.ilike.%${term}%`
      ).join(','));

    if (textError) {
      console.error('Text search error:', textError);
    }

    // Combine and deduplicate results
    const allResults = [
      ...(vectorResults || []).map((r: any) => ({ ...r, source: 'vector' })),
      ...(textResults || []).map((r: any) => ({ 
        ...r, 
        similarity: 0.8, 
        source: 'text' 
      }))
    ];

    // Remove duplicates (prefer higher similarity)
    const uniqueResults = allResults.reduce((acc: any[], curr: any) => {
      const existing = acc.find(item => item.id === curr.id);
      if (!existing) {
        acc.push(curr);
      } else if (curr.similarity > existing.similarity) {
        const index = acc.indexOf(existing);
        acc[index] = curr;
      }
      return acc;
    }, []);

    // Sort by similarity
    uniqueResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    return NextResponse.json({
      success: true,
      results: uniqueResults.slice(0, 10),
    });

  } catch (error) {
    const err = error as Error;
    console.error('Search error:', err);
    return NextResponse.json(
      { error: 'Search failed', details: err.message },
      { status: 500 }
    );
  }
}