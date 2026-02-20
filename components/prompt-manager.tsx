'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Prompt } from '@/lib/types'
import { AppHeader } from '@/components/app-header'
import { SearchBar } from '@/components/search-bar'
import { PromptCard } from '@/components/prompt-card'
import { PromptDialog } from '@/components/prompt-dialog'
import { DeleteDialog } from '@/components/delete-dialog'
import { FileText } from 'lucide-react'

interface PromptManagerProps {
  initialPrompts: Prompt[]
  userEmail: string
  displayName: string
  userId: string
}

export function PromptManager({
  initialPrompts,
  userEmail,
  displayName,
  userId,
}: PromptManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('prompts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prompts' },
        (payload) => {
          setPrompts((prev) => {
            if (prev.some((p) => p.id === payload.new.id)) return prev
            return [payload.new as Prompt, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prompts' },
        (payload) => {
          setPrompts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Prompt) : p))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'prompts' },
        (payload) => {
          setPrompts((prev) => prev.filter((p) => p.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredPrompts = useMemo(() => {
    let results = prompts
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    }
    if (selectedCategory) {
      results = results.filter((p) => p.category === selectedCategory)
    }
    return results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [prompts, searchQuery, selectedCategory])

  const handleSave = useCallback(
    async (data: { title: string; description: string; content: string; category: string }) => {
      const supabase = createClient()
      setIsSaving(true)

      try {
        if (editingPrompt) {
          const { error } = await supabase
            .from('prompts')
            .update({
              title: data.title,
              description: data.description,
              content: data.content,
              category: data.category,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingPrompt.id)

          if (error) throw error

          // Optimistic update for this user
          setPrompts((prev) =>
            prev.map((p) =>
              p.id === editingPrompt.id
                ? { ...p, ...data, updated_at: new Date().toISOString() }
                : p
            )
          )
        } else {
          const { data: newPrompt, error } = await supabase
            .from('prompts')
            .insert({
              title: data.title,
              description: data.description,
              content: data.content,
              category: data.category,
              created_by: displayName,
              user_id: userId,
            })
            .select()
            .single()

          if (error) throw error

          // Optimistic update
          if (newPrompt) {
            setPrompts((prev) => {
              if (prev.some((p) => p.id === newPrompt.id)) return prev
              return [newPrompt, ...prev]
            })
          }
        }

        setDialogOpen(false)
        setEditingPrompt(null)
      } catch (err) {
        console.error('Failed to save prompt:', err)
      } finally {
        setIsSaving(false)
      }
    },
    [editingPrompt, displayName, userId]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    const supabase = createClient()
    setIsDeleting(true)

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', deleteId)
      if (error) throw error

      // Optimistic removal
      setPrompts((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      console.error('Failed to delete prompt:', err)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteId])

  const handleEdit = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt)
    setDialogOpen(true)
  }, [])

  const handleNewPrompt = useCallback(() => {
    setEditingPrompt(null)
    setDialogOpen(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        userEmail={userEmail}
        prompts={prompts}
        onNewPrompt={handleNewPrompt}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          totalCount={prompts.length}
          filteredCount={filteredPrompts.length}
        />

        {filteredPrompts.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {prompts.length === 0 ? 'No prompts yet' : 'No matching prompts'}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {prompts.length === 0
                ? 'Create your first prompt and it will appear here for your whole team.'
                : 'Try adjusting your search or category filter.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={handleEdit}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </main>

      <PromptDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingPrompt(null)
        }}
        prompt={editingPrompt}
        onSave={handleSave}
        isLoading={isSaving}
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
