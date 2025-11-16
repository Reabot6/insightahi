'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Loader2, Paperclip, FileText, Sparkles, Plus, Menu, ArrowDown } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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
    compact: 'space-y-3',
    comfortable: 'space-y-6',
    spacious: 'space-y-8',
  }

  const brandColor = mode === 'dev' ? 'blue' : 'purple'

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col bg-slate-950">
        {onToggleSidebar && (
          <div className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="rounded-xl hover:bg-slate-800/80 transition-all hover:scale-105"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950">
          <div className="text-center space-y-8 max-w-md px-4">
            <div className="relative mx-auto w-28 h-28">
              <div className={`absolute inset-0 bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 rounded-3xl opacity-20 blur-3xl animate-pulse`}></div>
              <div className={`relative w-28 h-28 rounded-3xl bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 flex items-center justify-center shadow-2xl shadow-${brandColor}-500/30`}>
                <span className="text-white font-bold text-5xl">R</span>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-white">Ready to Explore</h2>
              <p className="text-slate-400 leading-relaxed">
                Start a conversation to analyze docs, PDFs, or get AI-powered insights
              </p>
            </div>
            <Button onClick={onNewConversation} size="lg" className={`rounded-xl shadow-lg bg-gradient-to-r from-${brandColor}-500 to-${brandColor}-600 hover:from-${brandColor}-600 hover:to-${brandColor}-700 transition-all hover:scale-105`}>
              <Plus className="w-5 h-5 mr-2" />
              Start New Chat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative bg-slate-950">
      {onToggleSidebar && sidebarWidth === 0 && (
        <div className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="rounded-xl hover:bg-slate-800/80 transition-all hover:scale-105"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-white">{conversation?.title || 'ReadRover'}</h3>
          </div>
        </div>
      )}

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {conversation && conversation.messages.length === 0 ? (
            <div className="text-center space-y-10 py-16">
              <div className="relative mx-auto w-28 h-28">
                <div className={`absolute inset-0 bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 rounded-3xl opacity-20 blur-3xl animate-pulse`}></div>
                <div className={`relative w-28 h-28 rounded-3xl bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 flex items-center justify-center shadow-2xl shadow-${brandColor}-500/30`}>
                  <span className="text-white font-bold text-5xl">R</span>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-white">How can I help you today?</h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                  {mode === 'dev' 
                    ? 'Paste a documentation URL, upload a PDF, or ask about any framework' 
                    : 'Upload study materials or paste content to get summaries and quizzes'}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                {SUGGESTED_PROMPTS[mode].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmitPrompt(prompt)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-white transition-all hover:scale-105 hover:shadow-lg"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : conversation && conversation.messages.length > 0 ? (
            <div className={densityStyles[settings.density]}>
              {conversation.messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  onEdit={handleEditMessage}
                  mode={mode}
                  ttsVoice={settings.ttsVoice}
                />
              ))}
            </div>
          ) : null}

          {isLoading && (
            <div className="flex items-start gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-${brandColor}-500/30`}>
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div className="flex-1 rounded-2xl px-5 py-4 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-slate-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollButton && (
        <Button
          size="icon"
          className={`absolute right-6 bottom-32 rounded-full shadow-2xl bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 hover:from-${brandColor}-600 hover:to-${brandColor}-700 transition-all hover:scale-110 animate-in fade-in zoom-in duration-300`}
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
      )}

      <div className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="relative">
            <div className={cn(
              "flex items-end gap-3 rounded-2xl border-2 transition-all bg-slate-800/50 p-3 shadow-xl",
              "border-slate-700 hover:border-slate-600 focus-within:border-blue-500 focus-within:shadow-2xl focus-within:shadow-blue-500/20"
            )}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0 rounded-xl hover:bg-slate-700/50 transition-all hover:scale-105"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="w-5 h-5" />
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
                className="flex-1 min-h-[28px] max-h-[180px] resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none text-base px-0 text-white placeholder:text-slate-500 whitespace-pre-wrap break-words"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={`flex-shrink-0 rounded-xl h-11 w-11 shadow-lg bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 hover:from-${brandColor}-600 hover:to-${brandColor}-700 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100`}
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
          <p className="text-xs text-slate-500 text-center mt-3">
            Press <kbd className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">Enter</kbd> to send • <kbd className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  )
}
