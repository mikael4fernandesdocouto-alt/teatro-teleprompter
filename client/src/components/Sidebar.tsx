import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  Upload,
  Music,
  Type,
} from "lucide-react";
import PresetsManager from "@/components/PresetsManager";
import type { Improvisation } from "@/hooks/useTeleprompter";
import { usePresets } from "@/hooks/usePresets";
import type { Preset } from "@/hooks/usePresets";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  improvisations: Improvisation[];
  newImprovisation: string;
  onNewImprovisationChange: (text: string) => void;
  onAddImprovisation: () => void;
  onRemoveImprovisation: (id: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, improvId: string) => void;
  characterId: string;
  onLoadPreset: (preset: Preset) => void;
  isSupported: boolean;
}

export default function Sidebar({
  isOpen,
  onToggle,
  fontSize,
  onFontSizeChange,
  improvisations,
  newImprovisation,
  onNewImprovisationChange,
  onAddImprovisation,
  onRemoveImprovisation,
  onFileUpload,
  characterId,
  onLoadPreset,
  isSupported,
}: SidebarProps) {
  const {
    presets,
    presetName,
    setPresetName,
    savePreset,
    deletePreset,
    loadPreset,
    exportPresets,
    importPresets,
  } = usePresets(improvisations, characterId, fontSize, onLoadPreset);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[#050508] border-r border-[#00f0ff]/20 shadow-[4px_0_30px_rgba(0,240,255,0.1)] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[#00f0ff]/10">
        <span className="text-xs font-bold tracking-widest text-[#00f0ff] uppercase">
          Teatro Menu
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-[#00f0ff]/60 hover:text-[#00f0ff]"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-6">
          <PresetsManager
            presets={presets}
            presetName={presetName}
            onPresetNameChange={setPresetName}
            onSave={savePreset}
            onLoad={loadPreset}
            onDelete={deletePreset}
            onExport={exportPresets}
            onImport={importPresets}
          />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-widest text-[#ff00aa] uppercase">
              <Type className="h-3 w-3 inline mr-1" />
              Fonte
            </h3>
            <input
              type="range"
              min="24"
              max="60"
              value={fontSize}
              onChange={e => onFontSizeChange(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: "linear-gradient(to right, #ff00aa, #7c3aed)",
                outline: "none",
              }}
            />
            <div className="text-center text-[10px] text-white/50 font-mono">
              {fontSize}px
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-widest text-[#ff00aa] uppercase">
              <Music className="h-3 w-3 inline mr-1" />
              Efeitos Sonoros
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {["suspense", "vento", "sanfona", "risos", "divino", "nordestina"].map(
                effect => (
                  <div
                    key={effect}
                    className="text-[10px] text-white/50 bg-white/5 rounded px-2 py-1 border border-white/5"
                  >
                    {effect}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-widest text-[#ff00aa] uppercase">
              Improvisações
            </h3>

            <div className="flex gap-2">
              <Input
                value={newImprovisation}
                onChange={e => onNewImprovisationChange(e.target.value)}
                placeholder="Nova fala..."
                className="flex-1 h-8 text-xs bg-[#0a0a0f] border-[#ff00aa]/30 text-white placeholder:text-white/30"
                onKeyDown={e => e.key === "Enter" && onAddImprovisation()}
              />
              <Button
                size="icon"
                onClick={onAddImprovisation}
                className="h-8 w-8 bg-[#ff00aa]/20 hover:bg-[#ff00aa]/40 border border-[#ff00aa]/50 text-[#ff00aa]"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {improvisations.length === 0 && (
              <p className="text-[10px] text-white/30 text-center py-2">
                Nenhuma improvisação
              </p>
            )}

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {improvisations.map(improv => (
                <div
                  key={improv.id}
                  className="p-2 rounded bg-[#ff00aa]/5 border border-[#ff00aa]/10 text-xs text-white/70"
                >
                  <p className="line-clamp-2 mb-1.5">{improv.text}</p>
                  <div className="flex gap-1">
                    <label className="flex-1 flex items-center justify-center gap-1 p-1 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] cursor-pointer transition-colors">
                      <Upload className="h-2.5 w-2.5" />
                      {improv.audioUrl ? "Trocar" : "Áudio"}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={e => onFileUpload(e, improv.id)}
                      />
                    </label>
                    <button
                      onClick={() => onRemoveImprovisation(improv.id)}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isSupported && (
            <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-[10px] text-yellow-400">
              Reconhecimento de voz não suportado neste navegador.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
