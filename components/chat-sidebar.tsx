'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, MessageSquare, Edit2, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'
import type { Conversation } from './chat-interface'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      if (newWidth >= 250 && newWidth <= 500) {
        onResize(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, onResize])

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const getLastMessage = (conversation: Conversation) => {
    if (conversation.messages.length === 0) return 'No messages yet'
    const lastMsg = conversation.messages[conversation.messages.length - 1]
    return lastMsg.content.slice(0, 60) + (lastMsg.content.length > 60 ? '...' : '')
  }

  const brandColor = mode === 'dev' ? 'blue' : 'purple'

  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-slate-800/50 flex flex-col items-center bg-slate-900/50 backdrop-blur-xl py-4 gap-3 relative z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="rounded-xl hover:bg-slate-800/80 transition-all hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 flex items-center justify-center shadow-lg shadow-${brandColor}-500/20`}>
          <span className="text-white font-bold text-xl">I</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
        onClick={onToggleCollapse}
      />
      
      <div 
        ref={sidebarRef}
        className="fixed md:relative left-0 top-0 h-full border-r border-slate-800/50 flex flex-col bg-slate-900/95 md:bg-slate-900/50 backdrop-blur-xl z-40"
        style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '80vw' : `${width}px`, minWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? 'auto' : '250px', maxWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? '80vw' : '500px' }}
      >
        <div className="px-4 py-4 border-b border-slate-800/50 space-y-4">
          <div className="flex items-center gap-3">
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="rounded-xl hover:bg-slate-800/80 transition-all hover:scale-105 flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-${brandColor}-500 to-${brandColor}-600 shadow-lg shadow-${brandColor}-500/20 flex-shrink-0`}>
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold tracking-tight text-white">InsightAI</h1>
              <p className="text-xs text-slate-400">AI Doc Assistant</p>
            </div>
          </div>
          <Button 
            onClick={onNewConversation} 
            className={`w-full h-10 rounded-xl font-semibold bg-gradient-to-r from-${brandColor}-500 to-${brandColor}-600 hover:from-${brandColor}-600 hover:to-${brandColor}-700 shadow-lg shadow-${brandColor}-500/20 transition-all hover:scale-[1.02]`}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-3">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="relative group"
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {hoveredId === conversation.id && !editingId && (
                  <div className="absolute -top-9 left-0 right-0 z-20 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-slate-700 text-slate-300 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(conversation)
                      }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Rename
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conversation.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
                
                <div
                  className={cn(
                    'flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all',
                    'hover:bg-slate-800/60 active:scale-[0.98]',
                    currentConversationId === conversation.id && 'bg-slate-800/80 shadow-lg ring-1 ring-slate-700/50'
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  
                  {editingId === conversation.id ? (
                    <div className="flex-1 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="h-8 text-sm px-2 bg-slate-900 border-slate-700"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={saveEdit}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1"
                          onClick={cancelEdit}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-sm font-medium text-white truncate">{conversation.title}</div>
                      <div className="text-xs text-slate-500 truncate">{getLastMessage(conversation)}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div
          className={cn(
            "absolute top-0 right-0 w-2 h-full cursor-col-resize group transition-all hidden md:block",
            isResizing ? "bg-gradient-to-b from-blue-500 to-purple-600" : "hover:bg-slate-700/50"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 rounded-lg border border-slate-700 shadow-xl">
            <div className="flex flex-col gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
