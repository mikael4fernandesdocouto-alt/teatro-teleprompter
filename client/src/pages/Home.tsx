import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play, Volume2 } from "lucide-react";
import { characters, getCharacterLines } from "@/lib/script";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

/**
 * DESIGN: O Auto da Compadecida - Estilo Cordel (Papel Antigo)
 * Com funcionalidades de áudio exclusivas e correção para mobile
 */

export default function Home() {
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<string>("joao");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [showFlash, setShowFlash] = useState(false);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Áudio refs e estados
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSpeakingLine, setIsSpeakingLine] = useState(false);
  const wasListeningBeforeAudio = useRef(false);

  // Hook de reconhecimento de voz estável
  const {
    isListening,
    isSupported,
    error: speechError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    language: "pt-BR",
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      setTranscript(text);
      if (isFinal) {
        setShowFlash(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setShowFlash(false), 3000);
      }
    },
  });

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  const characterLines = getCharacterLines(selectedCharacterId);
  const allLines = characterLines;
  const currentLine = allLines[currentLineIndex];

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      activeAudioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const pauseMicForAudio = () => {
    if (isListening) {
      wasListeningBeforeAudio.current = true;
      stopListening();
    } else {
      wasListeningBeforeAudio.current = false;
    }
  };

  const resumeMicAfterAudio = () => {
    setIsPlayingAudio(false);
    setIsSpeakingLine(false);
    if (wasListeningBeforeAudio.current) {
      startListening();
    }
  };

  const stopCurrentAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    setIsPlayingAudio(false);
    setIsSpeakingLine(false);
  };

  // Função mestre para tocar áudio (Corrige bug de celular e áudio duplo)
  const playSound = (url: string) => {
    // 1. Para áudio anterior se existir
    stopCurrentAudio();

    // 2. No celular, o microfone bloqueia o áudio. Pausamos a escuta.
    pauseMicForAudio();

    // 3. Configura e toca o novo áudio
    const audio = new Audio(url);
    activeAudioRef.current = audio;

    audio.onplay = () => setIsPlayingAudio(true);
    audio.onended = resumeMicAfterAudio;

    audio.play().catch(err => {
      console.error("Erro ao tocar áudio:", err);
      resumeMicAfterAudio();
    });
  };

  const speakLine = (line = currentLine) => {
    if (!line || !("speechSynthesis" in window)) return;

    stopCurrentAudio();
    pauseMicForAudio();

    const utterance = new SpeechSynthesisUtterance(
      `${line.character}. ${line.text}`
    );
    utterance.lang = "pt-BR";
    utterance.rate = 0.92;
    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsSpeakingLine(true);
    };
    utterance.onend = resumeMicAfterAudio;
    utterance.onerror = resumeMicAfterAudio;

    window.speechSynthesis.speak(utterance);
  };

  const handleNextLineWithAudio = () => {
    if (currentLineIndex >= allLines.length - 1) return;

    const nextIndex = currentLineIndex + 1;
    const nextLine = allLines[nextIndex];
    setCurrentLineIndex(nextIndex);
    setTranscript("");
    window.setTimeout(() => speakLine(nextLine), 80);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-[#1a1208] text-[#f5ead6] font-serif">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        
        .script-paper {
          background: #f5ead6;
          color: #2a1a08;
          box-shadow: 0 8px 40px rgba(0,0,0,.6);
          border-radius: 4px;
        }
        
        .cordel-title {
          font-family: 'Playfair Display', serif;
        }

        .mic-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #8b3a0f;
          color: #fff;
          border: none;
          border-radius: 3px;
          padding: 10px 20px;
          font-family: 'Crimson Text', serif;
          font-size: 1rem;
          cursor: pointer;
          transition: background .2s;
        }

        .mic-btn:hover { background: #c9622a; }
        .mic-btn.active { background: #2a6e2a; }

        .audio-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #6b4c2a;
          color: #f5ead6;
          border: 1px solid #8b3a0f;
          padding: 10px 18px;
          border-radius: 3px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .audio-btn:hover { background: #8b3a0f; }
        .audio-btn:active { transform: scale(0.95); }
      `}</style>

      {/* Header / Cover */}
      <header className="max-w-2xl w-full text-center py-12 border-b border-[#5a3a1a] mb-10">
        <h1 className="cordel-title text-5xl md:text-6xl font-bold mb-2">
          O Auto da Compadecida
        </h1>
        <p className="text-xl italic text-[#c8a87a]">
          Teleprompter para Teatro
        </p>
      </header>

      {/* Mic & Audio Control Bar */}
      <div className="max-w-2xl w-full mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleToggleListening}
            disabled={!isSupported}
            className={`mic-btn ${isListening ? "active" : ""}`}
            title={
              isSupported
                ? "Iniciar reconhecimento pelo microfone"
                : "Reconhecimento de voz indisponível"
            }
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening ? "Ouvindo..." : "Ligar Microfone"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() =>
                isSpeakingLine ? stopCurrentAudio() : speakLine()
              }
              className="audio-btn"
            >
              <Volume2 size={16} />{" "}
              {isSpeakingLine ? "Parar áudio" : "Ouvir fala"}
            </button>
            <button
              onClick={handleNextLineWithAudio}
              disabled={currentLineIndex === allLines.length - 1}
              className="audio-btn"
            >
              <Play size={16} /> Próxima + áudio
            </button>
          </div>
        </div>

        <div
          className={`italic text-sm transition-colors ${transcript ? "text-[#f5ead6]" : "text-[#c8a87a]"}`}
        >
          {speechError
            ? `${speechError} Use os botões de áudio manual.`
            : isListening
              ? transcript || "Aguardando fala..."
              : isPlayingAudio
                ? "Tocando áudio (Microfone pausado)"
                : "Microfone desligado"}
        </div>
      </div>

      {/* Heard Flash */}
      <div
        className={`max-w-2xl w-full mb-4 p-3 border border-[#8b3a0f] bg-[#8b3a0f26] rounded-sm italic text-[#f5ead6] transition-opacity duration-500 ${showFlash ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        🎤 Reconhecido: {transcript}
      </div>

      {/* Script Content */}
      <main className="max-w-2xl w-full script-paper p-10 leading-relaxed">
        {currentLine ? (
          <div>
            <div className="text-center border-b border-[#c8a87a] pb-2 mb-8">
              <span className="cordel-title text-xl font-bold uppercase tracking-widest text-[#8b3a0f]">
                Ato {currentLine.act} · Cena {currentLine.scene}
              </span>
            </div>

            <div className="mb-8">
              <h3 className="cordel-title font-bold text-[#8b3a0f] uppercase tracking-wider text-sm mb-1">
                {currentLine.character}
              </h3>
              <p className="text-3xl ml-4 font-medium text-[#2a1a08]">
                {currentLine.text}
              </p>
            </div>

            {currentLine.notes && (
              <div className="italic text-[#6b4c2a] text-base pl-4 border-l-2 border-[#c8a87a] my-6">
                {currentLine.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-[#6b4c2a] italic">
            Nenhuma fala disponível para este personagem.
          </div>
        )}

        {/* Navigation Controls */}
        <div className="mt-12 pt-6 border-t border-[#c8a87a] flex justify-between items-center">
          <button
            onClick={() => setCurrentLineIndex(prev => Math.max(0, prev - 1))}
            disabled={currentLineIndex === 0}
            className="text-[#8b3a0f] font-bold uppercase tracking-tighter disabled:opacity-30 text-sm"
          >
            ← Anterior
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase text-[#8b3a0f] font-bold">
              Personagem
            </span>
            <select
              value={selectedCharacterId}
              onChange={e => {
                setSelectedCharacterId(e.target.value);
                setCurrentLineIndex(0);
                stopCurrentAudio();
              }}
              className="bg-transparent border-b border-[#8b3a0f] text-[#8b3a0f] font-bold outline-none text-base cursor-pointer"
            >
              {characters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              stopCurrentAudio();
              setCurrentLineIndex(prev =>
                Math.min(allLines.length - 1, prev + 1)
              );
            }}
            disabled={currentLineIndex === allLines.length - 1}
            className="text-[#8b3a0f] font-bold uppercase tracking-tighter disabled:opacity-30 text-sm"
          >
            Próxima →
          </button>
        </div>
      </main>

      <footer className="mt-10 text-[#c8a87a] text-xs italic text-center max-w-md">
        * Para o áudio funcionar no celular, o microfone é pausado
        automaticamente durante a reprodução.
      </footer>
    </div>
  );
}
