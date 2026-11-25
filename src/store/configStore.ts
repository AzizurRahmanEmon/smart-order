import { create } from 'zustand'

import type { Config, IngredientId, Menu, OptionId } from '@/types/menu'

type ConfigState = {
  config: Config
  reserved: Record<IngredientId, number>
  couponCode: string
  /** Server clock for pricing preview (Part C); replaced by MSW sync later. */
  pricingNow: Date
  setQuantity: (optionId: OptionId, next: number) => void
  setReserved: (reserved: Record<IngredientId, number>) => void
  setCouponCode: (code: string) => void
  setPricingNow: (now: Date) => void
  initFromMenu: (menu: Menu) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: {},
  reserved: {},
  couponCode: '',
  pricingNow: new Date('2025-06-01T04:59:59.000Z'),
  setQuantity: (optionId, next) =>
    set((state) => ({
      config: {
        ...state.config,
        [optionId]: Math.max(0, next),
      },
    })),
  setReserved: (reserved) => set({ reserved }),
  setCouponCode: (couponCode) => set({ couponCode }),
  setPricingNow: (pricingNow) => set({ pricingNow }),
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