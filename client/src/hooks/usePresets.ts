import { useState, useCallback, useEffect } from "react";
import type { Improvisation } from "@/hooks/useTeleprompter";

export interface Preset {
  id: string;
  name: string;
  createdAt: string;
  improvisations: Improvisation[];
  characterId: string;
  fontSize: number;
}

const STORAGE_KEY = "teatro-presets";

function loadPresets(): Preset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function usePresets(
  improvisations: Improvisation[],
  characterId: string,
  fontSize: number,
  onLoad: (preset: Preset) => void
) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const savePreset = useCallback(() => {
    if (!presetName.trim()) return;

    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      createdAt: new Date().toISOString(),
      improvisations,
      characterId,
      fontSize,
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPresetName("");
  }, [presetName, improvisations, characterId, fontSize, presets]);

  const deletePreset = useCallback(
    (id: string) => {
      const updated = presets.filter(p => p.id !== id);
      setPresets(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [presets]
  );

  const loadPreset = useCallback(
    (id: string) => {
      const preset = presets.find(p => p.id === id);
      if (preset) onLoad(preset);
    },
    [presets, onLoad]
  );

  const exportPresets = useCallback(() => {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teatro-presets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [presets]);

  const importPresets = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as Preset[];
        if (Array.isArray(data)) {
          const merged = [...data, ...loadPresets()];
          setPresets(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        console.error("Erro ao importar presets:", err);
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    presets,
    presetName,
    setPresetName,
    savePreset,
    deletePreset,
    loadPreset,
    exportPresets,
    importPresets,
  };
}
