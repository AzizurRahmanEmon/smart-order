export type MockCartLine = {
  id: string
  title: string
  summary: string
  quantity: number
  reservationCountdown: string
}

export const MOCK_CART_LINES: MockCartLine[] = [
  {
    id: 'mock-1',
    title: 'Breakfast combo',
    summary: 'Sample configuration (placeholder)',
    quantity: 2,
    reservationCountdown: '5:00',
  },
  {
    id: 'mock-2',
    title: 'Second item',
    summary: 'Another reserved line (placeholder)',
    quantity: 1,
    reservationCountdown: '5:00',
  },
]