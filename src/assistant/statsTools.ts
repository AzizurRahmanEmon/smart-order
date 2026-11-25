import type { FunctionDeclaration } from '@google/genai'

import {
  averageOrderValue,
  bestCustomerInsight,
  couponUsage,
  orderCount,
  revenueByDay,
  revenueByPaymentMethod,
  topOptions,
  totalRevenue,
  type StatsDateRange,
  type StatsOrder,
} from '@/engine/stats'

export const STATS_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'order_count',
    description:
      'Count how many orders were placed, optionally filtered to a Dhaka calendar date or from/to range (YYYY-MM-DD).',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date YYYY-MM-DD (Asia/Dhaka), inclusive' },
        to: { type: 'string', description: 'End date YYYY-MM-DD (Asia/Dhaka), inclusive' },
        date: { type: 'string', description: 'Single day YYYY-MM-DD (Asia/Dhaka)' },
      },
    },
  },
  {
    name: 'total_revenue',
    description:
      'Sum payable totals in poisha (integer; divide by 100 for BDT) for all matching orders.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        date: { type: 'string' },
      },
    },
  },
  {
    name: 'average_order_value',
    description: 'Mean payable per order in poisha for the optional date filter.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        date: { type: 'string' },
      },
    },
  },
  {
    name: 'top_selling_options',
    description:
      'Best-selling menu options by units (line qty × option qty). Returns option ids and unit counts.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'How many options to return (default 5)' },
      },
    },
  },
  {
    name: 'revenue_by_payment_method',
    description: 'Revenue in poisha grouped by card, bkash, or cash.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        date: { type: 'string' },
      },
    },
  },
  {
    name: 'coupon_usage',
    description:
      'How many orders entered MORNING15 vs how many actually received the coupon discount.',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
  {
    name: 'revenue_by_day',
    description: 'Order count and revenue for one calendar day in Asia/Dhaka.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD, required' },
      },
      required: ['date'],
    },
  },
  {
    name: 'best_customer_check',
    description:
      'Use when the user asks about customers, best customer, or loyalty. Returns whether the data supports an answer.',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
]

function parseRange(args: Record<string, unknown>): StatsDateRange | undefined {
  const range: StatsDateRange = {}
  if (typeof args.date === 'string') range.date = args.date
  if (typeof args.from === 'string') range.from = args.from
  if (typeof args.to === 'string') range.to = args.to
  if (!range.date && !range.from && !range.to) return undefined
  return range
}

export function runStatsTool(
  name: string,
  args: Record<string, unknown>,
  orders: StatsOrder[],
): unknown {
  const range = parseRange(args)

  switch (name) {
    case 'order_count':
      return { count: orderCount(orders, range), currencyNote: 'count only' }
    case 'total_revenue':
      return {
        revenuePoisha: totalRevenue(orders, range),
        note: 'Display as BDT with 2 decimals (poisha / 100)',
      }
    case 'average_order_value':
      return {
        averagePoisha: averageOrderValue(orders, range),
        note: 'Display as BDT with 2 decimals',
      }
    case 'top_selling_options': {
      const limit =
        typeof args.limit === 'number' ? Math.floor(args.limit) : 5
      return { options: topOptions(orders, limit) }
    }
    case 'revenue_by_payment_method':
      return { byMethod: revenueByPaymentMethod(orders, range) }
    case 'coupon_usage':
      return couponUsage(orders)
    case 'revenue_by_day': {
      const date = typeof args.date === 'string' ? args.date : ''
      if (!date) return { error: 'date is required (YYYY-MM-DD)' }
      return revenueByDay(orders, date)
    }
    case 'best_customer_check':
      return bestCustomerInsight()
    default:
      return { error: `Unknown tool: ${name}` }
  }
}