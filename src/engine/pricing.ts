import type { Config, GroupId, Menu, Poisha, Promotion } from '@/types/menu'

export type CartLineInput = { config: Config; qty: number }

export type LinePrice = {
  unit: Poisha
  extrasDiscount: Poisha
  comboDiscount: Poisha
  lineTotal: Poisha
}

export type CouponRejection = 'invalid' | 'expired'

export type PriceCartResult = {
  lines: LinePrice[]
  subtotal: Poisha
  cartFixed: Poisha
  coupon: Poisha
  cartDiscount: Poisha
  chosen: 'cartFixed' | 'coupon' | null
  vat: Poisha
  payable: Poisha
  payableBDT: number
  couponRejection: CouponRejection | null
}

export type PriceCartOptions = {
  coupon?: string
  now: Date
}

export function halfUpPoisha(value: number): Poisha {
  if (value >= 0) {
    return Math.floor(value + 0.5)
  }
  return -Math.floor(-value + 0.5)
}

export function roundPayableWholeBdt(totalPoisha: Poisha): Poisha {
  return halfUpPoisha(totalPoisha / 100) * 100
}

function optionPriceById(menu: Menu): Map<string, Poisha> {
  const map = new Map<string, Poisha>()
  for (const group of menu.groups) {
    for (const option of group.options) {
      map.set(option.id, option.price)
    }
  }
  return map
}

function groupTotal(menu: Menu, groupId: GroupId, config: Config): number {
  const group = menu.groups.find((g) => g.id === groupId)
  if (!group) return 0
  let total = 0
  for (const option of group.options) {
    total += Math.max(0, config[option.id] ?? 0)
  }
  return total
}

function step1BasePlusOptions(menu: Menu, config: Config): Poisha {
  let sum = menu.product.basePrice
  const prices = optionPriceById(menu)
  for (const group of menu.groups) {
    for (const option of group.options) {
      const count = Math.max(0, config[option.id] ?? 0)
      if (count > 0) {
        sum += (prices.get(option.id) ?? 0) * count
      }
    }
  }
  return sum
}

function applyExtrasDeals(
  menu: Menu,
  config: Config,
  prePromoAmount: Poisha,
): { amount: Poisha; extrasDiscount: Poisha } {
  let discount = 0
  const prices = optionPriceById(menu)

  for (const promo of menu.promotions) {
    if (promo.type !== 'extrasDeal') continue
    const group = menu.groups.find((g) => g.id === promo.group)
    if (!group) continue

    const unitPrices: Poisha[] = []
    for (const option of group.options) {
      const count = Math.max(0, config[option.id] ?? 0)
      const price = prices.get(option.id) ?? 0
      for (let i = 0; i < count; i++) {
        unitPrices.push(price)
      }
    }

    const freeCount = Math.floor(unitPrices.length / promo.every)
    if (freeCount <= 0) continue

    unitPrices.sort((a, b) => a - b)
    const freeTotal = unitPrices
      .slice(0, freeCount)
      .reduce((a, b) => a + b, 0)
    discount += freeTotal
  }

  return { amount: prePromoAmount - discount, extrasDiscount: discount }
}

function applyComboDeals(
  menu: Menu,
  config: Config,
  amountAfterExtras: Poisha,
): { amount: Poisha; comboDiscount: Poisha } {
  let discount = 0

  for (const promo of menu.promotions) {
    if (promo.type !== 'combo') continue
    const applies = promo.conditions.every(
      (c) => groupTotal(menu, c.group, config) >= c.min,
    )
    if (!applies) continue
    const off = halfUpPoisha((amountAfterExtras * promo.percent) / 100)
    discount += off
  }

  return { amount: amountAfterExtras - discount, comboDiscount: discount }
}

export function priceLine(menu: Menu, config: Config): LinePrice {
  const step1 = step1BasePlusOptions(menu, config)
  const afterExtras = applyExtrasDeals(menu, config, step1)
  const afterCombo = applyComboDeals(menu, config, afterExtras.amount)

  return {
    unit: afterCombo.amount,
    extrasDiscount: afterExtras.extrasDiscount,
    comboDiscount: afterCombo.comboDiscount,
    lineTotal: afterCombo.amount,
  }
}

function findCouponPromo(menu: Menu): Extract<Promotion, { type: 'coupon' }> | undefined {
  return menu.promotions.find(
    (p): p is Extract<Promotion, { type: 'coupon' }> => p.type === 'coupon',
  )
}

function findCartFixedPromo(
  menu: Menu,
): Extract<Promotion, { type: 'cartFixed' }> | undefined {
  return menu.promotions.find(
    (p): p is Extract<Promotion, { type: 'cartFixed' }> => p.type === 'cartFixed',
  )
}

/** Strictly before validBefore (HH:mm) on the given calendar day in timeZone. */
export function isCouponTimeValid(
  now: Date,
  validBefore: string,
  timeZone: string,
): boolean {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  const second = Number(parts.find((p) => p.type === 'second')?.value ?? 0)
  const nowSeconds = hour * 3600 + minute * 60 + second

  const [bh, bm] = validBefore.split(':').map(Number)
  const beforeSeconds = (bh ?? 0) * 3600 + (bm ?? 0) * 60

  return nowSeconds < beforeSeconds
}

function cartCouponDiscount(
  menu: Menu,
  subtotal: Poisha,
  couponCode: string | undefined,
  now: Date,
): {
  cartFixed: Poisha
  coupon: Poisha
  chosen: 'cartFixed' | 'coupon' | null
  cartDiscount: Poisha
  couponRejection: CouponRejection | null
} {
  const fixedPromo = findCartFixedPromo(menu)
  const couponPromo = findCouponPromo(menu)

  const cartFixed =
    fixedPromo && subtotal >= fixedPromo.minSubtotal ? fixedPromo.amount : 0

  let coupon = 0
  let couponRejection: CouponRejection | null = null
  const trimmed = couponCode?.trim()

  if (trimmed) {
    if (!couponPromo) {
      couponRejection = 'invalid'
    } else if (trimmed.toLowerCase() !== couponPromo.code.toLowerCase()) {
      couponRejection = 'invalid'
    } else if (!isCouponTimeValid(now, couponPromo.validBefore, couponPromo.timeZone)) {
      couponRejection = 'expired'
    } else {
      const raw = (subtotal * couponPromo.percent) / 100
      coupon = Math.min(halfUpPoisha(raw), couponPromo.cap)
    }
  }

  let chosen: 'cartFixed' | 'coupon' | null = null
  let cartDiscount = 0

  if (cartFixed > 0 || coupon > 0) {
    if (coupon > cartFixed) {
      chosen = 'coupon'
      cartDiscount = coupon
    } else if (cartFixed > coupon) {
      chosen = 'cartFixed'
      cartDiscount = cartFixed
    } else if (cartFixed > 0) {
      chosen = 'cartFixed'
      cartDiscount = cartFixed
    }
  }

  return { cartFixed, coupon, chosen, cartDiscount, couponRejection }
}

export function priceCart(
  menu: Menu,
  lines: CartLineInput[],
  options: PriceCartOptions,
): PriceCartResult {
  const pricedLines: LinePrice[] = lines.map((line) => {
    const unitPrice = priceLine(menu, line.config)
    return {
      ...unitPrice,
      lineTotal: unitPrice.unit * line.qty,
    }
  })

  const subtotal = pricedLines.reduce((sum, l) => sum + l.lineTotal, 0)

  const cartPromos = cartCouponDiscount(
    menu,
    subtotal,
    options.coupon,
    options.now,
  )

  const afterDiscount = subtotal - cartPromos.cartDiscount
  const vat = halfUpPoisha((afterDiscount * menu.vatPercent) / 100)
  const preRoundPayable = afterDiscount + vat
  const payable = roundPayableWholeBdt(preRoundPayable)

  return {
    lines: pricedLines,
    subtotal,
    cartFixed: cartPromos.cartFixed,
    coupon: cartPromos.coupon,
    cartDiscount: cartPromos.cartDiscount,
    chosen: cartPromos.chosen,
    vat,
    payable,
    payableBDT: payable / 100,
    couponRejection: cartPromos.couponRejection,
  }
}