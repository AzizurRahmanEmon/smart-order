import { create } from 'zustand'

import type { Config, IngredientId, Menu, OptionId } from '@/types/menu'

type ConfigState = {
  config: Config
  reserved: Record<IngredientId, number>
  setQuantity: (optionId: OptionId, next: number) => void
  setReserved: (reserved: Record<IngredientId, number>) => void
  initFromMenu: (menu: Menu) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: {},
  reserved: {},
  setQuantity: (optionId, next) =>
    set((state) => ({
      config: {
        ...state.config,
        [optionId]: Math.max(0, next),
      },
    })),
  setReserved: (reserved) => set({ reserved }),
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