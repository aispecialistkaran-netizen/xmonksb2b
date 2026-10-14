/**
 * Monk Pup Dog Text-to-Speech (TTS) Service
 * Powered by open-source 'speak-tts' (Tom S. GitHub repository: https://github.com/tom-s/speak-tts)
 * Enhanced with dual voice modes:
 *  1. 'professional' (DEFAULT): Executive studio-grade, crystal-clear natural boardroom voice (pitch: 1.0, rate: 0.98)
 *  2. 'playful': Cheerful, energetic puppy mascot voice (pitch: 1.35, rate: 1.05)
 */

import Speech from "speak-tts";

export type VoiceMode = "professional" | "playful";
export type VoiceGender = "female" | "male";

export interface AvailableVoiceInfo {
  name: string;
  lang: string;
  gender: VoiceGender;
  label: string;
}

export interface DogTtsState {
  isSpeaking: boolean;
  activeText: string;
  isMuted: boolean;
  autoSpeak: boolean;
  voiceMode: VoiceMode;
  gender: VoiceGender;
  pitch: number;
  rate: number;
  selectedVoiceName: string;
  availableVoices: AvailableVoiceInfo[];
}

const STORAGE_MUTED_KEY = "xmonks_dog_tts_muted_v1";
const STORAGE_AUTOSPEAK_KEY = "xmonks_dog_tts_autospeak_v1";
const STORAGE_VOICE_MODE_KEY = "xmonks_dog_tts_voice_mode_v1";
const STORAGE_GENDER_KEY = "xmonks_dog_tts_gender_v1";

class DogTtsEngine {
  private speech: Speech | null = null;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;
  private state: DogTtsState = {
    isSpeaking: false,
    activeText: "",
    isMuted: false,
    autoSpeak: false,
    voiceMode: "professional", // Default to Executive Professional voice!
    gender: "female",
    pitch: 1.0,
    rate: 0.98,
    selectedVoiceName: "",
    availableVoices: [],
  };
  private listeners: Set<(state: DogTtsState) => void> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedMuted = localStorage.getItem(STORAGE_MUTED_KEY);
        if (savedMuted !== null) {
          this.state.isMuted = savedMuted === "true";
        }
        const savedAuto = localStorage.getItem(STORAGE_AUTOSPEAK_KEY);
        if (savedAuto !== null) {
          this.state.autoSpeak = savedAuto === "true";
        }
        const savedMode = localStorage.getItem(STORAGE_VOICE_MODE_KEY) as VoiceMode | null;
        if (savedMode === "professional" || savedMode === "playful") {
          this.state.voiceMode = savedMode;
        }
        const savedGender = localStorage.getItem(STORAGE_GENDER_KEY) as VoiceGender | null;
        if (savedGender === "female" || savedGender === "male") {
          this.state.gender = savedGender;
        }
      } catch {
        // Sandboxed environments handled
      }
      this.updatePitchAndRate();
    }
  }

  private updatePitchAndRate() {
    if (this.state.voiceMode === "professional") {
      // Natural, mature, articulate executive cadence
      this.state.pitch = this.state.gender === "male" ? 0.95 : 1.0;
      this.state.rate = 0.98;
    } else {
      // Joyful, energetic puppy mascot
      this.state.pitch = 1.35;
      this.state.rate = 1.05;
    }
  }

  private getAudioCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Subtle executive briefing chime (for professional mode)
   */
  public playChime() {
    if (typeof window === "undefined" || this.state.isMuted) return;
    try {
      const ctx = this.getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      [880, 1108.73].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.06, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.32);
      });
    } catch {}
  }

  /**
   * Procedural cute bark / yelp synthesizer via Web Audio API (for playful mode)
   */
  public playBark(type: "bark" | "cheer" | "boing" | "whistle" = "bark") {
    if (typeof window === "undefined" || this.state.isMuted) return;
    try {
      const ctx = this.getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === "bark") {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(420, now);
        osc1.frequency.exponentialRampToValueAtTime(840, now + 0.08);
        osc1.frequency.exponentialRampToValueAtTime(560, now + 0.16);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.2);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(520, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(920, now + 0.22);
        gain2.gain.setValueAtTime(0.12, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.32);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.32);
      } else if (type === "boing") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      }
    } catch {}
  }

  /**
   * Initialize speak-tts library and resolve system natural voices
   */
  public async init(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (this.isInitialized && this.speech) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const speechInstance = new Speech();
        if (!speechInstance.hasBrowserSupport()) {
          console.warn("Browser does not support SpeechSynthesis");
          return false;
        }

        const data = await speechInstance.init({
          volume: 1,
          lang: "en-US",
          rate: this.state.rate,
          pitch: this.state.pitch,
          splitSentences: true,
        });

        this.speech = speechInstance;

        // Parse and catalog all available high-quality voices
        const rawVoices = data.voices || [];
        const englishVoices = rawVoices.filter((v) => v.lang.startsWith("en"));

        const available: AvailableVoiceInfo[] = englishVoices.map((v) => {
          const lower = v.name.toLowerCase();
          const isMale =
            lower.includes("guy") ||
            lower.includes("david") ||
            lower.includes("daniel") ||
            lower.includes("male") ||
            lower.includes("christopher") ||
            lower.includes("george");

          return {
            name: v.name,
            lang: v.lang,
            gender: isMale ? "male" : "female",
            label: v.name.replace(/Microsoft|Google|Online \(Natural\)|\(United States\)|\(United Kingdom\)/gi, "").trim(),
          };
        });

        this.state.availableVoices = available;
        this.selectBestVoice();

        this.isInitialized = true;
        this.notify();
        return true;
      } catch (err) {
        console.warn("speak-tts initialization notice, using native speech synthesis fallback:", err);
        this.isInitialized = true;
        return true;
      }
    })();

    return this.initPromise;
  }

  private selectBestVoice() {
    if (!this.speech) return;

    const voices = this.state.availableVoices;
    const isMale = this.state.gender === "male";

    // Priority lists for natural executive voices
    const preferredFemale = [
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Google UK English Female",
      "Google US English",
      "Samantha",
      "Victoria",
      "Karen",
      "Microsoft Zira - English (United States)",
    ];

    const preferredMale = [
      "Microsoft Guy Online (Natural) - English (United States)",
      "Microsoft Christopher Online (Natural) - English (United States)",
      "Google UK English Male",
      "Daniel",
      "Microsoft David - English (United States)",
    ];

    const targetList = isMale ? preferredMale : preferredFemale;

    let selected = voices.find((v) =>
      targetList.some((pref) => v.name.toLowerCase().includes(pref.toLowerCase()))
    );

    if (!selected) {
      selected = voices.find((v) => v.gender === this.state.gender);
    }
    if (!selected && voices.length > 0) {
      selected = voices[0];
    }

    if (selected) {
      this.speech.setVoice(selected.name);
      this.state.selectedVoiceName = selected.name;
    }
  }

  /**
   * Set voice mode: 'professional' (executive) vs 'playful' (mascot)
   */
  public setVoiceMode(mode: VoiceMode) {
    this.state.voiceMode = mode;
    this.updatePitchAndRate();
    if (this.speech) {
      this.speech.setPitch(this.state.pitch);
      this.speech.setRate(this.state.rate);
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_VOICE_MODE_KEY, mode);
      } catch {}
    }
    this.notify();
  }

  /**
   * Set voice gender: 'female' vs 'male'
   */
  public setGender(gender: VoiceGender) {
    this.state.gender = gender;
    this.updatePitchAndRate();
    this.selectBestVoice();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_GENDER_KEY, gender);
      } catch {}
    }
    this.notify();
  }

  /**
   * Toggle between professional and playful voice modes
   */
  public toggleVoiceMode(): VoiceMode {
    const newMode: VoiceMode = this.state.voiceMode === "professional" ? "playful" : "professional";
    this.setVoiceMode(newMode);
    return newMode;
  }

  /**
   * Speak arbitrary text
   */
  public async speak(
    text: string,
    options?: {
      soundCue?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): Promise<void> {
    if (typeof window === "undefined" || this.state.isMuted) return;
    if (!text || !text.trim()) return;

    // Clean text: strip emojis, currency noise, and extra markdown symbols
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/[*_#`~[\]]/g, "")
      .replace(/₹/g, "Rupees ")
      .trim();

    if (!cleanText) return;

    // Stop any existing playback
    this.stop();

    await this.init();

    // Sound cue before speaking: gentle crystal chime in professional mode, bark in playful mode
    if (options?.soundCue !== false) {
      if (this.state.voiceMode === "professional") {
        this.playChime();
        await new Promise((resolve) => setTimeout(resolve, 80));
      } else {
        this.playBark("bark");
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    }

    this.state.isSpeaking = true;
    this.state.activeText = text;
    this.notify();

    if (options?.onStart) options.onStart();

    const handleSpeechEnd = () => {
      this.state.isSpeaking = false;
      this.state.activeText = "";
      this.notify();
      if (options?.onEnd) options.onEnd();
    };

    try {
      this.updatePitchAndRate();

      if (this.speech && this.speech.hasBrowserSupport()) {
        this.speech.setPitch(this.state.pitch);
        this.speech.setRate(this.state.rate);

        await this.speech.speak({
          text: cleanText,
          queue: false,
          listeners: {
            onstart: () => {
              this.state.isSpeaking = true;
              this.notify();
            },
            onend: () => {
              handleSpeechEnd();
            },
            onresume: () => {
              this.state.isSpeaking = true;
              this.notify();
            },
          },
        });
      } else if (window.speechSynthesis) {
        // Native SpeechSynthesis Fallback
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.pitch = this.state.pitch;
        utterance.rate = this.state.rate;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find((v) => v.name === this.state.selectedVoiceName) || voices.find((v) => v.lang.startsWith("en"));
        if (enVoice) utterance.voice = enVoice;

        utterance.onend = () => handleSpeechEnd();
        utterance.onerror = () => handleSpeechEnd();

        window.speechSynthesis.speak(utterance);
      } else {
        handleSpeechEnd();
      }
    } catch (err) {
      console.warn("TTS playback error:", err);
      handleSpeechEnd();
    }
  }

  /**
   * Stop any active speech immediately
   */
  public stop(): void {
    if (typeof window === "undefined") return;

    try {
      if (this.speech) {
        this.speech.cancel();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {}

    this.state.isSpeaking = false;
    this.state.activeText = "";
    this.notify();
  }

  public toggleMute(): boolean {
    const newMuted = !this.state.isMuted;
    this.state.isMuted = newMuted;
    if (newMuted) {
      this.stop();
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_MUTED_KEY, String(newMuted));
      } catch {}
    }
    this.notify();
    return newMuted;
  }

  public toggleAutoSpeak(): boolean {
    const newAuto = !this.state.autoSpeak;
    this.state.autoSpeak = newAuto;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_AUTOSPEAK_KEY, String(newAuto));
      } catch {}
    }
    this.notify();
    return newAuto;
  }

  public getState(): DogTtsState {
    return { ...this.state };
  }

  public subscribe(listener: (state: DogTtsState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const curr = this.getState();
    this.listeners.forEach((l) => l(curr));
  }
}

// Global Singleton Instance
export const dogTtsService = new DogTtsEngine();
