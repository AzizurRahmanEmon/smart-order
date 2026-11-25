import { useEffect } from 'react'

import { useCart } from '@/hooks/useCart'
import { useCartSync } from '@/hooks/useCartSync'
import { useMenu } from '@/hooks/useMenu'
import {
  reconcileEditingAfterCartLoad,
  sanitizeConfigForMenu,
} from '@/lib/builderSession'
import { useConfigStore } from '@/store/configStore'

/** Menu/cart-aware session restore + cross-tab cart sync (Part G). */
export function BuilderSessionSync() {
  useCartSync()
  const { data: menu } = useMenu()
  const { data: cart } = useCart()
  const editingLineId = useConfigStore((s) => s.editingLineId)
  const setEditingLineId = useConfigStore((s) => s.setEditingLineId)
  const setExpiredEditBanner = useConfigStore((s) => s.setExpiredEditBanner)

  useEffect(() => {
    if (!menu) return
    const { config } = useConfigStore.getState()
    const sanitized = sanitizeConfigForMenu(menu, config)
    const changed = Object.keys(sanitized).some(
      (k) => sanitized[k] !== config[k],
    )
    const removed = Object.keys(config).some((k) => !(k in sanitized))
    if (changed || removed) {
      useConfigStore.setState({ config: sanitized })
    }
  }, [menu])

  useEffect(() => {
    const { editingLineId: nextId, showExpiredBanner } =
      reconcileEditingAfterCartLoad(editingLineId, cart)
    if (nextId !== editingLineId) setEditingLineId(nextId)
    if (showExpiredBanner) setExpiredEditBanner(true)
  }, [cart, editingLineId, setEditingLineId, setExpiredEditBanner])

  return null
}