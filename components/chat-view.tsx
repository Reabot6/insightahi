'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Loader2, Paperclip, Sparkles, Plus, Menu, ArrowDown, Upload, FileText } from 'lucide-react'
import type { Conversation, Message } from './chat-interface'
import MessageBubble from './message-bubble'
import { cn } from '@/lib/utils'

interface ChatViewProps {
  conversation: Conversation | undefined
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void
  onNewConversation: () => void
  sidebarWidth: number
  onToggleSidebar?: () => void
  mode: 'dev' | 'user'
  settings: {
    theme: 'light' | 'dark' | 'auto'
    ttsVoice: string
    density: 'compact' | 'comfortable' | 'spacious'
  }
}

const SUGGESTED_PROMPTS = {
  dev: [
    "How do I get started with this framework?",
    "Show me a basic example",
    "What are the best practices?",
    "Explain the authentication flow",
  ],
  user: [
    "Summarize this document for me",
    "Create a quiz from this content",
    "What are the key takeaways?",
    "Explain this in simpler terms",
  ],
}

export default function ChatView({
  conversation,
  onUpdateConversation,
  onNewConversation,
  sidebarWidth,
  onToggleSidebar,
  mode,
  settings,
}: ChatViewProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)

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

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    scrollToBottom(false)
  }, [conversation?.messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150
      setShowScrollButton(!isNearBottom && scrollHeight > clientHeight)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // File Dropzone
  useEffect(() => {
    const dropzone = dropzoneRef.current
    if (!dropzone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = () => {
      setIsDragging(false)
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer?.files[0]
      if (file) {
        handleFile(file)
      }
    }

    dropzone.addEventListener('dragover', handleDragOver)
    dropzone.addEventListener('dragleave', handleDragLeave)
    dropzone.addEventListener('drop', handleDrop)

    return () => {
      dropzone.removeEventListener('dragover', handleDragOver)
      dropzone.removeEventListener('dragleave', handleDragLeave)
      dropzone.removeEventListener('drop', handleDrop)
    }
  }, [conversation])

  const handleFile = async (file: File) => {
    if (!file || !conversation) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)

      const response = await fetch('/api/extract-file', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.text) {
        const newMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: data.text,
          timestamp: Date.now(),
        }

        const updatedMessages = [...conversation.messages, newMessage]
        onUpdateConversation(conversation.id, { messages: updatedMessages })

        if (conversation.messages.length === 0) {
          const title = file.name.length > 30 ? file.name.slice(0, 30) + '...' : file.name
          onUpdateConversation(conversation.id, { title })
        }

        handleRegenerateFromMessage(updatedMessages)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!conversation) return

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const updatedMessages = conversation.messages.slice(0, messageIndex + 1).map(m =>
      m.id === messageId ? { ...m, content: newContent, isEditing: false } : m
    )

    onUpdateConversation(conversation.id, { messages: updatedMessages })

    if (updatedMessages[updatedMessages.length - 1].role === 'user') {
      handleRegenerateFromMessage(updatedMessages)
    }
  }

  const handleRegenerateFromMessage = async (messages: Message[]) => {
    if (!conversation) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: conversation.docUrl,
          docContent: conversation.docContent,
          messages: messages.map(({ id, ...rest }) => rest),
        }),
      })

      const data = await response.json()

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        }

        onUpdateConversation(conversation.id, {
          messages: [...messages, assistantMessage],
        })
      }
    } catch (error) {
      console.error('Error regenerating response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !conversation) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setInput('')
    const updatedMessages = [...conversation.messages, userMessage]
    onUpdateConversation(conversation.id, { messages: updatedMessages })

    if (conversation.messages.length === 0) {
      const title = input.trim().slice(0, 40) + (input.length > 40 ? '...' : '')
      onUpdateConversation(conversation.id, { title })
    }

    setIsLoading(true)

    try {
      const urlMatch = input.match(/https?:\/\/[^\s]+/)
      
      if (urlMatch && !conversation.docContent) {
        const crawlResponse = await fetch('/api/scrape-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlMatch[0] }),
        })

        const crawlData = await crawlResponse.json()
        
        if (crawlData.content) {
          onUpdateConversation(conversation.id, {
            docUrl: urlMatch[0],
            docContent: crawlData.content,
          })

          if (crawlData.insights) {
            const insightsMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `I've analyzed the documentation from **${urlMatch[0]}**\n\n**Summary:**\n${crawlData.insights.summary}\n\n**Key Points:**\n${crawlData.insights.keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}\n\n**Suggested Questions:**\n${crawlData.insights.suggestedQuestions?.map((q: string) => `• ${q}`).join('\n') || ''}\n\nFeel free to ask me anything about this documentation!`,
              timestamp: Date.now(),
            }

            onUpdateConversation(conversation.id, {
              messages: [...updatedMessages, insightsMessage],
            })
          }
        }
      } else {
        const response = await fetch('/api/chat-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: conversation.docUrl,
            docContent: conversation.docContent,
            messages: updatedMessages.map(({ id, ...rest }) => rest),
            mode,
          }),
        })

        const data = await response.json()

        if (data.response) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: Date.now(),
          }

          onUpdateConversation(conversation.id, {
            messages: [...updatedMessages, assistantMessage],
          })
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPrompt = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        const event = new Event('submit', { cancelable: true, bubbles: true })
        form.dispatchEvent(event)
      }
    }, 100)
  }

  const densityStyles = {
    compact: 'space-y-4',
    comfortable: 'space-y-7',
    spacious: 'space-y-10',
  }

  // Empty State
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col bg-black">
        {onToggleSidebar && (
          <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
          <div className="text-center space-y-10 max-w-2xl px-6 z-10">
            <div className="relative mx-auto w-32 h-32">
              <div className={cn(
                "absolute inset-0 rounded-3xl blur-3xl opacity-30 animate-pulse",
                `bg-gradient-to-br ${modeConfig.gradient}`
              )} style={{ animationDuration: '4s' }}></div>
              <div className={cn(
                "relative w-32 h-32 rounded-3xl flex items-center justify-center",
                `bg-gradient-to-br ${modeConfig.gradient} shadow-2xl`,
                modeConfig.glow
              )}>
                <span className="text-white font-black text-6xl">I</span>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tight text-white">Ready to Explore</h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Start a conversation to analyze docs, PDFs, or get AI-powered insights
              </p>
            </div>
            <Button 
              onClick={onNewConversation} 
              size="lg" 
              className={cn(
                "h-16 px-8 text-lg font-bold rounded-xl shadow-2xl",
                `bg-gradient-to-r ${modeConfig.gradient} hover:bg-gradient-to-r ${modeConfig.hoverGradient}`,
                "hover:scale-105 transition-all"
              )}
            >
              <Sparkles className="w-6 h-6 mr-3" />
              Start New Chat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative bg-black" ref={dropzoneRef}>
      {/* Header */}
      {onToggleSidebar && sidebarWidth === 0 && (
        <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate text-white">{conversation.title}</h3>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        <div className="max-w-4xl mx-auto">
          {conversation.messages.length === 0 ? (
            <div className="text-center space-y-12 py-20">
              <div className="relative mx-auto w-32 h-32">
                <div className={cn(
                  "absolute inset-0 rounded-3xl blur-3xl opacity-30 animate-pulse",
                  `bg-gradient-to-br ${modeConfig.gradient}`
                )} style={{ animationDuration: '4s' }}></div>
                <div className={cn(
                  "relative w-32 h-32 rounded-3xl flex items-center justify-center",
                  `bg-gradient-to-br ${modeConfig.gradient} shadow-2xl`,
                  modeConfig.glow
                )}>
                  <span className="text-white font-black text-6xl">I</span>
                </div>
              </div>
              <div className="space-y-5">
                <h2 className="text-4xl font-black tracking-tight text-white">How can I help you today?</h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  {mode === 'dev' 
                    ? 'Paste a documentation URL, upload a PDF, or ask about any framework' 
                    : 'Upload study materials or paste content to get summaries and quizzes'}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                {SUGGESTED_PROMPTS[mode].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmitPrompt(prompt)}
                    className={cn(
                      "px-5 py-3 rounded-xl text-sm font-medium transition-all",
                      "bg-white/5 border border-white/10 backdrop-blur-xl",
                      "hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:shadow-lg"
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className={cn(
                "mt-12 p-8 rounded-3xl border-2 border-dashed backdrop-blur-xl",
                isDragging ? modeConfig.border : "border-white/10",
                isDragging ? modeConfig.bg : "bg-white/5"
              )}>
                <Upload className={cn("w-12 h-12 mx-auto mb-4", isDragging ? modeConfig.text : "text-gray-500")} />
                <p className="text-sm text-gray-400">
                  {isDragging ? "Drop your file here" : "Drag & drop PDF or image here"}
                </p>
              </div>
            </div>
          ) : (
            <div className={cn("space-y-6", densityStyles[settings.density])}>
              {conversation.messages.map((message, i) => (
                <div
                  key={message.id}
                  className={cn(
                    "animate-in fade-in slide-in-from-bottom-4 duration-500",
                    i === conversation.messages.length - 1 && "scroll-mt-32"
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <MessageBubble 
                    message={message} 
                    onEdit={handleEditMessage}
                    mode={mode}
                    ttsVoice={settings.ttsVoice}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-start gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                `bg-gradient-to-br ${modeConfig.gradient} shadow-lg`,
                modeConfig.glow
              )}>
                <span className="text-white font-black text-xl">I</span>
              </div>
              <div className="flex-1 rounded-2xl px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className={cn("w-2 h-2 rounded-full animate-bounce", modeConfig.text)} style={{ animationDelay: '0ms' }}></div>
                    <div className={cn("w-2 h-2 rounded-full animate-bounce", modeConfig.text)} style={{ animationDelay: '150ms' }}></div>
                    <div className={cn("w-2 h-2 rounded-full animate-bounce", modeConfig.text)} style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to Bottom */}
      {showScrollButton && (
        <Button
          size="icon"
          className={cn(
            "absolute right-6 bottom-32 rounded-full shadow-2xl",
            `bg-gradient-to-br ${modeConfig.gradient} hover:scale-110 transition-all`,
            "animate-in fade-in zoom-in duration-300"
          )}
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
      )}

      {/* Input */}
      <div className="border-t border-white/10 bg-white/5 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="relative">
            <div className={cn(
              "flex items-end gap-3 rounded-2xl border-2 transition-all p-4 shadow-2xl",
              "bg-white/5 backdrop-blur-xl",
              "border-white/10 hover:border-white/20",
              "focus-within:border-white/30 focus-within:shadow-xl"
            )}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <Textarea
                ref={textareaRef}
                placeholder={mode === 'dev' ? "Ask about docs, paste a URL, or upload a file..." : "Upload content or ask a question..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                disabled={isLoading}
                className="flex-1 min-h-[28px] max-h-[180px] resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none text-base px-0 text-white placeholder:text-gray-500 whitespace-pre-wrap break-words"
                rows={1}
              />

              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex-shrink-0 rounded-xl h-12 w-12 shadow-lg",
                  `bg-gradient-to-br ${modeConfig.gradient} hover:bg-gradient-to-br ${modeConfig.hoverGradient}`,
                  "hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <p className="text-xs text-gray-500 text-center mt-3">
            Press <kbd className="px-2 py-1 rounded-md bg-white/10 text-gray-300 text-xs font-mono border border-white/20">Enter</kbd> to send • <kbd className="px-2 py-1 rounded-md bg-white/10 text-gray-300 text-xs font-mono border border-white/20">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  )
}
