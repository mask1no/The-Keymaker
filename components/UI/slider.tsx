"use client";

import * as React from 'react';
import * as SliderPr from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export function Slider({ className, ...props }: React.ComponentPropsWithoutRef<typeof SliderPr.Root>) {
  return (
    <SliderPr.Root
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPr.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPr.Range className="absolute h-full bg-primary" />
      </SliderPr.Track>
      <SliderPr.Thumb className="block h-4 w-4 rounded-full border bg-background shadow" />
    </SliderPr.Root>
  );
}