import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft, ChevronUp, ChevronDown, Mic, MicOff, RotateCcw } from "lucide-react";
import { characters } from "@/lib/script";
import TeleprompterView from "@/components/TeleprompterView";
import CharacterSelector from "@/components/CharacterSelector";
import Sidebar from "@/components/Sidebar";
import { useTeleprompter } from "@/hooks/useTeleprompter";
import type { Preset } from "@/hooks/usePresets";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedCharacter,
    selectedCharacterId,
    currentLine,
    currentLineIndex,
    allLines,
    fontSize,
    setFontSize,
    improvisations,
    newImprovisation,
    setNewImprovisation,
    transcript,
    highlightedWords,
    status,
    isListening,
    isSupported,
    audioRef,
    handleAddImprovisation,
    handleRemoveImprovisation,
    handleFileUpload,
    handlePreviousLine,
    handleNextLine,
    handleResetScript,
    handleToggleListening,
    selectCharacter,
    setImprovisations,
    setCurrentLineIndex,
  } = useTeleprompter();

  const handleLoadPreset = (preset: Preset) => {
    setImprovisations(preset.improvisations);
    setFontSize(preset.fontSize);
    selectCharacter(preset.characterId);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d15 50%, #050510 100%)" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        improvisations={improvisations}
        newImprovisation={newImprovisation}
        onNewImprovisationChange={setNewImprovisation}
        onAddImprovisation={handleAddImprovisation}
        onRemoveImprovisation={handleRemoveImprovisation}
        onFileUpload={handleFileUpload}
        characterId={selectedCharacterId}
        onLoadPreset={handleLoadPreset}
        isSupported={isSupported}
      />

      <div className="flex-1 flex flex-col relative min-h-screen">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 h-9 w-9 bg-[#0a0a0f]/80 backdrop-blur border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 neon-glow-cyan"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex flex-col">
          <TeleprompterView
            currentLine={currentLine}
            fontSize={fontSize}
            highlightedWords={highlightedWords}
            selectedCharacter={selectedCharacter}
            transcript={transcript}
            embedded
          />

          <audio ref={audioRef} />
        </div>

        <div className="sticky bottom-0 bg-[#0a0a0f]/90 backdrop-blur-md border-t border-[#00f0ff]/15 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
            <div className="flex-[2] min-w-[200px]">
              <CharacterSelector
                characters={characters}
                selectedCharacterId={selectedCharacterId}
                onSelect={selectCharacter}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreviousLine}
                disabled={currentLineIndex === 0}
                className="h-9 px-3 bg-gradient-to-r from-[#00f0ff] to-[#7c3aed] text-black font-bold hover:opacity-90 disabled:opacity-30 transition-all"
                size="sm"
              >
                <ChevronUp className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button
                onClick={handleNextLine}
                disabled={currentLineIndex >= allLines.length - 1}
                className="h-9 px-3 bg-gradient-to-r from-[#7c3aed] to-[#ff00aa] text-black font-bold hover:opacity-90 disabled:opacity-30 transition-all"
                size="sm"
              >
                Próxima <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleToggleListening}
                className={`h-9 px-3 font-bold text-black ${
                  isListening
                    ? "bg-[#ff00aa] hover:bg-[#ff00aa]/80 animate-pulse"
                    : "bg-gradient-to-r from-[#00f0ff] to-[#7c3aed] hover:opacity-90"
                }`}
                size="sm"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 mr-1" />
                ) : (
                  <Mic className="h-4 w-4 mr-1" />
                )}
                {isListening ? "Parar" : "Escutar"}
              </Button>
              <Button
                onClick={handleResetScript}
                className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white/70 border border-white/10"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </div>

          {status !== "idle" && (
            <div className="max-w-5xl mx-auto mt-2">
              <div
                className="px-3 py-1.5 rounded text-xs text-center"
                style={{
                  background:
                    status === "error"
                      ? "rgba(255, 0, 170, 0.15)"
                      : "rgba(0, 240, 255, 0.1)",
                  border: `1px solid ${
                    status === "error" ? "rgba(255, 0, 170, 0.3)" : "rgba(0, 240, 255, 0.2)"
                  }`,
                  color: status === "error" ? "#ff00aa" : "#00f0ff",
                }}
              >
                {status === "listening" && "🎤 Escutando..."}
                {status === "error" && "Erro no reconhecimento de voz"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
