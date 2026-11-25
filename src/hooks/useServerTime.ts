import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchServerTime } from '@/api/time'

export function useServerTimeOffset() {
  const { data } = useQuery({
    queryKey: ['serverTime'],
    queryFn: ({ signal }) => fetchServerTime(signal),
    refetchInterval: 30_000,
  })

  const [offsetMs, setOffsetMs] = useState(90_000)

  useEffect(() => {
    if (!data?.serverTime) return
    const serverMs = new Date(data.serverTime).getTime()
    setOffsetMs(serverMs - Date.now())
  }, [data?.serverTime])

  function serverNow(): Date {
    return new Date(Date.now() + offsetMs)
  }

  return { serverNow, serverTimeIso: data?.serverTime, offsetMs }
}