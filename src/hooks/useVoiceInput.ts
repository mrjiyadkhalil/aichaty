import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [voiceLang, setVoiceLang] = useState<string>("bn-BD");

  const translateToEnglish = useCallback(async (text: string): Promise<string> => {
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("multi-model-chat", {
        body: {
          prompt: `Translate the following text to English. Return ONLY the English translation, nothing else. Do not add quotes or explanations.\n\nText: ${text}`,
          model: "google/gemini-2.5-flash-lite",
          request_type: "voice_translate",
        },
      });
      if (error || !data?.content) return text;
      return data.content.trim();
    } catch {
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = voiceLang;

    recognition.onresult = async (event: any) => {
      const newResults: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newResults.push(event.results[i][0].transcript);
        }
      }
      const transcript = newResults.join(" ").trim();
      if (!transcript) return;

      // If voice lang is English, no translation needed
      if (voiceLang.startsWith("en")) {
        onTranscript(transcript);
      } else {
        // Transcribe in native language, then translate to English
        const translated = await translateToEnglish(transcript);
        onTranscript(translated);
      }
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
  }, [onTranscript, voiceLang, translateToEnglish]);

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
