import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results as SpeechRecognitionResultList);
      const transcript = results
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onTranscript(transcript);
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
  }, [onTranscript]);

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

  return { isRecording, toggleRecording, startRecording, stopRecording };
}