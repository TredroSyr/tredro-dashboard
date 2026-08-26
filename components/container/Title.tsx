'use client'

import * as React from 'react'
import type { TitleProps } from './types'
import { SlotComponent } from './SlotComponent'

/**
 * Title - Page title component
 * Renders as an h1 element with primary text styling
 */
export function Title({ children, className }: TitleProps) {
  return (
    <SlotComponent slotType="title" className={className}>
      <h1 className="text-primary text-xl font-semibold">{children}</h1>
    </SlotComponent>
  )
}
