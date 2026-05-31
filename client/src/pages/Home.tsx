import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  RotateCcw,
  Plus,
  Trash2,
  Mic,
  MicOff,
  Upload,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { characters, getCharacterLines } from "@/lib/script";
import TeleprompterView from "@/components/TeleprompterView";
import CharacterSelector from "@/components/CharacterSelector";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

/**
 * DESIGN PHILOSOPHY: Premium Theater Teleprompter
 * - Destaque massivo da fala atual com relevo
 * - Alto contraste profissional para palco
 * - Gradientes sofisticados (azul escuro + laranja)
 * - Efeitos de sombra e profundidade
 */

interface Improvisation {
  id: string;
  text: string;
  audioUrl?: string;
}

interface ScriptLine {
  id: string;
  character: string;
  text: string;
  act: number;
  scene: number;
}

export default function Home() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("joao");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [fontSize, setFontSize] = useState(40);
  const [improvisations, setImprovisations] = useState<Improvisation[]>([]);
  const [newImprovisation, setNewImprovisation] = useState("");
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "error">("idle");

  const audioRef = useRef<HTMLAudioElement>(null);

  // FIX: usar useRef para timeout evita re-renders desnecessários e race conditions
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: refs para evitar stale closures nos callbacks do speech recognition
  // Callbacks capturam o valor no momento da criação; refs sempre têm o valor atual
  const allLinesRef = useRef<ScriptLine[]>([]);
  const currentLineIndexRef = useRef(0);
  const improvisationsRef = useRef<Improvisation[]>([]);

  // Construção das linhas do personagem selecionado
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
  const characterLines = getCharacterLines(selectedCharacterId);
  const allLines: ScriptLine[] = [
    ...characterLines,
    ...improvisations.map((improv) => ({
      id: improv.id,
      character: selectedCharacter?.name ?? "",
      text: improv.text,
      act: 0,
      scene: 0,
    })),
  ];

  // Manter refs sincronizadas a cada render (sem custo de useEffect)
  allLinesRef.current = allLines;
  currentLineIndexRef.current = currentLineIndex;
  improvisationsRef.current = improvisations;

  // FIX: limpar timeout pendente ao desmontar o componente
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  // FIX: useCallback + leitura via refs → função estável que nunca fica stale
  const highlightWordsInCurrentLine = useCallback((spokenText: string) => {
    const currentLine = allLinesRef.current[currentLineIndexRef.current];
    if (!currentLine) return;

    const words = spokenText.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
    const lineWords = currentLine.text.toLowerCase().split(/\s+/);

    const highlighted = words.filter((word) =>
      lineWords.some((lw) => lw.includes(word) || word.includes(lw))
    );

    setHighlightedWords(highlighted);
  }, []); // dependências vazias: lê apenas de refs

  // FIX: lê improvs via ref, adiciona .catch() no play() para evitar unhandled rejection
  const handleSilenceDetected = useCallback(() => {
    const currentImprovs = improvisationsRef.current;
    if (currentImprovs.length === 0) return;

    const lastImprov = currentImprovs[currentImprovs.length - 1];
    if (lastImprov.audioUrl && audioRef.current) {
      audioRef.current.src = lastImprov.audioUrl;
      audioRef.current
        .play()
        .catch((err) => console.error("Erro ao reproduzir áudio:", err));
    }
  }, []);

  const {
    isListening,
    isSupported,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    language: "pt-BR",
    continuous: true,
    interimResults: true,
    onResult: (text: string, isFinal: boolean) => {
      setTranscript(text);
      highlightWordsInCurrentLine(text);

      if (isFinal) {
        // FIX: cancelar timeout anterior antes de criar novo
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(handleSilenceDetected, 2000);
      }
    },
    onError: (error: unknown) => {
      console.error("Erro de reconhecimento:", error);
    },
    onStatusChange: setStatus,
  });

  // Helper para limpar estado de fala ao trocar de linha
  const clearSpeechState = () => {
    setHighlightedWords([]);
    setTranscript("");
  };

  const handleAddImprovisation = () => {
    const trimmed = newImprovisation.trim();
    if (!trimmed) return;
    setImprovisations((prev) => [
      ...prev,
      { id: `improv-${Date.now()}`, text: trimmed },
    ]);
    setNewImprovisation("");
  };

  const handleRemoveImprovisation = (id: string) => {
    // FIX: ajustar índice atual se a linha removida era anterior à posição atual
    const removedIndex = allLines.findIndex((l) => l.id === id);
    setImprovisations((prev) => prev.filter((i) => i.id !== id));
    if (removedIndex !== -1 && removedIndex <= currentLineIndex) {
      setCurrentLineIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    improvId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const audioUrl = event.target?.result as string;
      setImprovisations((prev) =>
        prev.map((i) => (i.id === improvId ? { ...i, audioUrl } : i))
      );
    };
    reader.onerror = () => console.error("Falha ao ler o arquivo de áudio");
    reader.readAsDataURL(file);

    // FIX: resetar value para permitir re-seleção do mesmo arquivo
    e.target.value = "";
  };

  const handlePreviousLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex((prev) => prev - 1);
      clearSpeechState();
    }
  };

  const handleNextLine = () => {
    if (currentLineIndex < allLines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1);
      clearSpeechState();
    }
  };

  const handleResetScript = () => {
    setCurrentLineIndex(0);
    clearSpeechState();
    if (isListening) stopListening();
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  const handleToggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSelectCharacter = (id: string) => {
    setSelectedCharacterId(id);
    setCurrentLineIndex(0);
    clearSpeechState();
  };

  const currentLine = allLines[currentLineIndex];
  const isAtStart = currentLineIndex === 0;
  const isAtEnd = currentLineIndex >= allLines.length - 1;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {/* FIX: aviso quando o browser não suporta reconhecimento de voz */}
      {!isSupported && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 20px",
            background: "rgba(255, 107, 53, 0.15)",
            border: "1px solid #FF6B35",
            borderRadius: "8px",
            color: "#FF8C42",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
          }}
        >
          <AlertCircle size={18} />
          Reconhecimento de voz não suportado neste navegador. Use Chrome ou
          Edge para habilitar essa funcionalidade.
        </div>
      )}

      {/* Teleprompter View – largura total */}
      <div style={{ marginBottom: "30px" }}>
        <TeleprompterView
          currentLine={currentLine}
          fontSize={fontSize}
          highlightedWords={highlightedWords}
          selectedCharacter={selectedCharacter}
          transcript={transcript}
        />
      </div>

      {/* Painel de controles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Painel esquerdo – Personagem e Navegação */}
        <Card
          style={{
            background: "linear-gradient(135deg, #0F1629 0%, #1A2847 100%)",
            border: "2px solid #FF8C42",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(255, 140, 66, 0.2)",
          }}
        >
          <h2
            style={{
              color: "#FF8C42",
              marginBottom: "20px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            👤 Personagem
          </h2>
          <CharacterSelector
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={handleSelectCharacter}
          />

          <div
            style={{
              marginTop: "30px",
              paddingTop: "30px",
              borderTop: "1px solid rgba(255, 140, 66, 0.2)",
            }}
          >
            <h3
              style={{
                color: "#FF8C42",
                marginBottom: "15px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              ⚙️ Controles
            </h3>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button
                onClick={handlePreviousLine}
                disabled={isAtStart}
                style={{
                  background: isAtStart
                    ? "#333"
                    : "linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: isAtStart ? "not-allowed" : "pointer",
                  flex: 1,
                  minWidth: "100px",
                  opacity: isAtStart ? 0.5 : 1,
                }}
              >
                <ChevronUp size={18} /> Anterior
              </Button>
              <Button
                onClick={handleNextLine}
                disabled={isAtEnd}
                style={{
                  background: isAtEnd
                    ? "#333"
                    : "linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: isAtEnd ? "not-allowed" : "pointer",
                  flex: 1,
                  minWidth: "100px",
                  opacity: isAtEnd ? 0.5 : 1,
                }}
              >
                <ChevronDown size={18} /> Próxima
              </Button>
            </div>

            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              {/* FIX: botão desabilitado quando speech recognition não é suportado */}
              <Button
                onClick={handleToggleListening}
                disabled={!isSupported}
                style={{
                  background: isListening ? "#FF6B35" : "#2C5F8D",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: isSupported ? "pointer" : "not-allowed",
                  flex: 1,
                  opacity: isSupported ? 1 : 0.5,
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                &nbsp;{isListening ? "Parar" : "Escutar"}
              </Button>
              <Button
                onClick={handleResetScript}
                style={{
                  background: "#555",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                <RotateCcw size={18} /> Reset
              </Button>
            </div>
          </div>

          {/* Controle de tamanho de fonte */}
          <div
            style={{
              marginTop: "30px",
              paddingTop: "30px",
              borderTop: "1px solid rgba(255, 140, 66, 0.2)",
            }}
          >
            <h3
              style={{
                color: "#FF8C42",
                marginBottom: "15px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              🔤 Tamanho da Fonte
            </h3>
            <input
              type="range"
              min="24"
              max="60"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "4px",
                background: "linear-gradient(to right, #FF8C42, #FF6B35)",
                outline: "none",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                color: "#FFB380",
                marginTop: "10px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              {fontSize}px
            </div>
          </div>

          {/* NOVO: indicador de progresso */}
          <div
            style={{
              marginTop: "20px",
              padding: "10px 15px",
              background: "rgba(255, 140, 66, 0.06)",
              border: "1px solid rgba(255, 140, 66, 0.15)",
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <span style={{ color: "#FFB380", fontSize: "13px" }}>
              Fala{" "}
              <strong style={{ color: "#FF8C42" }}>
                {currentLineIndex + 1}
              </strong>{" "}
              de{" "}
              <strong style={{ color: "#FF8C42" }}>{allLines.length}</strong>
            </span>
          </div>
        </Card>

        {/* Painel direito – Improvisações */}
        <Card
          style={{
            background: "linear-gradient(135deg, #0F1629 0%, #1A2847 100%)",
            border: "2px solid #FF8C42",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(255, 140, 66, 0.2)",
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          <h2
            style={{
              color: "#FF8C42",
              marginBottom: "20px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            🎭 Improvisações
          </h2>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              value={newImprovisation}
              onChange={(e) => setNewImprovisation(e.target.value)}
              // FIX: onKeyPress está deprecado → usar onKeyDown
              onKeyDown={(e) => e.key === "Enter" && handleAddImprovisation()}
              placeholder="Digite uma fala improvisada..."
              style={{
                flex: 1,
                padding: "10px 15px",
                borderRadius: "6px",
                border: "1px solid #FF8C42",
                background: "#1A2847",
                color: "#FFFFFF",
                fontSize: "14px",
              }}
            />
            <Button
              onClick={handleAddImprovisation}
              style={{
                background: "linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 15px",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              <Plus size={18} /> Adicionar
            </Button>
          </div>

          {improvisations.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {improvisations.map((improv) => (
                <div
                  key={improv.id}
                  style={{
                    background: "rgba(255, 140, 66, 0.1)",
                    border: "1px solid #FF8C42",
                    padding: "15px",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{ color: "#FFFFFF", marginBottom: "10px", fontSize: "14px" }}
                  >
                    {improv.text}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {/*
                     * FIX: input por improvisation via <label> individual.
                     * O bug original usava um único fileInputRef compartilhado entre
                     * todos os cards — clicar em qualquer botão sempre ativava
                     * o mesmo input, potencialmente associando o áudio ao item errado.
                     * Solução: cada improvisation tem seu próprio <input type="file">
                     * envolvido por um <label>, sem necessidade de ref.
                     */}
                    <label style={{ flex: 1, cursor: "pointer" }}>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload(e, improv.id)}
                        style={{ display: "none" }}
                      />
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          background: improv.audioUrl ? "#1E7A3E" : "#2C5F8D",
                          color: "#FFFFFF",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          userSelect: "none",
                        }}
                      >
                        <Upload size={14} />
                        {improv.audioUrl ? "✓ Trocar" : "Áudio"}
                      </span>
                    </label>
                    <Button
                      onClick={() => handleRemoveImprovisation(improv.id)}
                      style={{
                        background: "#FF6B35",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                color: "#FFB380",
                textAlign: "center",
                opacity: 0.6,
                fontSize: "14px",
                paddingTop: "20px",
              }}
            >
              Nenhuma improvisação adicionada ainda
            </div>
          )}
        </Card>
      </div>

      {/* Barra de status */}
      {status !== "idle" && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px 20px",
            background:
              status === "error"
                ? "rgba(255, 107, 53, 0.2)"
                : "rgba(44, 95, 141, 0.2)",
            border: `1px solid ${status === "error" ? "#FF6B35" : "#2C5F8D"}`,
            borderRadius: "6px",
            color: status === "error" ? "#FF8C42" : "#FFB380",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          {status === "listening" && "🎤 Escutando..."}
          {status === "error" && "⚠️ Erro no reconhecimento de voz"}
        </div>
      )}

      <audio ref={audioRef} />
    </div>
  );
}
