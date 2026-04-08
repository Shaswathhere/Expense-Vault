"use client";

import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOffline } from "@/hooks/use-offline";

export function OfflineIndicator() {
  const { isOffline } = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 py-1.5 px-4 text-sm font-medium shadow-md"
        >
          <WifiOff className="h-4 w-4" />
          <span>You are offline. Changes will be saved locally.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
