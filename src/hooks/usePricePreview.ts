import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { fetchPrice } from '@/api/price'
import { hashConfig } from '@/lib/configHash'
import type { Config } from '@/types/menu'

import { useDebounce } from './useDebounce'

export function usePricePreview(config: Config, coupon: string, enabled: boolean) {
  const debouncedConfig = useDebounce(config, 300)
  const debouncedCoupon = useDebounce(coupon, 300)

  const hash = useMemo(
    () => hashConfig(debouncedConfig, debouncedCoupon),
    [debouncedConfig, debouncedCoupon],
  )

  return useQuery({
    queryKey: ['price', hash],
    queryFn: ({ signal }) =>
      fetchPrice(debouncedConfig, debouncedCoupon || undefined, 1, signal),
    enabled:
      enabled && Object.values(debouncedConfig).some((n) => (n ?? 0) > 0),
    placeholderData: (prev) => prev,
  })
}