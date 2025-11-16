import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const docsCache = new Map<string, { content: string; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 30

export async function POST(request: NextRequest) {
  try {
    const { url, docContent, messages, mode } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const cleanMessages = messages.map(({ role, content }) => ({ role, content }))

    let documentContext = docContent || ''
    
    if (!documentContext && url) {
      const cached = docsCache.get(url)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        documentContext = cached.content
      }
    }

    let systemPrompt = ''
    
    if (mode === 'user') {
      // Education/Learning mode prompt
      systemPrompt = documentContext 
        ? `You are an Expert Tutor AI. Your task is to teach and quiz the user based exclusively on the content provided.

DOCUMENT CONTENT:
${documentContext.slice(0, 30000)}

Your responsibilities:
1. Explain concepts clearly and thoroughly, step by step
2. Generate quizzes, practice exercises, and example questions based solely on the content
3. Answer any questions from the user strictly using the provided content
4. Provide hints, detailed reasoning, and clarifications for answers
5. Make it interactive and educational, simulating a personal tutor
6. Act like a teaching assistant preparing the user for exams or tests

When providing responses:
- Break down complex topics into digestible parts
- Use examples and analogies to clarify concepts
- Create practice questions to test understanding
- Provide explanations with step-by-step reasoning
- Encourage learning with positive reinforcement
- If asked about something not in the content, politely say so and offer to explain related topics that are covered`
        : `You are an Expert Tutor AI designed to help students learn effectively.

Your approach:
- Break down complex topics into simple, understandable parts
- Provide clear explanations with examples
- Create quizzes and practice questions to reinforce learning
- Give step-by-step solutions with reasoning
- Use analogies and real-world examples to clarify concepts
- Encourage critical thinking and deeper understanding
- Provide positive feedback and constructive guidance

Make learning engaging, interactive, and effective.`
    } else {
      // Developer mode prompt
      systemPrompt = documentContext 
        ? `You are a helpful documentation assistant for developers. You have read and understood the following technical documentation:

${documentContext.slice(0, 30000)}

Your responsibilities:
- Answer technical questions clearly and concisely based on this documentation
- Provide code examples when relevant, with proper syntax highlighting
- Explain implementation details and best practices
- Point out potential pitfalls and common mistakes to avoid
- Reference specific sections of the docs when applicable
- Use markdown formatting for better readability
- If asked about something not in the docs, say so politely and suggest related topics that are covered

Always prioritize accuracy and practical implementation guidance.`
        : `You are a helpful technical assistant for developers.

Your approach:
- Provide clear, concise technical explanations
- Include code examples with proper syntax
- Explain best practices and common patterns
- Highlight potential issues and how to avoid them
- Use markdown formatting for code blocks
- Be practical and implementation-focused

Help developers understand and implement solutions effectively.`
    }

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...cleanMessages,
    ]

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: conversationMessages,
        temperature: mode === 'user' ? 0.8 : 0.7, // Slightly higher temp for education mode
        max_tokens: 2000,
      }),
    })

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text()
      console.error('[v0] Groq API error:', errorBody)
      
      console.log('[v0] Attempting SiliconFlow fallback...')
      
      try {
        const siliconResponse = await fetch('https://api.siliconflow.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-ai/DeepSeek-V3',
            messages: conversationMessages,
            temperature: mode === 'user' ? 0.8 : 0.7,
            max_tokens: 2000,
          }),
        })

        if (siliconResponse.ok) {
          const siliconData = await siliconResponse.json()
          
          if (siliconData.choices?.[0]?.message?.content) {
            return NextResponse.json({
              response: siliconData.choices[0].message.content,
            })
          }
        }
      } catch (fallbackError) {
        console.error('[v0] SiliconFlow fallback also failed:', fallbackError)
      }
      
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }

    const groqData = await groqResponse.json()

    if (groqData.choices?.[0]?.message?.content) {
      return NextResponse.json({
        response: groqData.choices[0].message.content,
      })
    }

    throw new Error('Invalid response from Groq API')
  } catch (error) {
    console.error('[v0] Error in chat:', error)
    return NextResponse.json(
      { error: 'Failed to process your message. Please try again.' },
      { status: 500 }
    )
  }
}
