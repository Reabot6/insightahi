'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Code2, GraduationCap, Settings, Plus, Menu, X, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import Sidebar from './chat-sidebar'
import ChatView from './chat-view'
import SettingsModal from './settings-modal'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isEditing?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  docUrl?: string
  docContent?: string
  createdAt: number
  updatedAt: number
}

interface ChatInterfaceProps {
  onBack?: () => void
  mode: 'dev' | 'user'
}

export default function ChatInterface({ onBack, mode }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    theme: 'dark' as 'light' | 'dark' | 'auto',
    ttsVoice: 'alloy' as string,
    density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  })

  const resizeRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  // Load/Save per mode
  useEffect(() => {
    const key = mode === 'dev' ? 'insightai-dev-convos' : 'insightai-user-convos'
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConversations(parsed)
        if (parsed.length > 0) setCurrentConversationId(parsed[0].id)
      } catch (e) { console.error(e) }
    } else {
      setConversations([])
      setCurrentConversationId(null)
    }
  }, [mode])

  useEffect(() => {
    const key = mode === 'dev' ? 'insightai-dev-convos' : 'insightai-user-convos'
    if (conversations.length > 0) {
      localStorage.setItem(key, JSON.stringify(conversations))
    }
  }, [conversations, mode])

  // Mobile auto-collapse
  useEffect(() => {
    const handle = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true)
      else setSidebarCollapsed(false)
    }
    handle()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  // Resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = e.clientX
      if (newWidth >= 240 && newWidth <= 500) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = 'default'
    }

    if (isResizing.current) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
  }

  // Conversation CRUD
  const createNewConversation = () => {
    const conv: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setConversations(prev => [conv, ...prev])
    setCurrentConversationId(conv.id)
  }

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id)
      setCurrentConversationId(remaining[0]?.id || null)
    }
  }

  const renameConversation = (id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
  }

  const updateConversation = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c))
  }

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'n') { e.preventDefault(); createNewConversation() }
        if (e.key === 'k') { e.preventDefault(); setShowSidebar(!showSidebar) }
      }
      if (e.key === 'Escape') setShowSettings(false)
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [showSidebar])

  const modeConfig = {
    dev: { gradient: 'from-cyan-400 to-blue-600', icon: Code2, label: 'Developer', color: 'cyan' },
    user: { gradient: 'from-purple-400 to-pink-600', icon: GraduationCap, label: 'Learning', color: 'purple' }
  }[mode]

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse",
          mode === 'dev' ? "bg-cyan-500" : "bg-purple-500",
          "top-20 -left-20"
        )} style={{ animationDuration: '6s' }}></div>
        <div className={cn(
          "absolute w-80 h-80 rounded-full blur-3xl opacity-10 animate-pulse",
          mode === 'dev' ? "bg-blue-600" : "bg-pink-600",
          "bottom-20 -right-20"
        )} style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Mode Orb */}
          <div className={cn(
            "flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-bold",
            "bg-white/5 backdrop-blur-xl border border-white/10",
            "shadow-lg shadow-current/20"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              `bg-gradient-to-br ${modeConfig.gradient} shadow-lg`
            )}>
              <modeConfig.icon className="w-5 h-5" />
            </div>
            <span>{modeConfig.label} Mode</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-110 transition-all"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <>
          <div
            className={cn(
              "h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 transition-all duration-300",
              sidebarCollapsed ? "w-16" : "w-auto"
            )}
            style={{ width: sidebarCollapsed ? 64 : sidebarWidth }}
          >
            <Sidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={setCurrentConversationId}
              onNewConversation={createNewConversation}
              onDeleteConversation={deleteConversation}
              onRenameConversation={renameConversation}
              width={sidebarCollapsed ? 64 : sidebarWidth}
              onResize={setSidebarWidth}
              mode={mode}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              ref={resizeRef}
              onMouseDown={startResize}
              className="w-1 bg-white/10 hover:bg-white/30 cursor-col-resize transition-colors"
            />
          )}
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <ChatView
          conversation={currentConversation}
          onUpdateConversation={updateConversation}
          onNewConversation={createNewConversation}
          sidebarWidth={showSidebar ? (sidebarCollapsed ? 64 : sidebarWidth) : 0}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          mode={mode}
          settings={settings}
        />
      </div>

      {/* Mobile Sidebar Toggle */}
      {!showSidebar && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(true)}
          className="absolute bottom-6 left-6 z-40 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:scale-110 transition-all"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Empty State (if no convo) */}
      {!currentConversation && conversations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 animate-fade-in">
            <div className={cn(
              "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl",
              "border border-white/20 shadow-2xl"
            )}>
              <Sparkles className={cn("w-12 h-12", mode === 'dev' ? "text-cyan-400" : "text-purple-400")} />
            </div>
            <p className="text-xl text-gray-400">Start a new conversation</p>
            <Button
              onClick={createNewConversation}
              className={cn(
                "mt-4 px-6 py-3 rounded-xl font-semibold",
                `bg-gradient-to-r ${modeConfig.gradient} shadow-lg hover:scale-105 transition-all`
              )}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
