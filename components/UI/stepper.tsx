import React from 'react'
import { cn } from '@/lib/utils'

interface StepperProps {
  currentStep: numbersteps: string[]
  className?: string
}

export function Stepper({ currentStep, steps, className }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <divclassName={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              index <= currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <divclassName={cn(
                'h-0.5 w-12 mx-2',
                index < currentStep ? 'bg-primary' : 'bg-muted',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

interface StepProps {
  title: stringdescription?: stringchildren: React.ReactNode
}

export function Step({ title, description, children }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}
