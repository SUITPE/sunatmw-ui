import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAutocompleteOptions<T> {
  searchFn: (query: string) => Promise<T[]>
  minChars?: number
  debounceMs?: number
  maxResults?: number
}

interface UseAutocompleteReturn<T> {
  query: string
  setQuery: (value: string) => void
  results: T[]
  isOpen: boolean
  isLoading: boolean
  activeIndex: number
  handleKeyDown: (e: React.KeyboardEvent) => void
  selectItem: (item: T) => void
  close: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: React.MutableRefObject<((item: T) => void) | null>
}

export function useAutocomplete<T>({
  searchFn,
  minChars = 2,
  debounceMs = 300,
  maxResults = 5,
}: UseAutocompleteOptions<T>): UseAutocompleteReturn<T> {
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSelect = useRef<((item: T) => void) | null>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value)
      setActiveIndex(-1)

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (value.length < minChars) {
        setResults([])
        setIsOpen(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const data = await searchFn(value)
          const sliced = data.slice(0, maxResults)
          setResults(sliced)
          setIsOpen(sliced.length > 0 || value.length >= minChars)
          setIsLoading(false)
        } catch {
          setResults([])
          setIsOpen(false)
          setIsLoading(false)
        }
      }, debounceMs)
    },
    [searchFn, minChars, debounceMs, maxResults],
  )

  const selectItem = useCallback(
    (item: T) => {
      if (onSelect.current) {
        onSelect.current(item)
      }
      setQueryState('')
      setResults([])
      close()
    },
    [close],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < results.length) {
          const item = results[activeIndex]
          if (item !== undefined) {
            selectItem(item)
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    },
    [isOpen, activeIndex, results, selectItem, close],
  )

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [close])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    query,
    setQuery,
    results,
    isOpen,
    isLoading,
    activeIndex,
    handleKeyDown,
    selectItem,
    close,
    containerRef,
    onSelect,
  }
}
