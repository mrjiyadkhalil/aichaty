import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [voiceLang, setVoiceLang] = useState<string>("bn-BD"); // Default Bangla

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = voiceLang; // Set language so browser transcribes in the correct language

    recognition.onresult = (event: any) => {
      const newResults: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newResults.push(event.results[i][0].transcript);
        }
      }
      const transcript = newResults.join(" ").trim();
      if (!transcript) return;
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow mic permissions.");
      } else if (event.error === "no-speech") {
        toast.warning("No speech detected. Try again.");
      } else {
        toast.error(`Speech error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [onTranscript, voiceLang]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, isTranslating, toggleRecording, startRecording, stopRecording, voiceLang, setVoiceLang };
}
