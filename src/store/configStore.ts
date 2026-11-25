import { create } from 'zustand'

import type { Config, Menu, OptionId } from '@/types/menu'

type ConfigState = {
  config: Config
  setQuantity: (optionId: OptionId, next: number) => void
  initFromMenu: (menu: Menu) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: {},
  setQuantity: (optionId, next) =>
    set((state) => ({
      config: {
        ...state.config,
        [optionId]: Math.max(0, next),
      },
    })),
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