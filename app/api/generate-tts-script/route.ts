import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Convert this technical message into a natural, conversational script for text-to-speech. Remove code symbols, replace "//" with "comment", make it sound natural and easy to listen to:\n\n${content}`
        }],
        temperature: 0.7,
        max_tokens: 1000,
      })
    })

    if (!groqResponse.ok) {
      // Return original content as fallback
      return NextResponse.json({ script: content })
    }

    const data = await groqResponse.json()
    const conversationalScript = data.choices?.[0]?.message?.content || content

    return NextResponse.json({ script: conversationalScript })
  } catch (error) {
    console.error('[v0] Error generating TTS script:', error)
    // Return original content as fallback
    return NextResponse.json({ script: request.body })
  }
}
