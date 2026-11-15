import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const variants = cva('inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:pointer-events-none disabled:opacity-45', {
  variants: {
    variant: { primary: 'bg-gradient-to-r from-orange-400 to-amber-300 text-slate-950 shadow-[0_8px_26px_rgba(251,146,60,.24)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(251,146,60,.38)]', secondary: 'border border-white/15 bg-white/[.06] text-slate-100 hover:border-cyan-200/50 hover:bg-cyan-200/[.08]', ghost: 'text-slate-300 hover:bg-white/[.08] hover:text-white' },
    size: { sm: 'h-9 px-3 text-xs', md: 'h-11 px-5 text-sm', lg: 'h-13 px-7 text-base' },
  }, defaultVariants: { variant: 'primary', size: 'md' },
})

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> { asChild?: boolean }
export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(variants({ variant, size }), className)} {...props} />
}
