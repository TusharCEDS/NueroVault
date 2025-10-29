// app/api/analyze-file/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { fileName, contentText } = await req.json();

    if (!contentText || contentText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content text is required' },
        { status: 400 }
      );
    }

    // Analyze file content using Groq's Llama model
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a document analyzer. Analyze the following file content and provide:
1. A brief summary (2-3 sentences)
2. Key topics (3-5 topics)
3. Main insights or important points (3-5 points)
4. Content type/category

Format your response as JSON with keys: summary, topics (array), insights (array), category.`
        },
        {
          role: "user",
          content: `File name: ${fileName}\n\nContent:\n${contentText.substring(0, 6000)}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return NextResponse.json({
      success: true,
      fileName,
      analysis: {
        summary: analysis.summary || 'No summary available',
        topics: analysis.topics || [],
        insights: analysis.insights || [],
        category: analysis.category || 'Unknown',
      }
    });

  } catch (error: any) {
    console.error('File analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze file', details: error.message },
      { status: 500 }
    );
  }
}