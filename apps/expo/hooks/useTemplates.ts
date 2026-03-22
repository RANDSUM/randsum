import { useCallback, useEffect, useRef, useState } from 'react'

import { storage } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { syncToCloud } from '../lib/sync'
import type { RollTemplate } from '../lib/types'

import { useAuth } from './useAuth'

interface UseTemplatesReturn {
  readonly templates: readonly RollTemplate[]
  readonly isLoading: boolean
  readonly isError: boolean
  readonly saveTemplate: (template: RollTemplate) => Promise<void>
  readonly updateTemplate: (template: RollTemplate) => Promise<void>
  readonly deleteTemplate: (id: string) => Promise<void>
}

function useSyncAfterWrite(): () => void {
  const { user } = useAuth()
  const userRef = useRef(user)
  userRef.current = user

  return useCallback(() => {
    const currentUser = userRef.current
    if (currentUser) {
      void syncToCloud(currentUser.id, storage, supabase)
    }
  }, [])
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<readonly RollTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const syncAfterWrite = useSyncAfterWrite()

  useEffect(() => {
    const controller = { cancelled: false }

    storage
      .getTemplates()
      .then(loaded => {
        if (!controller.cancelled) {
          const sorted = [...loaded].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          setTemplates(sorted)
        }
      })
      .catch(() => {
        if (!controller.cancelled) {
          setIsError(true)
        }
      })
      .finally(() => {
        if (!controller.cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.cancelled = true
    }
  }, [])

  const saveTemplate = useCallback(
    async (template: RollTemplate): Promise<void> => {
      const now = new Date().toISOString()
      const withTimestamps: RollTemplate = {
        ...template,
        createdAt: template.createdAt || now,
        updatedAt: template.updatedAt || now
      }
      setTemplates(prev => [withTimestamps, ...prev])
      try {
        await storage.saveTemplate(withTimestamps)
        syncAfterWrite()
      } catch {
        setTemplates(prev => prev.filter(t => t.id !== template.id))
      }
    },
    [syncAfterWrite]
  )

  const updateTemplate = useCallback(
    async (template: RollTemplate): Promise<void> => {
      setTemplates(prev => prev.map(t => (t.id === template.id ? template : t)))
      try {
        await storage.updateTemplate(template)
        syncAfterWrite()
      } catch {
        // Reload from storage on failure
        const loaded = await storage.getTemplates()
        setTemplates(loaded)
      }
    },
    [syncAfterWrite]
  )

  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      setTemplates(prev => prev.filter(t => t.id !== id))
      try {
        await storage.deleteTemplate(id)
        syncAfterWrite()
      } catch {
        // Best-effort — item already removed from local state
      }
    },
    [syncAfterWrite]
  )

  return { templates, isLoading, isError, saveTemplate, updateTemplate, deleteTemplate }
}
