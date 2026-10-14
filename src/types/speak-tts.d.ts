/**
 * Type declarations for 'speak-tts' (Tom S. open-source GitHub repository)
 * https://github.com/tom-s/speak-tts
 */

declare module "speak-tts" {
  export interface SpeakListeners {
    onstart?: () => void;
    onend?: () => void;
    onresume?: () => void;
    onboundary?: (event: SpeechSynthesisEvent) => void;
  }

  export interface SpeakOptions {
    text: string;
    queue?: boolean;
    listeners?: SpeakListeners;
  }

  export interface InitOptions {
    volume?: number;
    lang?: string;
    rate?: number;
    pitch?: number;
    voice?: string;
    splitSentences?: boolean;
    listeners?: {
      onvoiceschanged?: (voices: SpeechSynthesisVoice[]) => void;
    };
  }

  export interface InitResponse {
    voices: SpeechSynthesisVoice[];
  }

  export default class Speech {
    constructor();
    init(options?: InitOptions): Promise<InitResponse>;
    hasBrowserSupport(): boolean;
    setVoice(voice: string): void;
    setLanguage(lang: string): void;
    setVolume(volume: number): void;
    setRate(rate: number): void;
    setPitch(pitch: number): void;
    setSplitSentences(split: boolean): void;
    speak(options: SpeakOptions): Promise<void>;
    pending(): boolean;
    paused(): boolean;
    speaking(): boolean;
    pause(): void;
    resume(): void;
    cancel(): void;
  }
}
