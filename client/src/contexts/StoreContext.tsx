import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_CATEGORIES } from "../lib/demo-data";
import { getPublicCategories, getPublicSettings } from "../lib/data";
import { DEFAULT_SETTINGS, type Category, type StoreSettings } from "../lib/types";
import { isSupabaseConfigured } from "../lib/supabase";

interface StoreContextValue {
  settings: StoreSettings;
  categories: Category[];
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  reload: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      setSettings(DEFAULT_SETTINGS);
      setCategories(DEMO_CATEGORIES);
      setLoading(false);
      return;
    }
    try {
      const [nextSettings, nextCategories] = await Promise.all([getPublicSettings(), getPublicCategories()]);
      setSettings(nextSettings);
      setCategories(nextCategories);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Store information could not be loaded.");
      setSettings(DEFAULT_SETTINGS);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo<StoreContextValue>(() => ({
    settings,
    categories,
    loading,
    error,
    isDemo: !isSupabaseConfigured,
    reload,
  }), [settings, categories, loading, error, reload]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider.");
  return value;
}
