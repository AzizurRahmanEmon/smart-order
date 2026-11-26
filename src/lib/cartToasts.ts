import { toast } from 'sonner'

const cartSuccessOptions = {
  duration: 3_500,
  classNames: {
    toast:
      'border border-border/80 bg-card/95 text-foreground shadow-lg shadow-primary/10 backdrop-blur-md',
    title: 'font-semibold',
    description: 'text-muted-foreground text-sm',
  },
} as const

export function toastPlateAddedToCart() {
  toast.success('Added to your order', {
    ...cartSuccessOptions,
    description: 'Stock is reserved while you finish building.',
  })
}

export function toastCartLineUpdated() {
  toast.success('Changes saved', {
    ...cartSuccessOptions,
    description: 'This cart line was updated with your new options.',
  })
}