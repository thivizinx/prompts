export interface Prompt {
  id: string
  title: string
  description: string
  content: string
  category: string
  created_by: string
  user_id: string | null
  created_at: string
  updated_at: string
}

export const CATEGORIES = [
  'General',
  'Writing',
  'Coding',
  'Marketing',
  'Analysis',
  'Creative',
  'Business',
  'Education',
] as const

export type Category = (typeof CATEGORIES)[number]
