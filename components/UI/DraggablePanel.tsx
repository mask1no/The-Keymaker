import React, { ReactNode } from 'react';
import Draggable from 'react-draggable';

export default function DraggablePanel({ children }: { children: ReactNode }) {
  return (
    <Draggable>
      <div style={{ willChange: 'transform' }}>
        {children}
      </div>
    </Draggable>
  );
} 