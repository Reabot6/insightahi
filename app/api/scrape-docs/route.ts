import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'

// --- Link extractor ---
async function extractLinks(html: string, baseUrl: string): Promise<string[]> {
  const $ = cheerio.load(html)
  const links = new Set<string>()
  const baseUrlObj = new URL(baseUrl)
  
  $('a[href]').each((_, element) => {
    let href = $(element).attr('href')
    if (!href) return
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
    try {
      if (href.startsWith('/')) href = `${baseUrlObj.origin}${href}`
      else if (!href.startsWith('http')) href = new URL(href, baseUrl).href
      const hrefUrl = new URL(href)
      if (hrefUrl.origin === baseUrlObj.origin) links.add(`${hrefUrl.origin}${hrefUrl.pathname}`)
    } catch {}
  })
  
  return Array.from(links)
}

// --- Crawler ---
async function crawlDocs(startUrl: string, maxPages = 50): Promise<string> {
  const visited = new Set<string>()
  const queue = [startUrl]
  let allContent = ''
  const contentChunks: string[] = []
  
  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift()
    if (!url || visited.has(url)) continue
    visited.add(url)
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'DocExplainerBot/1.0' }, signal: AbortSignal.timeout(10000) })
      if (!response.ok) continue
      const html = await response.text()
      const $ = cheerio.load(html)
      $('script, style, nav, header, footer, aside, .sidebar, .nav, .menu').remove()
      const mainContent = $('main, article, .content, .documentation, .docs, body').first()
      const textContent = mainContent.text().replace(/\s+/g, ' ').trim()
      if (textContent.length > 200) {
        const pageContent = `\n\n### Page: ${url}\n${textContent}\n`
        contentChunks.push(pageContent)
        if (contentChunks.length >= 10) { allContent += contentChunks.join(''); contentChunks.length = 0 }
      }
      const links = await extractLinks(html, startUrl)
      const newLinks = links.filter(link => !visited.has(link))
      const priorityLinks = newLinks.filter(link => /\/(docs?|guide|tutorial|api|reference|getting-started)\//.test(link))
      const otherLinks = newLinks.filter(link => !/\/(docs?|guide|tutorial|api|reference|getting-started)\//.test(link))
      priorityLinks.slice(0, 20).forEach(link => queue.push(link))
      otherLinks.slice(0, 5).forEach(link => queue.push(link))
    } catch (error) {
      console.error('[v0] Error crawling:', url, error)
    }
  }
  if (contentChunks.length > 0) allContent += contentChunks.join('')
  return allContent.slice(0, 50000)
}

// --- POST handler ---
export async function POST(request: NextRequest) {
  try {
    const { url, mode } = await request.json() // mode: "dev" or "education"
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    const docContent = await crawlDocs(url, 50)
    if (!docContent || docContent.length < 100) throw new Error('Failed to extract meaningful content')

    // Split content into chunks
    const chunkSize = 15000
    const chunks: string[] = []
    for (let i = 0; i < docContent.length; i += chunkSize) chunks.push(docContent.slice(i, i + chunkSize))

    const chunkSummaries: string[] = []
    for (let i = 0; i < Math.min(chunks.length, 5); i++) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: mode === 'dev'
                  ? 'You are a documentation expert. Summarize key developer-focused information concisely.'
                  : 'You are an expert tutor AI. Teach, explain, and quiz the user strictly based on the content provided. Make it interactive, educational, and exam-prep ready.',
              },
              {
                role: 'user',
                content: `Summarize or explain this documentation section (chunk ${i + 1} of ${chunks.length}):\n\n${chunks[i]}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 800,
          }),
        })
        if (groqResponse.ok) {
          const data = await groqResponse.json()
          if (data.choices?.[0]?.message?.content) chunkSummaries.push(data.choices[0].message.content)
        }
      } catch (error) { console.error('[v0] Error processing chunk', i, error) }
    }

    // Final aggregation prompt
    const finalPromptSystem = mode === 'dev'
      ? 'You are a documentation expert. Provide a concise summary, key points, and common developer questions in JSON format.'
      : 'You are an expert tutor AI. Provide a comprehensive teaching summary, key concepts, quizzes, and explanations based strictly on the provided content in JSON format.'

    const finalGroqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: finalPromptSystem },
          { role: 'user', content: `Based on these summaries:\n\n${chunkSummaries.join('\n\n')}` },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!finalGroqResponse.ok) {
      const errorBody = await finalGroqResponse.text()
      console.error('[v0] Groq API error:', errorBody)
      throw new Error(`Groq API error: ${finalGroqResponse.status}`)
    }

    const groqData = await finalGroqResponse.json()
    let insights
    try {
      const content = groqData.choices?.[0]?.message?.content || ''
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      insights = JSON.parse(cleanContent)
    } catch {
      insights = {
        summary: 'Documentation loaded and analyzed successfully.',
        keyPoints: ['Crawled sections of documentation', 'Ready to answer questions'],
        suggestedQuestions: ['What are the main features?', 'How do I get started?'],
      }
    }

    return NextResponse.json({ insights, content: docContent })
  } catch (error) {
    console.error('[v0] Error scraping docs:', error)
    return NextResponse.json({ error: 'Failed to analyze documentation. Please check the URL and try again.' }, { status: 500 })
  }
}
