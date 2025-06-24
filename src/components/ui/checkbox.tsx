// src/components/ui/checkbox.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  HTMLInputElement,
  {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'>
>(({ className, id, checked, onCheckedChange, ...props }, ref) => {
  // Use a generated ID if none is provided for the label's htmlFor
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  return (
    <div className={cn("inline-flex items-center", className)}>
      <label
        className="relative flex cursor-pointer items-center rounded-full p-3"
        htmlFor={checkboxId}
        data-ripple-dark="true"
      >
        <input
          ref={ref}
          type="checkbox"
          className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-input transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-muted-foreground/50 before:opacity-0 before:transition-opacity checked:border-primary checked:bg-primary checked:before:bg-primary hover:before:opacity-10"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
      </label>
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
