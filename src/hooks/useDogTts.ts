"use client";

import { useState, useEffect, useCallback } from "react";
import { dogTtsService, DogTtsState, VoiceMode, VoiceGender } from "@/lib/dogTtsService";

export function useDogTts() {
  const [state, setState] = useState<DogTtsState>(dogTtsService.getState());

  useEffect(() => {
    const unsubscribe = dogTtsService.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const speak = useCallback((text: string, options?: { soundCue?: boolean; onStart?: () => void; onEnd?: () => void }) => {
    return dogTtsService.speak(text, options);
  }, []);

  const stop = useCallback(() => {
    dogTtsService.stop();
  }, []);

  const toggleMute = useCallback(() => {
    return dogTtsService.toggleMute();
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    return dogTtsService.toggleAutoSpeak();
  }, []);

  const setVoiceMode = useCallback((mode: VoiceMode) => {
    dogTtsService.setVoiceMode(mode);
  }, []);

  const setGender = useCallback((gender: VoiceGender) => {
    dogTtsService.setGender(gender);
  }, []);

  const toggleVoiceMode = useCallback(() => {
    return dogTtsService.toggleVoiceMode();
  }, []);

  return {
    ...state,
    speak,
    stop,
    toggleMute,
    toggleAutoSpeak,
    setVoiceMode,
    setGender,
    toggleVoiceMode,
  };
}
