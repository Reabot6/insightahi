import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileType = file.type
    console.log('[v0] Extracting text from file:', file.name, fileType)

    let extractedText = ''

    if (fileType.startsWith('image/')) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const dataUrl = `data:${fileType};base64,${base64}`

      const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-VL-72B-Instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
                {
                  type: 'text',
                  text: 'Extract all text from this image. If it contains code, preserve the formatting. If it contains documentation or instructions, extract everything clearly and accurately.',
                },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      })

      const data = await response.json()
      
      if (data.choices?.[0]?.message?.content) {
        extractedText = data.choices[0].message.content
      }
    }

    if (fileType === 'application/pdf') {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      
      const PDFCO_API_KEY = process.env.PDFCO_API_KEY
      
      if (!PDFCO_API_KEY) {
        console.error('[v0] PDF.co API key not configured')
        return NextResponse.json({ 
          text: `📄 **${file.name}**\n\nPDF uploaded successfully. Please describe what information you need from this document.` 
        })
      }
      
      const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload/base64', {
        method: 'POST',
        headers: {
          'x-api-key': PDFCO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          name: file.name,
        }),
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('[v0] PDF.co upload failed:', errorText)
        return NextResponse.json({ 
          text: `📄 **${file.name}**\n\nPDF uploaded. Please describe what you need help with.` 
        })
      }

      const uploadData = await uploadResponse.json()

      if (uploadData.error === false && uploadData.url) {
        const extractResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
          method: 'POST',
          headers: {
            'x-api-key': PDFCO_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: uploadData.url,
            inline: true,
            lang: 'eng',
          }),
        })

        const extractData = await extractResponse.json()

        if (extractData.error === false && extractData.body) {
          extractedText = extractData.body.slice(0, 50000)
        }
      }
    }

    if (extractedText && mode === 'user') {
      const analysisPrompt = `You are an AI tutor. Analyze this educational content and provide:

1. **📚 Summary** (3-4 sentences): Brief overview of what this content covers
2. **🎯 Key Topics** (4-6 bullet points): Main concepts and ideas
3. **💡 Suggested Questions** (5 questions): Questions a student might ask about this content
4. **📝 Study Actions**: Suggest what the student can do (e.g., "Ask me to create flashcards", "Request a practice quiz", "Get detailed explanations")

Keep it organized with clear sections and emojis.

Content to analyze:
${extractedText.slice(0, 15000)}`

      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        })

        if (groqResponse.ok) {
          const groqData = await groqResponse.json()
          const analysis = groqData.choices?.[0]?.message?.content || ''
          
          return NextResponse.json({ 
            text: `📎 **${file.name}** has been analyzed!\n\n${analysis}\n\n---\n\n✨ **What would you like to do?**\n• Create flashcards from this content\n• Generate a practice quiz\n• Get detailed explanations of any topic\n• Ask specific questions\n\nJust let me know!`,
            fullContent: extractedText // Store for later use but don't display
          })
        }
      } catch (error) {
        console.error('[v0] Error analyzing file:', error)
      }
    }

    if (extractedText && mode === 'dev') {
      const analysisPrompt = `Analyze this technical document and provide:

1. **Summary** (2-3 sentences): What this documentation covers
2. **Key Concepts** (4-5 bullet points): Important APIs, functions, or patterns
3. **Implementation Notes** (2-3 points): Critical details for implementation
4. **Warnings** (if any): Common pitfalls or important considerations

Keep it concise and technical.

Document content:
${extractedText.slice(0, 15000)}`

      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.6,
            max_tokens: 1000,
          }),
        })

        if (groqResponse.ok) {
          const groqData = await groqResponse.json()
          const analysis = groqData.choices?.[0]?.message?.content || ''
          
          return NextResponse.json({ 
            text: `📎 **${file.name}**\n\n${analysis}\n\n---\n\n💬 Ask me anything about this documentation!`,
            fullContent: extractedText
          })
        }
      } catch (error) {
        console.error('[v0] Error analyzing file:', error)
      }
    }

    return NextResponse.json({ 
      text: extractedText ? `📎 **${file.name}**\n\n${extractedText.slice(0, 2000)}...` : `📄 **${file.name}**\n\nFile uploaded. What would you like to know?`,
      fullContent: extractedText
    })
  } catch (error) {
    console.error('[v0] Error extracting file:', error)
    return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 })
  }
}
