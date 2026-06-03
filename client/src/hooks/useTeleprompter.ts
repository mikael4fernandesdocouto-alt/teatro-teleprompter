import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { characters, getCharacterLines, type ScriptLine } from "@/lib/script";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export interface Improvisation {
  id: string;
  text: string;
  audioUrl?: string;
}

export function useTeleprompter() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("joao");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [fontSize, setFontSize] = useState(40);
  const [improvisations, setImprovisations] = useState<Improvisation[]>([]);
  const [newImprovisation, setNewImprovisation] = useState("");
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<"idle" | "listening" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement>(null);

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
      highlightWordsInCurrentLine(text);

      if (isFinal) {
        if (silenceTimeout) clearTimeout(silenceTimeout);
        const newTimeout = setTimeout(() => handleSilenceDetected(), 2000);
        setSilenceTimeout(newTimeout);
      }
    },
    onError: (error) => console.error("Erro de reconhecimento:", error),
    onStatusChange: setStatus,
  });

  const selectedCharacter = useMemo(
    () => characters.find(c => c.id === selectedCharacterId),
    [selectedCharacterId]
  );

  const characterLines = useMemo(
    () => getCharacterLines(selectedCharacterId),
    [selectedCharacterId]
  );

  const allLines = useMemo(() => {
    if (!selectedCharacter) return characterLines;
    return [
      ...characterLines,
      ...improvisations.map(improv => ({
        id: improv.id,
        character: selectedCharacter.name,
        text: improv.text,
        act: 0,
        scene: 0,
      })),
    ];
  }, [characterLines, improvisations, selectedCharacter]);

  const currentLine: ScriptLine | undefined = allLines[currentLineIndex];

  const highlightWordsInCurrentLine = useCallback(
    (spokenText: string) => {
      const line = allLines[currentLineIndex];
      if (!line) return;

      const words = spokenText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const lineWords = line.text.toLowerCase().split(/\s+/);

      const highlighted = words.filter(word =>
        lineWords.some(lineWord => lineWord.includes(word) || word.includes(lineWord))
      );

      setHighlightedWords(highlighted);
    },
    [allLines, currentLineIndex]
  );

  const handleSilenceDetected = useCallback(() => {
    if (improvisations.length > 0) {
      const lastImprov = improvisations[improvisations.length - 1];
      if (lastImprov.audioUrl && audioRef.current) {
        audioRef.current.src = lastImprov.audioUrl;
        audioRef.current.play();
      }
    }
  }, [improvisations]);

  const handleAddImprovisation = useCallback(() => {
    if (newImprovisation.trim()) {
      setImprovisations(prev => [
        ...prev,
        { id: `improv-${Date.now()}`, text: newImprovisation },
      ]);
      setNewImprovisation("");
    }
  }, [newImprovisation]);

  const handleRemoveImprovisation = useCallback((id: string) => {
    setImprovisations(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, improvId: string) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = event => {
          const audioUrl = event.target?.result as string;
          setImprovisations(prev =>
            prev.map(i => (i.id === improvId ? { ...i, audioUrl } : i))
          );
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handlePreviousLine = useCallback(() => {
    setCurrentLineIndex(prev => Math.max(0, prev - 1));
    setHighlightedWords([]);
    setTranscript("");
  }, []);

  const handleNextLine = useCallback(() => {
    setCurrentLineIndex(prev => Math.min(allLines.length - 1, prev + 1));
    setHighlightedWords([]);
    setTranscript("");
  }, [allLines.length]);

  const handleResetScript = useCallback(() => {
    setCurrentLineIndex(0);
    setHighlightedWords([]);
    setTranscript("");
    if (isListening) stopListening();
  }, [isListening, stopListening]);

  const handleToggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, stopListening, startListening]);

  useEffect(() => {
    return () => {
      if (silenceTimeout) clearTimeout(silenceTimeout);
    };
  }, [silenceTimeout]);

  const selectCharacter = useCallback((id: string) => {
    setSelectedCharacterId(id);
    setCurrentLineIndex(0);
    setHighlightedWords([]);
    setTranscript("");
  }, []);

  return {
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
    speechError,
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
  };
}
