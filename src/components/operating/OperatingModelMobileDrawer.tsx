import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { OperatingModelNavList } from './OperatingModelNavList';
import { OperatingModeToggle } from './OperatingModeToggle';
import { useOperatingLayoutStore } from '../../store/operatingLayoutStore';

export function OperatingModelMobileDrawer() {
  const { mobileNavOpen, setMobileNavOpen } = useOperatingLayoutStore();
  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <button type="button" className="fixed inset-0 z-[90] bg-black/60" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 z-[100] w-[min(100vw,280px)] h-full border-r border-cyber-border bg-cyber-darker flex flex-col shadow-2xl pt-14 pl-2 pr-0 pb-4"
          >
            <div className="flex items-center justify-between pr-2 pb-2 border-b border-cyber-border/50">
              <span className="text-xs font-cyber text-cyber-glow">Ops terminal</span>
              <button type="button" className="p-1.5 text-cyber-muted hover:text-cyber-text" onClick={() => setMobileNavOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto py-2">
              <OperatingModelNavList onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <div className="p-2 border-t border-cyber-border/40">
              <OperatingModeToggle />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
