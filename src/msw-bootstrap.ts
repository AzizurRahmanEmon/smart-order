import { createQueryClient } from '@/lib/queryClient'

const mswEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === 'true'

/** Start MSW in parallel with the app bundle (dev / demo builds). */
if (mswEnabled) {
  void import('./mocks/browser').then(async ({ worker }) => {
    await worker.start({ quiet: true })
    window.dispatchEvent(new Event('msw:ready'))
    // If React already mounted, refresh data.
    const qc = (window as unknown as { __SO_QUERY__?: ReturnType<typeof createQueryClient> })
      .__SO_QUERY__
    if (qc) {
      await qc.invalidateQueries()
    }
  })
}