'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Plus,
  Trash2,
  MessageSquare,
  Edit2,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Home,
} from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'
import type { Conversation } from './chat-interface'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
  width: number
  onResize: (width: number) => void
  mode: 'dev' | 'user'
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  width,
  onResize,
  mode,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const modeConfig = {
    dev: {
      gradient: 'from-cyan-400 to-blue-600',
      hoverGradient: 'from-cyan-500 to-blue-700',
      glow: 'shadow-cyan-500/30',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    user: {
      gradient: 'from-purple-400 to-pink-600',
      hoverGradient: 'from-purple-500 to-pink-700',
      glow: 'shadow-purple-500/30',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  }[mode]

  /* ---------- RESIZE LOGIC ---------- */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      if (newWidth >= 280 && newWidth <= 500) onResize(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = 'default'
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
  }, [isResizing, onResize])

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  /* ---------- EDIT LOGIC ---------- */
  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) onRenameConversation(editingId, editTitle.trim())
    setEditingId(null)
    setEditTitle('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const getPreview = (conv: Conversation) => {
    if (conv.messages.length === 0) return 'No messages yet'
    const last = conv.messages[conv.messages.length - 1].content
    return last.length > 50 ? last.slice(0, 50) + '...' : last
  }

  /* ---------- COLLAPSED VIEW ---------- */
  if (isCollapsed) {
    return (
      <div className="w-16 h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col items-center py-6 gap-6 relative z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            `bg-gradient-to-br ${modeConfig.gradient} shadow-lg`,
            modeConfig.glow
          )}
        >
          <span className="text-white font-black text-xl">I</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNewConversation}
          className="rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
        >
          <Plus className="w-5 h-5" />
        </Button>

        {/* Home button – always shown in collapsed view */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          className="rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
          title="Home"
        >
          <Home className="w-5 h-5" />
        </Button>

        <div className="flex-1" />
        <div className="text-xs text-gray-500 font-medium">Chats</div>
      </div>
    )
  }

  /* ---------- EXPANDED VIEW ---------- */
  return (
    <div
      ref={sidebarRef}
      className="h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col relative z-40"
      style={{
        width: typeof window !== 'undefined' && window.innerWidth < 768 ? '85vw' : `${width}px`,
        minWidth: 280,
        maxWidth: 500,
      }}
    >
      {/* Mobile overlay */}
      {typeof window !== 'undefined' && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* ---------- HEADER ---------- */}
      <div className="p-5 border-b border-white/10 space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center',
                `bg-gradient-to-br ${modeConfig.gradient} shadow-lg`,
                modeConfig.glow
              )}
            >
              <span className="text-white font-black text-xl">I</span>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-lg font-black text-white">InsightAI</h1>
            <p className="text-xs text-gray-400">AI Tutor</p>
          </div>
        </div>

        {/* New Chat + Home buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onNewConversation}
            className={cn(
              'flex-1 h-12 rounded-xl font-bold text-sm',
              `bg-gradient-to-r ${modeConfig.gradient} hover:bg-gradient-to-r ${modeConfig.hoverGradient}`,
              'shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            New Chat
          </Button>

          {/* Home button – shown in BOTH modes */}
          <Button
            variant="outline"
            className="h-12 w-12 rounded-xl border-white/20 hover:bg-white/10 transition-all hover:scale-105"
            onClick={() => router.push('/')}
            title="Back to Home"
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* ---------- CONVERSATIONS LIST ---------- */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">No chats yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className="relative group"
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Hover action bar */}
                {hoveredId === conv.id && !editingId && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 p-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl animate-in fade-in slide-in-from-top duration-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(conv)
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-500/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conv.id)
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {/* Conversation item */}
                <div
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    'relative p-4 rounded-2xl cursor-pointer transition-all duration-200',
                    'hover:bg-white/10 active:scale-[0.98]',
                    currentConversationId === conv.id && 'bg-white/10 ring-1 ring-white/20 shadow-lg'
                  )}
                >
                  {editingId === conv.id ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="Chat title..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-9" onClick={saveEdit}>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-9" onClick={cancelEdit}>
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                          'bg-white/10'
                        )}
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-sm font-semibold text-white truncate">{conv.title}</h3>
                        <p className="text-xs text-gray-400 truncate">{getPreview(conv)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* ---------- RESIZE HANDLE ---------- */}
      <div
        className={cn(
          'absolute top-0 right-0 w-2 h-full cursor-col-resize transition-all',
          'hover:w-3 hover:bg-white/30',
          isResizing && 'bg-gradient-to-b from-cyan-500 to-purple-600 w-3'
        )}
        onMouseDown={startResize}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-20 opacity-0 hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-xl flex items-center justify-center">
          <div className="flex flex-col gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
