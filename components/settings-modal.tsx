'use client'

import { X, Moon, Sun, Monitor, Volume2, LayoutGrid } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  settings: {
    theme: 'light' | 'dark' | 'auto'
    ttsVoice: string
    density: 'compact' | 'comfortable' | 'spacious'
  }
  onUpdateSettings: (settings: any) => void
}

export default function SettingsModal({ open, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const exportChat = () => {
    const devData = localStorage.getItem('doc-explainer-dev-conversations') || '[]'
    const userData = localStorage.getItem('doc-explainer-user-conversations') || '[]'
    const combined = {
      dev: JSON.parse(devData),
      user: JSON.parse(userData),
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `readrover-chat-history-${Date.now()}.json`
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800" aria-describedby="settings-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
          <DialogDescription id="settings-description" className="text-slate-400 text-sm">
            Customize your ReadRover experience with themes, voices, and display preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Theme</Label>
            <RadioGroup
              value={settings.theme}
              onValueChange={(value: any) => onUpdateSettings({ ...settings, theme: value })}
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-800/50 peer-data-[state=checked]:border-blue-500 cursor-pointer transition-all"
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs font-medium">Light</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-800/50 peer-data-[state=checked]:border-blue-500 cursor-pointer transition-all"
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs font-medium">Dark</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="auto" id="auto" className="peer sr-only" />
                <Label
                  htmlFor="auto"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-800/50 peer-data-[state=checked]:border-blue-500 cursor-pointer transition-all"
                >
                  <Monitor className="w-5 h-5" />
                  <span className="text-xs font-medium">Auto</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* TTS Voice */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Text-to-Speech Voice
            </Label>
            <Select
              value={settings.ttsVoice}
              onValueChange={(value) => onUpdateSettings({ ...settings, ttsVoice: value })}
            >
              <SelectTrigger className="bg-slate-900/50 border-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="x_Catherine">Catherine (Female, English)</SelectItem>
                <SelectItem value="x_John">John (Male, English)</SelectItem>
                <SelectItem value="x_Steve">Steve (Male, English)</SelectItem>
                <SelectItem value="x_xiaoyan">Xiaoyan (Female, Chinese)</SelectItem>
                <SelectItem value="x_xiaofeng">Xiaofeng (Female, Chinese)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Density */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Message Density
            </Label>
            <RadioGroup
              value={settings.density}
              onValueChange={(value: any) => onUpdateSettings({ ...settings, density: value })}
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="compact" id="compact" className="peer sr-only" />
                <Label
                  htmlFor="compact"
                  className="flex items-center justify-center rounded-lg border-2 border-slate-800 bg-slate-900/50 p-3 hover:bg-slate-800/50 peer-data-[state=checked]:border-purple-500 cursor-pointer transition-all"
                >
                  <span className="text-xs font-medium">Compact</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="comfortable" id="comfortable" className="peer sr-only" />
                <Label
                  htmlFor="comfortable"
                  className="flex items-center justify-center rounded-lg border-2 border-slate-800 bg-slate-900/50 p-3 hover:bg-slate-800/50 peer-data-[state=checked]:border-purple-500 cursor-pointer transition-all"
                >
                  <span className="text-xs font-medium">Comfortable</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="spacious" id="spacious" className="peer sr-only" />
                <Label
                  htmlFor="spacious"
                  className="flex items-center justify-center rounded-lg border-2 border-slate-800 bg-slate-900/50 p-3 hover:bg-slate-800/50 peer-data-[state=checked]:border-purple-500 cursor-pointer transition-all"
                >
                  <span className="text-xs font-medium">Spacious</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export */}
          <div className="pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              className="w-full"
              onClick={exportChat}
            >
              Export Chat History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
