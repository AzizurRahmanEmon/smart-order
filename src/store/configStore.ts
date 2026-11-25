import { create } from 'zustand'

import type { Config, Menu, OptionId } from '@/types/menu'

export const EXPIRED_RESERVATION_BANNER =
  'Your reservation for this item expired. Your choices are kept — add it as a new item.'

type ConfigState = {
  config: Config
  couponCode: string
  editingLineId: string | null
  expiredEditBanner: boolean
  setQuantity: (optionId: OptionId, next: number) => void
  setCouponCode: (code: string) => void
  setEditingLineId: (lineId: string | null) => void
  setExpiredEditBanner: (show: boolean) => void
  loadLineConfig: (config: Config) => void
  resetBuilderConfig: () => void
  initFromMenu: (menu: Menu) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: {},
  couponCode: '',
  editingLineId: null,
  expiredEditBanner: false,
  setQuantity: (optionId, next) =>
    set((state) => ({
      config: {
        ...state.config,
        [optionId]: Math.max(0, next),
      },
    })),
  setCouponCode: (couponCode) => set({ couponCode }),
  setEditingLineId: (editingLineId) => set({ editingLineId }),
  setExpiredEditBanner: (expiredEditBanner) => set({ expiredEditBanner }),
  loadLineConfig: (config) => set({ config }),
  resetBuilderConfig: () =>
    set({ config: {}, editingLineId: null, expiredEditBanner: false }),
  initFromMenu: (menu) => {
    const config: Config = {}
    for (const group of menu.groups) {
      for (const option of group.options) {
        config[option.id] = 0
      }
    }
    set({ config })
  },
}))