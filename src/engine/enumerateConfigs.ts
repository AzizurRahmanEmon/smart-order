import type { Config, Menu } from '@/types/menu'

export function emptyConfig(menu: Menu): Config {
  const config: Config = {}
  for (const group of menu.groups) {
    for (const option of group.options) {
      config[option.id] = 0
    }
  }
  return config
}

/** Enumerate every configuration allowed by group min/max, maxPerOption, and maxDistinct. */
export function* enumerateRawConfigs(menu: Menu): Generator<Config> {
  const bread = menu.groups.find((g) => g.id === 'bread')!
  const extras = menu.groups.find((g) => g.id === 'extras')!
  const sauce = menu.groups.find((g) => g.id === 'sauce')!

  for (const breadOpt of bread.options) {
    for (const eggTotal of [2, 4, 6] as const) {
      for (let fried = 0; fried <= eggTotal; fried++) {
        for (let scrambled = 0; scrambled <= eggTotal - fried; scrambled++) {
          const omelette = eggTotal - fried - scrambled
          if (omelette < 0) continue

          for (let sausage = 0; sausage <= 3; sausage++) {
            for (let bacon = 0; bacon <= 3; bacon++) {
              for (let tofu = 0; tofu <= 3; tofu++) {
                const proteinSum = sausage + bacon + tofu
                if (proteinSum < 1 || proteinSum > 3) continue

                const extraIds = extras.options.map((o) => o.id)
                for (let extraMask = 0; extraMask < 1 << extraIds.length; extraMask++) {
                  let extraCount = 0
                  const extraCfg: Partial<Config> = {}
                  for (let i = 0; i < extraIds.length; i++) {
                    const on = (extraMask >> i) & 1
                    if (on) extraCount++
                    extraCfg[extraIds[i]!] = on
                  }
                  if (extraCount > (extras.max ?? 99)) continue

                  const sauceIds = sauce.options.map((o) => o.id)
                  for (let sauceMask = 0; sauceMask < 1 << sauceIds.length; sauceMask++) {
                    let distinct = 0
                    const sauceCfg: Partial<Config> = {}
                    for (let i = 0; i < sauceIds.length; i++) {
                      const on = (sauceMask >> i) & 1
                      if (on) distinct++
                      sauceCfg[sauceIds[i]!] = on
                    }
                    if (distinct > (sauce.maxDistinct ?? 99)) continue

                    const config = emptyConfig(menu)
                    config[breadOpt.id] = 1
                    config.fried = fried
                    config.scrambled = scrambled
                    config.omelette = omelette
                    config.sausage = sausage
                    config.bacon = bacon
                    config.tofu = tofu
                    for (const id of extraIds) {
                      config[id] = extraCfg[id] ?? 0
                    }
                    for (const id of sauceIds) {
                      config[id] = sauceCfg[id] ?? 0
                    }
                    yield config
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}