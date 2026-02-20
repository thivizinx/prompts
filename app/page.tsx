import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PromptManager } from '@/components/prompt-manager'

export default async function Page() {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    redirect('/auth/login')
  }

  const { data: prompts } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false })

  const user = userData.user
  const displayName =
    user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous'

  return (
    <PromptManager
      initialPrompts={prompts || []}
      userEmail={user.email || ''}
      displayName={displayName}
      userId={user.id}
    />
  )
}
