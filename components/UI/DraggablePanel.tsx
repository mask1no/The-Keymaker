import { motion } from 'framer-motion';

export default function DraggablePanel({ children }) {
  return (
    <motion.div drag dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }} whileDrag={{ scale: 1.05 }} className="p-4">
      {children}
    </motion.div>
  );
} 