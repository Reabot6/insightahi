'use client'

import { useState } from 'react'
import { Code2, GraduationCap, Sparkles, FileText, ImageIcon, Link2, ArrowRight, Zap, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatInterface from '@/components/chat-interface'

type Mode = 'dev' | 'user'

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  const [showChat, setShowChat] = useState(false)

  if (showChat && selectedMode) {
    return <ChatInterface mode={selectedMode} onBack={() => { setShowChat(false); setSelectedMode(null); }} />
  }

  if (selectedMode && !showChat) {
    return selectedMode === 'dev' ? <DevModeLanding onStart={() => setShowChat(true)} onBack={() => setSelectedMode(null)} /> : <UserModeLanding onStart={() => setShowChat(true)} onBack={() => setSelectedMode(null)} />
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),rgba(168,85,247,0.05),transparent)]"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-8">
            <div className="relative w-20 h-20 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-4xl">I</span>
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4 border border-blue-500/20">
            <Sparkles className="w-4 h-4" />
            Turn Docs & PDFs into Instant Answers
          </div>
          
          <h1 className="text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              InsightAI
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Paste URLs, upload PDFs, or scan images — let AI tutor, summarize, and explain everything for you.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-16">
            <button
              onClick={() => setSelectedMode('dev')}
              className="group relative p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-all text-left overflow-hidden backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Code2 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">For Developers</h3>
                <p className="text-slate-400 mb-6">
                  Understand documentation faster. Get instant insights from any technical docs, APIs, or frameworks.
                </p>
                <div className="flex items-center text-blue-400 font-medium">
                  Start building <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode('user')}
              className="group relative p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left overflow-hidden backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <GraduationCap className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">For Learning</h3>
                <p className="text-slate-400 mb-6">
                  Study smarter with AI. Upload study materials and get summaries, quizzes, and explanations.
                </p>
                <div className="flex items-center text-purple-400 font-medium">
                  Start learning <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-16 text-sm">
            <div className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
              <Zap className="w-4 h-4 text-yellow-400" />
              Instant Processing
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
              <Shield className="w-4 h-4 text-green-400" />
              Privacy-First
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-300 transition-colors">
              <Clock className="w-4 h-4 text-blue-400" />
              No Sign-Up
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-0 right-0 text-center text-slate-500 text-sm">
        <p>© 2025 Reabot6 • Built with ❤️ • Powered by AI</p>
      </div>
    </div>
  )
}

function DevModeLanding({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={onBack} className="mb-8 hover:bg-slate-800">
          ← Back
        </Button>
        
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Code2 className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold text-white">Developer Mode</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Skip hours of reading docs. Get instant answers, code examples, and implementation guides.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500/50 transition-all backdrop-blur-sm">
              <Link2 className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-semibold mb-2 text-white">Paste Doc URLs</h3>
              <p className="text-sm text-slate-400">
                AI reads any documentation link and gives you instant insights
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500/50 transition-all backdrop-blur-sm">
              <FileText className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-semibold mb-2 text-white">Upload PDFs</h3>
              <p className="text-sm text-slate-400">
                Drag & drop PDF docs for summaries and code examples
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500/50 transition-all backdrop-blur-sm">
              <ImageIcon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-semibold mb-2 text-white">Scan Images</h3>
              <p className="text-sm text-slate-400">
                Screenshots or diagrams — AI will read and explain them
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Button size="lg" onClick={onStart} className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Exploring Docs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserModeLanding({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={onBack} className="mb-8 hover:bg-slate-800">
          ← Back
        </Button>
        
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-5xl font-bold text-white">Learning Mode</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Your personal AI tutor. Upload study materials and get summaries, quizzes, flashcards, and step-by-step explanations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-purple-500/50 transition-all backdrop-blur-sm">
              <FileText className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="font-semibold mb-2 text-white">Upload Documents</h3>
              <p className="text-sm text-slate-400">
                Drop your study PDFs and get instant summaries with key topics
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-purple-500/50 transition-all backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="font-semibold mb-2 text-white">Practice Materials</h3>
              <p className="text-sm text-slate-400">
                Auto-generated flashcards, quizzes, and practice tests
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-purple-500/50 transition-all backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="font-semibold mb-2 text-white">Interactive Tutoring</h3>
              <p className="text-sm text-slate-400">
                Ask questions and get detailed explanations with examples
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Button size="lg" onClick={onStart} className="h-14 px-8 text-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 transition-all hover:scale-105">
              <GraduationCap className="w-5 h-5 mr-2" />
              Start Learning
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
