'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { CATEGORIES } from '@/lib/types'

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  selectedCategory: string
  onCategoryChange: (cat: string) => void
  totalCount: number
  filteredCount: number
}

export function SearchBar({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  totalCount,
  filteredCount,
}: SearchBarProps) {
  const allCategories = ['All', ...CATEGORIES]

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search prompts by title..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat === 'All' ? '' : cat)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (cat === 'All' && !selectedCategory) || cat === selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        ))}
        {(query || selectedCategory) && (
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredCount} of {totalCount} prompts
          </span>
        )}
      </div>
    </div>
  )
}
