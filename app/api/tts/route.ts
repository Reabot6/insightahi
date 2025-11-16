import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'x_Catherine' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const APPID = 'ga827088'
    const API_SECRET = '730f730bec6aa20d0e2a3491f03ea509'
    const API_KEY = 'd784ea9ec831f7dc8d377209be6f4b3e'
    
    if (!APPID || !API_SECRET || !API_KEY) {
      console.error('[v0] iFlytek credentials not configured')
      return NextResponse.json({ error: 'TTS service not configured', useFallback: true }, { status: 500 })
    }

    // Generate authentication signature for iFlytek
    const ts = Math.floor(Date.now() / 1000).toString()
    const baseString = APPID + ts
    const md5 = crypto.createHash('md5').update(baseString).digest('hex')
    const signa = crypto.createHmac('sha1', API_SECRET).update(md5).digest().toString('base64')

    // Fallback to browser TTS as iFlytek requires WebSocket implementation
    console.log('[v0] Using browser fallback for TTS due to WebSocket requirements')
    return NextResponse.json({ 
      error: 'Using browser TTS',
      useFallback: true,
      voice: voice,
    }, { status: 200 })

  } catch (error) {
    console.error('[v0] Error in TTS:', error)
    return NextResponse.json({ 
      error: 'TTS generation failed',
      useFallback: true 
    }, { status: 500 })
  }
}
