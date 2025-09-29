import dynamic from 'next/dynamic';

// Dynamically import motion to reduce initial bundle
const motion = dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion })), {
  ssr: false,
  loading: () => <div className="p-4 sm:p-6 md:p-8 opacity-50">Loading...</div>
});

const DashboardWrapper = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 md:p-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="md:col-span-2 lg:col-span-3 bento-card"
        >
          <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-400">
            Dashboard features are being upgraded. Use the Bundler from the sidebar.
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -5, scale: 1.02 }} className="lg:col-span-1 bento-card">
          <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-400">
            Analytics coming soon.
          </div>
        </motion.div>
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="md:col-span-1 lg:col-span-1 bento-card"
        >
          <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-400">
            Creator tools coming soon.
          </div>
        </motion.div>
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="md:col-span-1 lg:col-span-1 bento-card"
        >
          <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-400">
            Notifications coming soon.
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardWrapper;
