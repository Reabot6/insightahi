'use client'

import { User, Copy, Check, Edit2, ThumbsUp, ThumbsDown, Volume2, VolumeX } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { cn } from '@/lib/utils'
import type { Message } from './chat-interface'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: Message
  onEdit?: (messageId: string, newContent: string) => void
  mode?: 'dev' | 'user'
  ttsVoice?: string
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = value.split('\n')

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl bg-slate-900">
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-slate-400 font-mono font-semibold uppercase tracking-wider ml-2">{language}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-slate-700 transition-all hover:scale-105"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
        </Button>
      </div>
      <pre className="bg-gradient-to-br from-slate-950 to-slate-900 p-5 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell text-right pr-4 select-none text-slate-600 font-mono text-xs">{i + 1}</span>
              <span className="table-cell text-slate-300 whitespace-pre">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

export default function MessageBubble({ message, onEdit, mode = 'dev', ttsVoice = 'alloy' }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(message.content)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showTimestamp, setShowTimestamp] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(message.id, editedContent.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedContent(message.content)
    setIsEditing(false)
  }

  const handleLike = (isLike: boolean) => {
    setLiked(liked === isLike ? null : isLike)
  }

  const handleSpeak = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    try {
      // Call server-side endpoint to generate conversational script
      const scriptResponse = await fetch('/api/generate-tts-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.content })
      })

      const scriptData = await scriptResponse.json()
      const conversationalScript = scriptData.script || message.content

      // Try using TTS API
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: conversationalScript, voice: ttsVoice })
      })

      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.onended = () => setIsSpeaking(false)
        audio.play()
        setIsSpeaking(true)
      } else {
        // Fallback to browser's built-in speech synthesis
        const utterance = new SpeechSynthesisUtterance(conversationalScript)
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
      }
    } catch (error) {
      console.error('TTS error:', error)
      // Final fallback
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const brandColor = mode === 'dev' ? 'blue' : 'purple'

  return (
    <div 
      className={cn('flex gap-4 group animate-in fade-in slide-in-from-bottom-4 duration-500', message.role === 'user' && 'flex-row-reverse')}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg',
          message.role === 'assistant' 
            ? `bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 shadow-${brandColor}-500/30` 
            : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-700/30'
        )}
      >
        {message.role === 'assistant' ? (
          <span className="text-white font-bold text-lg">R</span>
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>

      <div className={cn('flex-1 space-y-2 min-w-0 max-w-[85%]', message.role === 'user' && 'flex flex-col items-end')}>
        {isEditing ? (
          <div className="w-full max-w-[85%] space-y-3 animate-in fade-in zoom-in duration-300">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[120px] rounded-xl border-2 border-blue-500 bg-slate-900/50 text-white focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} className="rounded-lg bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105">
                <Check className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="rounded-lg border-slate-700 hover:bg-slate-800 transition-all hover:scale-105">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative group/message w-full">
            <div
              className={cn(
                'rounded-2xl px-5 py-4 shadow-xl transition-all w-full',
                message.role === 'assistant' 
                  ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50' 
                  : `bg-gradient-to-br from-${brandColor}-600 to-${brandColor}-700 text-white shadow-${brandColor}-500/20`
              )}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none prose-p:text-slate-200 prose-p:leading-relaxed prose-headings:text-white prose-a:text-blue-400 prose-code:text-pink-400 prose-pre:my-0 prose-pre:p-0 prose-pre:bg-transparent break-words">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')

                        return !inline && match ? (
                          <CodeBlock language={match[1]} value={codeString} />
                        ) : (
                          <code
                            className="bg-slate-900/60 px-2 py-0.5 rounded-md text-sm font-mono border border-slate-700"
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              )}
            </div>

            <div className={cn(
              'flex items-center gap-1.5 mt-3 transition-all',
              'opacity-0 group-hover/message:opacity-100',
              message.role === 'user' && 'justify-end'
            )}>
              {showTimestamp && (
                <span className="text-xs text-slate-500 mr-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  {formatTimestamp(message.timestamp)}
                </span>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                onClick={() => copyToClipboard(message.content)}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              
              {message.role === 'assistant' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all hover:scale-110 active:scale-95",
                      liked === true && "text-blue-400 bg-blue-500/10 animate-in zoom-in-50 duration-200"
                    )}
                    onClick={() => handleLike(true)}
                  >
                    <ThumbsUp className={cn("w-3.5 h-3.5 transition-all", liked === true && "fill-current scale-110")} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all hover:scale-110 active:scale-95",
                      liked === false && "text-red-400 bg-red-500/10 animate-in zoom-in-50 duration-200"
                    )}
                    onClick={() => handleLike(false)}
                  >
                    <ThumbsDown className={cn("w-3.5 h-3.5 transition-all", liked === false && "fill-current scale-110")} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all hover:scale-110 active:scale-95",
                      isSpeaking && "text-green-400 bg-green-500/10 animate-pulse"
                    )}
                    onClick={handleSpeak}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </Button>
                </>
              )}
              
              {message.role === 'user' && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
