'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Minimize2, Maximize2, GripVertical } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/lib/utils';

interface DraggablePanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
  isOpen?: boolean;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  minimizable?: boolean;
}

export function DraggablePanel({
  children,
  title,
  className,
  defaultPosition = { x: 100, y: 100 },
  onClose,
  isOpen = true,
  minWidth = 400,
  minHeight = 300,
  resizable = true,
  minimizable = true
}: DraggablePanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState({ width: minWidth, height: minHeight });
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC key to close panel
  useHotkeys('esc', () => {
    if (onClose && isOpen) {
      onClose();
    }
  }, { enabled: isOpen });

  // Focus panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDrag = (event: React.PointerEvent) => {
    dragControls.start(event);
  };

  return (
    <motion.div
      ref={panelRef}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      initial={{ 
        x: defaultPosition.x, 
        y: defaultPosition.y,
        opacity: 0,
        scale: 0.9
      }}
      animate={{ 
        opacity: 1,
        scale: 1,
        height: isMinimized ? 'auto' : size.height
      }}
      exit={{ 
        opacity: 0,
        scale: 0.9
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{ 
        position: 'fixed',
        width: size.width,
        zIndex: 1000
      }}
      className={cn(
        'bg-black/90 backdrop-blur-xl border border-aqua/30 rounded-xl shadow-2xl',
        'focus:outline-none focus:border-aqua/50',
        className
      )}
      tabIndex={-1}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-aqua/20 cursor-move"
        onPointerDown={handleStartDrag}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-500" />
          {title && (
            <h3 className="text-lg font-semibold text-white select-none">
              {title}
            </h3>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {minimizable && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-aqua/20 rounded-lg transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group"
              aria-label="Close panel (ESC)"
            >
              <X className="w-4 h-4 group-hover:text-red-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      {!isMinimized && (
        <div className="p-4 overflow-auto" style={{ maxHeight: size.height - 60 }}>
          {children}
        </div>
      )}
      
      {/* Resize Handle */}
      {resizable && !isMinimized && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          onDrag={(e, info) => {
            const newWidth = Math.max(minWidth, size.width + info.delta.x);
            const newHeight = Math.max(minHeight, size.height + info.delta.y);
            setSize({ width: newWidth, height: newHeight });
          }}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-aqua/50" />
        </motion.div>
      )}
    </motion.div>
  );
} 