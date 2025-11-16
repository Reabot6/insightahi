'use client'

import { useState } from 'react'
import { Code2, GraduationCap, Sparkles, FileText, Image as ImageIcon, Link2, ArrowRight, Zap, Shield, Clock, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatInterface from '@/components/chat-interface'
import { cn } from '@/lib/utils'

type Mode = 'dev' | 'user'

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  const [showChat, setShowChat] = useState(false)

  if (showChat && selectedMode) {
    return <ChatInterface mode={selectedMode} onBack={() => { setShowChat(false); setSelectedMode(null); }} />
  }

  if (selectedMode && !showChat) {
    return selectedMode === 'dev' 
      ? <DevModeLanding onStart={() => setShowChat(true)} onBack={() => setSelectedMode(null)} /> 
      : <UserModeLanding onStart={() => setShowChat(true)} onBack={() => setSelectedMode(null)} />
  }

  return <LandingPage onSelectMode={setSelectedMode} />
}

function LandingPage({ onSelectMode }: { onSelectMode: (mode: Mode) => void }) {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Orbital Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full 
                        bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 
                        animate-spin-slow blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full 
                        bg-gradient-to-r from-blue-500/20 to-transparent 
                        animate-spin-reverse blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 md:py-24">
        <header className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-3xl blur-xl opacity-50 
                              group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="relative p-4 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 backdrop-blur-xl 
                              rounded-3xl border border-white/10 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 
                                flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-black tracking-tighter">I</span>
                </div>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 
                          backdrop-blur-md text-sm font-medium">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI that reads, thinks, and teaches</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              InsightAI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Upload PDFs, paste docs, scan images — get <span className="text-cyan-400">instant answers</span>, summaries, and interactive tutoring.
          </p>
        </header>

        {/* Mode Selector – Hero Cards */}
        <div className="mt-20 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <ModeCard
            mode="dev"
            icon={<Code2 className="w-9 h-9" />}
            title="Developer Mode"
            description="Master any API, framework, or doc in minutes."
            features={['URL → Code', 'PDF → Examples', 'Diagram → Explanation']}
            gradient="from-cyan-500 to-blue-600"
            onClick={() => onSelectMode('dev')}
          />

          <ModeCard
            mode="user"
            icon={<GraduationCap className="w-9 h-9" />}
            title="Learning Mode"
            description="Your AI tutor for notes, papers, and exams."
            features={['PDF → Summary', 'Quiz Generator', 'Ask Anything']}
            gradient="from-purple-500 to-pink-600"
            onClick={() => onSelectMode('user')}
          />
        </div>

        {/* Trust Bar */}
        <div className="mt-20 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <TrustItem icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Real-time" />
          <TrustItem icon={<Shield className="w-4 h-4 text-green-400" />} label="Private" />
          <TrustItem icon={<Clock className="w-4 h-4 text-blue-400" />} label="No login" />
        </div>
      </div>

      <footer className="absolute bottom-6 left-0 right-0 text-center text-gray-600 text-xs">
        © 2025 <span className="text-cyan-400">@Reabot6</span> • Built with vision • Powered by curiosity
      </footer>
    </div>
  )
}

function ModeCard({
  icon,
  title,
  description,
  features,
  gradient,
  onClick
}: {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
  gradient: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative p-8 rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl",
        "border border-white/10",
        "hover:border-white/30 transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.99]",
        "text-left shadow-2xl"
      )}
    >
      {/* Gradient Overlay on Hover */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                         `bg-gradient-to-br ${gradient} blur-3xl`)}></div>

      <div className="relative z-10 space-y-6">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center",
                           `bg-gradient-to-br ${gradient} shadow-lg`)}>
          {icon}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400">{description}</p>
        </div>

        <ul className="space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-1 h-1 rounded-full bg-current"></div>
              {f}
            </li>
          ))}
        </ul>

        <div className="flex items-center text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
          Enter mode <ArrowRight className="w-4 h-4 ml-2" />
        </div>
      </div>
    </button>
  )
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 hover:text-gray-300 transition-colors">
      {icon}
      <span>{label}</span>
    </div>
  )
}

// Dev Mode Landing
function DevModeLanding({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return <ModeLandingTemplate
    mode="dev"
    icon={<Code2 className="w-10 h-10" />}
    title="Developer Mode"
    subtitle="Stop reading. Start building."
    gradient="from-cyan-500 to-blue-600"
    features={[
      { icon: <Link2 />, title: "Paste any doc URL", desc: "AI extracts structure, APIs, examples" },
      { icon: <FileText />, title: "Drop PDF docs", desc: "Get code snippets, architecture, gotchas" },
      { icon: <ImageIcon />, title: "Upload diagrams", desc: "Flowcharts → explanations → code" }
    ]}
    cta="Start Exploring Docs"
    onStart={onStart}
    onBack={onBack}
  />
}

// User Mode Landing
function UserModeLanding({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return <ModeLandingTemplate
    mode="user"
    icon={<GraduationCap className="w-10 h-10" />}
    title="Learning Mode"
    subtitle="Study smarter, not harder."
    gradient="from-purple-500 to-pink-600"
    features={[
      { icon: <FileText />, title: "Upload notes & PDFs", desc: "Instant summaries + key concepts" },
      { icon: <Sparkles />, title: "Auto-quizzes & flashcards", desc: "Active recall built-in" },
      { icon: <GraduationCap />, title: "Ask anything", desc: "Step-by-step explanations" }
    ]}
    cta="Start Learning"
    onStart={onStart}
    onBack={onBack}
  />
}

function ModeLandingTemplate({
  icon,
  title,
  subtitle,
  gradient,
  features,
  cta,
  onStart,
  onBack
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  gradient: string
  features: { icon: React.ReactNode; title: string; desc: string }[]
  cta: string
  onStart: () => void
  onBack: () => void
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-10 text-gray-400 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <div className="max-w-4xl mx-auto space-y-16">
          <header className="text-center space-y-6">
            <div className={cn("w-20 h-20 rounded-3xl mx-auto flex items-center justify-center",
                               `bg-gradient-to-br ${gradient} shadow-xl`)}>
              {icon}
            </div>
            <h1 className="text-5xl md:text-6xl font-black">{title}</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
          </header>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md
                           hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                                   `bg-gradient-to-br ${gradient} text-white`)}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <Button
              size="lg"
              onClick={onStart}
              className={cn(
                "h-16 px-10 text-lg font-semibold shadow-2xl",
                `bg-gradient-to-r ${gradient} hover:scale-105 transition-all`,
                "border border-white/20"
              )}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {cta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}