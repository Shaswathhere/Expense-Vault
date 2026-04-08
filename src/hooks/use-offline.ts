"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  saveDraft as saveDraftToIDB,
  syncDrafts as syncDraftsFromIDB,
} from "@/lib/offline";

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    // Set initial state after mount (navigator.onLine is only available client-side)
    setIsOffline(!navigator.onLine);
    initialised.current = true;

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("You are offline. Changes will be saved locally.");
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online! Syncing pending changes...");
      // Auto-sync drafts when coming back online
      syncDraftsFromIDB().then(({ synced, failed }) => {
        if (synced > 0) {
          toast.success(`Synced ${synced} offline transaction(s).`);
        }
        if (failed > 0) {
          toast.error(
            `Failed to sync ${failed} transaction(s). They will be retried.`
          );
        }
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const saveDraft = useCallback(
    async (data: Record<string, unknown>) => {
      const id = await saveDraftToIDB(data);
      toast.info("Transaction saved as draft (offline).");
      return id;
    },
    []
  );

  const syncDrafts = useCallback(async () => {
    if (isOffline) {
      toast.warning("Cannot sync while offline.");
      return { synced: 0, failed: 0 };
    }
    return syncDraftsFromIDB();
  }, [isOffline]);

  return { isOffline, saveDraft, syncDrafts };
}
