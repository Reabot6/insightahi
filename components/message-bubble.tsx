'use client'

import { useState, useEffect } from 'react'
import { User, Copy, Check, Edit2, ThumbsUp, ThumbsDown, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { cn } from '@/lib/utils'
import type { Message } from './chat-interface'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

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

  return (
    <div className="relative group my-5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <span className="text-xs font-mono font-bold text-gray-300 tracking-wider">{language}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-white/10 transition-all hover:scale-110"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
        </Button>
      </div>
      <div className="p-5 overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          showLineNumbers
          lineNumberStyle={{
            color: '#6b7280',
            paddingRight: '1rem',
            userSelect: 'none',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export default function MessageBubble({ 
  message, 
  onEdit, 
  mode = 'dev', 
  ttsVoice = 'alloy' 
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(message.content)
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const modeConfig = {
    dev: {
      gradient: 'from-cyan-400 to-blue-600',
      hoverGradient: 'from-cyan-500 to-blue-700',
      glow: 'shadow-cyan-500/30',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    user: {
      gradient: 'from-purple-400 to-pink-600',
      hoverGradient: 'from-purple-500 to-pink-700',
      glow: 'shadow-purple-500/30',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
    }
  }[mode]

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
      const scriptResponse = await fetch('/api/generate-tts-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.content })
      })

      const scriptData = await scriptResponse.json()
      const conversationalScript = scriptData.script || message.content

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
        const utterance = new SpeechSynthesisUtterance(conversationalScript)
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
      }
    } catch (error) {
      console.error('TTS error:', error)
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

  return (
    <div 
      className={cn(
        'flex gap-5 group animate-in fade-in slide-in-from-bottom-4 duration-500',
        message.role === 'user' && 'flex-row-reverse'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl transition-all",
        message.role === 'assistant' 
          ? `bg-gradient-to-br ${modeConfig.gradient} ${modeConfig.glow}` 
          : 'bg-gradient-to-br from-gray-700 to-gray-800 shadow-gray-700/30'
      )}>
        {message.role === 'assistant' ? (
          <span className="text-white font-black text-xl">I</span>
        ) : (
          <User className="w-6 h-6 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('flex-1 space-y-3 min-w-0 max-w-[85%]', message.role === 'user' && 'flex flex-col items-end')}>
        {isEditing ? (
          <div className="w-full space-y-3 animate-in fade-in zoom-in duration-300">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[140px] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 focus:ring-0 resize-none p-5 text-base"
              autoFocus
            />
            <div className="flex gap-3">
              <Button 
                size="sm" 
                onClick={handleSaveEdit} 
                className={cn(
                  "h-10 px-5 rounded-xl font-medium shadow-lg",
                  `bg-gradient-to-r ${modeConfig.gradient} hover:bg-gradient-to-r ${modeConfig.hoverGradient}`,
                  "hover:scale-105 transition-all"
                )}
              >
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancelEdit}
                className="h-10 px-5 rounded-xl border-white/20 hover:bg-white/10 transition-all hover:scale-105"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative group/message w-full">
            <div className={cn(
              "rounded-3xl px-6 py-5 shadow-2xl transition-all w-full",
              message.role === 'assistant' 
                ? 'bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20' 
                : `bg-gradient-to-br ${modeConfig.gradient} text-white ${modeConfig.glow}`
            )}>
              {message.role === 'assistant' ? (
                <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-a:text-cyan-400 prose-code:text-pink-400 prose-pre:p-0 prose-pre:bg-transparent">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')

                        return !inline && match ? (
                          <CodeBlock language={match[1]} value={codeString} />
                        ) : (
                          <code
                            className="bg-white/10 px-2 py-1 rounded-lg text-sm font-mono border border-white/20"
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
                <p className="text-base whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              )}
            </div>

            {/* Floating Action Bar */}
            <div className={cn(
              "flex items-center gap-2 mt-4 transition-all duration-300",
              "opacity-0 group-hover/message:opacity-100",
              showActions && "opacity-100",
              message.role === 'user' && 'justify-end'
            )}>
              <span className="text-xs text-gray-500 mr-2 animate-in fade-in slide-in-from-left-2 duration-200">
                {formatTimestamp(message.timestamp)}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                onClick={() => copyToClipboard(message.content)}
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </Button>

              {message.role === 'assistant' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all hover:scale-110",
                      liked === true && "text-cyan-400 bg-cyan-500/20 animate-in zoom-in-50"
                    )}
                    onClick={() => handleLike(true)}
                  >
                    <ThumbsUp className={cn("w-4 h-4", liked === true && "fill-current scale-110")} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all hover:scale-110",
                      liked === false && "text-red-400 bg-red-500/20 animate-in zoom-in-50"
                    )}
                    onClick={() => handleLike(false)}
                  >
                    <ThumbsDown className={cn("w-4 h-4", liked === false && "fill-current scale-110")} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all hover:scale-110",
                      isSpeaking && "text-green-400 bg-green-500/20 animate-pulse"
                    )}
                    onClick={handleSpeak}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </>
              )}

              {message.role === 'user' && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
