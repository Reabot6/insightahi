'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Code2, GraduationCap, Settings } from 'lucide-react'
import { Button } from './ui/button'
import Sidebar from './chat-sidebar'
import ChatView from './chat-view'
import SettingsModal from './settings-modal'

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
  mode: 'dev' | 'user' // Add mode prop
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

  useEffect(() => {
    const storageKey = mode === 'dev' ? 'doc-explainer-dev-conversations' : 'doc-explainer-user-conversations'
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConversations(parsed)
        if (parsed.length > 0) {
          setCurrentConversationId(parsed[0].id)
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
      }
    } else {
      // Reset conversations when switching modes
      setConversations([])
      setCurrentConversationId(null)
    }
  }, [mode])

  useEffect(() => {
    const storageKey = mode === 'dev' ? 'doc-explainer-dev-conversations' : 'doc-explainer-user-conversations'
    if (conversations.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(conversations))
    }
  }, [conversations, mode])

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        setSidebarCollapsed(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setConversations((prev) => [newConversation, ...prev])
    setCurrentConversationId(newConversation.id)
  }

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id)
      setCurrentConversationId(remaining[0]?.id || null)
    }
  }

  const renameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
      )
    )
  }

  const updateConversation = (id: string, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      )
    )
  }

  const currentConversation = conversations.find((c) => c.id === currentConversationId)

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl hover:bg-slate-800/80 backdrop-blur-sm transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all ${
          mode === 'dev' 
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10' 
            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10'
        }`}>
          {mode === 'dev' ? <Code2 className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
          {mode === 'dev' ? 'Developer' : 'Learning'}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          className="rounded-xl hover:bg-slate-800/80 backdrop-blur-sm transition-all hover:scale-105"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
      
      {showSidebar && (
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          width={sidebarWidth}
          onResize={setSidebarWidth}
          mode={mode}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      
      <ChatView
        conversation={currentConversation}
        onUpdateConversation={updateConversation}
        onNewConversation={createNewConversation}
        sidebarWidth={showSidebar ? (sidebarCollapsed ? 64 : sidebarWidth) : 0}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        mode={mode}
        settings={settings}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  )
}
