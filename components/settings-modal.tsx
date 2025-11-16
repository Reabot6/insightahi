'use client'

import { X, Moon, Sun, Monitor, Volume2, LayoutGrid, Download, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  settings: {
    theme: 'light' | 'dark' | 'auto'
    ttsVoice: string
    density: 'compact' | 'comfortable' | 'spacious'
  }
  onUpdateSettings: (settings: any) => void
  mode?: 'dev' | 'user'
}

const VOICE_PREVIEWS = {
  'x_Catherine': 'Hello, I am Catherine. I can read your chat aloud in a clear, natural voice.',
  'x_John': 'Hi there! This is John speaking. Let me read your messages for you.',
  'x_Steve': 'Greetings. Steve here. I will narrate your conversation with a professional tone.',
  'x_xiaoyan': '你好，我是小燕。我可以用流利的中文为您朗读内容。',
  'x_xiaofeng': '您好！我是小峰。我会用亲切的声音为您朗读。',
}

export default function SettingsModal({ 
  open, 
  onClose, 
  settings, 
  onUpdateSettings,
  mode = 'dev'
}: SettingsModalProps) {
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

  const exportChat = () => {
    const devData = localStorage.getItem('insightai-dev-convos') || '[]'
    const userData = localStorage.getItem('insightai-user-convos') || '[]'
    const combined = {
      dev: JSON.parse(devData),
      user: JSON.parse(userData),
      exportedAt: new Date().toISOString(),
      app: 'InsightAI',
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `insightai-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const playVoicePreview = (voice: string) => {
    const text = VOICE_PREVIEWS[voice as keyof typeof VOICE_PREVIEWS] || 'Preview not available.'
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[560px] bg-white/5 backdrop-blur-2xl border border-white/10",
        "shadow-2xl shadow-black/50",
        "animate-in fade-in zoom-in-95 duration-300"
      )} aria-describedby="settings-description">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                `bg-gradient-to-br ${modeConfig.gradient} shadow-lg`,
                modeConfig.glow
              )}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-white">Settings</DialogTitle>
                <DialogDescription id="settings-description" className="text-gray-400 text-sm mt-1">
                  Customize your AI experience with themes, voices, and layout.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          {/* Theme */}
          <div className="space-y-4">
            <Label className="text-sm font-bold text-white flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Theme
            </Label>
            <RadioGroup
              value={settings.theme}
              onValueChange={(value: any) => onUpdateSettings({ ...settings, theme: value })}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { value: 'light', icon: Sun, label: 'Light', desc: 'Bright & clean' },
                { value: 'dark', icon: Moon, label: 'Dark', desc: 'Deep & immersive' },
                { value: 'auto', icon: Monitor, label: 'Auto', desc: 'Follow system' },
              ].map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-5 cursor-pointer transition-all",
                      "bg-white/5 backdrop-blur-xl hover:bg-white/10",
                      "border-white/10 hover:border-white/20",
                      "peer-data-[state=checked]:border-white/40 peer-data-[state=checked]:bg-white/10",
                      "peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-white/20",
                      "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    <option.icon className={cn(
                      "w-6 h-6 transition-all",
                      settings.theme === option.value && modeConfig.text
                    )} />
                    <div className="text-center">
                      <span className="text-sm font-bold text-white block">{option.label}</span>
                      <span className="text-xs text-gray-400">{option.desc}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* TTS Voice */}
          <div className="space-y-4">
            <Label className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Text-to-Speech Voice
            </Label>
            <div className="space-y-3">
              <Select
                value={settings.ttsVoice}
                onValueChange={(value) => onUpdateSettings({ ...settings, ttsVoice: value })}
              >
                <SelectTrigger className={cn(
                  "h-14 bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20",
                  "text-white placeholder:text-gray-500 focus:border-white/40 focus:ring-0"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/5 backdrop-blur-2xl border-white/10">
                  {[
                    { value: 'x_Catherine', label: 'Catherine (Female, English)', flag: 'GB' },
                    { value: 'x_John', label: 'John (Male, English)', flag: 'US' },
                    { value: 'x_Steve', label: 'Steve (Male, English)', flag: 'AU' },
                    { value: 'x_xiaoyan', label: 'Xiaoyan (Female, Chinese)', flag: 'CN' },
                    { value: 'x_xiaofeng', label: 'Xiaofeng (Female, Chinese)', flag: 'CN' },
                  ].map((voice) => (
                    <SelectItem key={voice.value} value={voice.value} className="text-white">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{voice.flag}</span>
                        <div>
                          <div className="font-medium">{voice.label.split(' (')[0]}</div>
                          <div className="text-xs text-gray-400">{voice.label.split(' (')[1].slice(0, -1)}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 rounded-xl border-white/20 hover:bg-white/10 transition-all hover:scale-[1.01]"
                onClick={() => playVoicePreview(settings.ttsVoice)}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Play Voice Preview
              </Button>
            </div>
          </div>

          {/* Message Density */}
          <div className="space-y-4">
            <Label className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Message Density
            </Label>
            <RadioGroup
              value={settings.density}
              onValueChange={(value: any) => onUpdateSettings({ ...settings, density: value })}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { value: 'compact', label: 'Compact', desc: 'More content' },
                { value: 'comfortable', label: 'Comfortable', desc: 'Balanced' },
                { value: 'spacious', label: 'Spacious', desc: 'Easy reading' },
              ].map((option) => (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 cursor-pointer transition-all",
                      "bg-white/5 backdrop-blur-xl hover:bg-white/10",
                      "border-white/10 hover:border-white/20",
                      "peer-data-[state=checked]:border-white/40 peer-data-[state=checked]:bg-white/10",
                      "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    <div className="space-y-1 w-full">
                      <div className={cn(
                        "h-2 rounded-full transition-all",
                        settings.density === option.value ? modeConfig.bg : "bg-gray-700"
                      )} style={{ width: option.value === 'compact' ? '100%' : option.value === 'comfortable' ? '75%' : '50%' }} />
                      <div className={cn(
                        "h-2 rounded-full transition-all",
                        settings.density === option.value ? modeConfig.bg : "bg-gray-700"
                      )} style={{ width: option.value === 'compact' ? '80%' : option.value === 'comfortable' ? '60%' : '40%' }} />
                    </div>
                    <span className="text-sm font-bold text-white">{option.label}</span>
                    <span className="text-xs text-gray-400">{option.desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Export */}
          <div className="pt-6 border-t border-white/10">
            <Button
              onClick={exportChat}
              className={cn(
                "w-full h-14 rounded-2xl font-bold text-sm shadow-lg",
                `bg-gradient-to-r ${modeConfig.gradient} hover:bg-gradient-to-r ${modeConfig.hoverGradient}`,
                "hover:scale-[1.02] active:scale-[0.98] transition-all"
              )}
            >
              <Download className="w-5 h-5 mr-3" />
              Export All Chat History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
