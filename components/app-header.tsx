'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon, LogOut, Download, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Prompt } from '@/lib/types'

interface AppHeaderProps {
  userEmail: string
  prompts: Prompt[]
  onNewPrompt: () => void
}

export function AppHeader({ userEmail, prompts, onNewPrompt }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleExport = () => {
    const data = JSON.stringify(prompts, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompts-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
            PromptVault
          </h1>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userEmail}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onNewPrompt} size="sm" className="gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Prompt</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleExport}
            aria-label="Export prompts as JSON"
          >
            <Download className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
