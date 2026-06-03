import type { ScriptLine, Character } from "@/lib/script";

interface TeleprompterViewProps {
  currentLine: ScriptLine | undefined;
  fontSize: number;
  highlightedWords: string[];
  selectedCharacter: Character | undefined;
  transcript?: string;
  embedded?: boolean;
}

export default function TeleprompterView({
  currentLine,
  fontSize,
  highlightedWords,
  selectedCharacter,
  transcript,
  embedded,
}: TeleprompterViewProps) {
  const highlightText = (text: string) => {
    if (highlightedWords.length === 0) return text;

    return text.split(/\s+/).map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, "");
      const isHighlighted = highlightedWords.some(
        hw => cleanWord.includes(hw) || hw.includes(cleanWord)
      );

      if (isHighlighted && cleanWord.length > 0) {
        return (
          <span
            key={idx}
            className="inline-block mr-4 mb-2 animate-pulse"
            style={{
              background: "linear-gradient(135deg, #00f0ff 0%, #7c3aed 100%)",
              color: "#000",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: "900",
              textShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              transform: "scale(1.05)",
              letterSpacing: "0.5px",
            }}
          >
            {word}
          </span>
        );
      }
      return (
        <span key={idx} className="inline-block mr-4 mb-2">
          {word}
        </span>
      );
    });
  };

  const content = currentLine ? (
    <div
      className="transition-all duration-300"
      style={{ fontSize: `${fontSize}px`, lineHeight: "2" }}
    >
      <div
        style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: `${fontSize * 0.6}px`,
          fontWeight: "900",
          marginBottom: "20px",
          textTransform: "uppercase",
          letterSpacing: "6px",
          color: "transparent",
          background: "linear-gradient(135deg, #00f0ff 0%, #7c3aed 50%, #ff00aa 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          textShadow: "none",
          filter: "drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))",
        }}
      >
        {currentLine.character}
      </div>

      <div
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: "2.2",
          color: "#f0f0ff",
          minHeight: `${fontSize * 2}px`,
          padding: "24px",
          background: "linear-gradient(135deg, rgba(0, 240, 255, 0.03) 0%, rgba(124, 58, 237, 0.03) 100%)",
          borderRadius: "8px",
          border: "2px solid rgba(0, 240, 255, 0.15)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3), 0 0 30px rgba(0, 240, 255, 0.05)",
          textShadow: "0 0 10px rgba(0,0,0,0.5)",
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          alignContent: "flex-start",
        }}
      >
        {currentLine.text.includes("\n")
          ? currentLine.text.split("\n").map((line, idx) => (
              <div key={idx} style={{ marginBottom: "12px", width: "100%" }}>
                {highlightText(line)}
              </div>
            ))
          : highlightText(currentLine.text)}
      </div>

      {currentLine.notes && (
        <div
          style={{
            fontSize: `${fontSize * 0.55}px`,
            color: "#ff00aa",
            fontStyle: "italic",
            marginTop: "24px",
            padding: "16px",
            background: "rgba(255, 0, 170, 0.08)",
            borderLeft: "3px solid #ff00aa",
            borderRadius: "4px",
            textShadow: "0 0 10px rgba(255, 0, 170, 0.3)",
          }}
        >
          {currentLine.notes}
        </div>
      )}

      {transcript && (
        <div
          style={{
            fontSize: `${fontSize * 0.5}px`,
            color: "#fff",
            marginTop: "24px",
            padding: "16px",
            background: "linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(255, 0, 170, 0.05) 100%)",
            borderRadius: "6px",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.1)",
          }}
        >
          <strong style={{ color: "#00f0ff" }}>Reconhecido: </strong>
          {transcript}
        </div>
      )}
    </div>
  ) : (
    <div
      style={{
        fontSize: `${fontSize}px`,
        color: "rgba(0, 240, 255, 0.5)",
        textAlign: "center",
      }}
    >
      Selecione um personagem para começar
    </div>
  );

  if (embedded) {
    return (
      <div
        className="flex flex-col justify-center flex-1"
        style={{
          padding: "20px 40px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="rounded-2xl shadow-2xl flex flex-col justify-center"
        style={{
          background: "linear-gradient(135deg, #0d0d15 0%, #12101e 100%)",
          border: "2px solid rgba(0, 240, 255, 0.2)",
          color: "#fff",
          maxHeight: "800px",
          overflow: "auto",
          padding: "60px",
          boxShadow:
            "0 0 40px rgba(0, 240, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
          position: "relative",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>{content}</div>
      </div>
    </div>
  );
}
