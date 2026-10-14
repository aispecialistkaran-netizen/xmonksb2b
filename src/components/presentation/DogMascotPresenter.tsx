"use client";

import React, { useEffect, useRef, useState } from "react";
import lottie, { AnimationItem } from "lottie-web";
import { Volume2, VolumeX, Sparkles, Heart, Music, Flame, Zap } from "lucide-react";
import { useDogTts } from "@/hooks/useDogTts";

export type DogMascotMood =
  | "idle"
  | "speaking"
  | "walking"
  | "celebrating"
  | "proud"
  | "dancing"
  | "jumping"
  | "spinning";

interface DogMascotPresenterProps {
  speech: string;
  mood?: DogMascotMood;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onTreatGiven?: () => void;
  onJump?: () => void;
  onDance?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  autoReadAloud?: boolean;
}

/**
 * Procedural cute audio synthesizer (friendly bark, boing jump, dance groove & cheer chime)
 * via Web Audio API. 100% offline, zero asset latency.
 */
export function playProceduralBark(type: "bark" | "cheer" | "boing" | "dance" | "flip" | "whistle" = "bark") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === "bark") {
      // Warm playful double-yelp chirp
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(380, now);
      osc1.frequency.exponentialRampToValueAtTime(760, now + 0.08);
      osc1.frequency.exponentialRampToValueAtTime(520, now + 0.16);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(450, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(820, now + 0.22);
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.32);
    } else if (type === "boing") {
      // Springy jumping sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === "dance") {
      // Funky energetic 5-note dance arpeggio groove
      [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.16, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.16);
      });
    } else if (type === "flip") {
      // Swooshing acrobatic pitch ramp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(1300, now + 0.26);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "cheer") {
      // Fanfare arpeggio for stage wins / 100% closure
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    }
  } catch {
    // Audio autoplay restrictions gracefully handled
  }
}

export const DogMascotPresenter: React.FC<DogMascotPresenterProps> = ({
  speech,
  mood = "speaking",
  soundEnabled = true,
  onToggleSound,
  onTreatGiven,
  onJump,
  onDance,
  className = "",
  size = "md",
  autoReadAloud = false,
}) => {
  const dogContainerRef = useRef<HTMLDivElement>(null);
  const animInstanceRef = useRef<AnimationItem | null>(null);

  // Open-source TTS Engine hook for Monk Pup Presenter
  const { isSpeaking, voiceMode, speak, stop, toggleVoiceMode } = useDogTts();

  // If autoReadAloud is enabled, speak slide speech when it changes
  useEffect(() => {
    if (autoReadAloud && soundEnabled && speech) {
      speak(speech);
    }
  }, [speech, autoReadAloud, soundEnabled, speak]);

  const [bonesCount, setBonesCount] = useState<number>(0);
  const [floatingParticles, setFloatingParticles] = useState<
    { id: number; symbol: string; x: number; y: number }[]
  >([]);

  // Active trick state: controls dynamic jumping, dancing, or backflipping
  const [activeTrick, setActiveTrick] = useState<"none" | "jumping" | "dancing" | "spinning">("none");

  // Effective mood combines props + active trick + TTS speaking
  const effectiveMood: DogMascotMood =
    activeTrick === "jumping"
      ? "jumping"
      : activeTrick === "dancing"
      ? "dancing"
      : activeTrick === "spinning"
      ? "spinning"
      : isSpeaking
      ? "speaking"
      : mood;

  // Load the cute doggie Lottie animation
  useEffect(() => {
    let isCancelled = false;

    fetch("/Cute%20Doggie.json")
      .then((res) => res.json())
      .then((animationData) => {
        if (!isCancelled && dogContainerRef.current) {
          if (animInstanceRef.current) {
            animInstanceRef.current.destroy();
          }
          animInstanceRef.current = lottie.loadAnimation({
            container: dogContainerRef.current,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData,
          });
          animInstanceRef.current.setSpeed(1.1);
        }
      })
      .catch((err) => {
        console.warn("Could not load Cute Doggie.json:", err);
      });

    return () => {
      isCancelled = true;
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
        animInstanceRef.current = null;
      }
    };
  }, []);

  // Update animation speed and loop based on effective mood
  useEffect(() => {
    if (animInstanceRef.current) {
      if (effectiveMood === "dancing") {
        animInstanceRef.current.setSpeed(1.8);
      } else if (effectiveMood === "jumping") {
        animInstanceRef.current.setSpeed(2.0);
      } else if (effectiveMood === "spinning") {
        animInstanceRef.current.setSpeed(2.2);
      } else if (effectiveMood === "celebrating") {
        animInstanceRef.current.setSpeed(1.6);
      } else if (effectiveMood === "walking") {
        animInstanceRef.current.setSpeed(1.4);
      } else {
        animInstanceRef.current.setSpeed(0.95);
      }
    }
  }, [effectiveMood]);

  // Give a treat action
  const handleGiveTreat = () => {
    setBonesCount((prev) => prev + 1);
    const newParticle = {
      id: Date.now() + Math.random(),
      symbol: "🦴",
      x: Math.floor(Math.random() * 40) - 20,
      y: -15,
    };
    setFloatingParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1200);

    if (soundEnabled) {
      playProceduralBark("bark");
    }
    if (onTreatGiven) {
      onTreatGiven();
    }
  };

  // Jump trick action
  const handleJump = () => {
    setActiveTrick("jumping");
    if (soundEnabled) {
      playProceduralBark("boing");
    }

    // Spawn paw prints
    [ -15, 15 ].forEach((xOffset, i) => {
      setTimeout(() => {
        const paw = {
          id: Date.now() + Math.random(),
          symbol: "🐾",
          x: xOffset,
          y: -30,
        };
        setFloatingParticles((prev) => [...prev, paw]);
        setTimeout(() => {
          setFloatingParticles((prev) => prev.filter((p) => p.id !== paw.id));
        }, 1200);
      }, i * 150);
    });

    if (onJump) onJump();

    setTimeout(() => {
      setActiveTrick("none");
    }, 1300);
  };

  // Dance trick action
  const handleDance = () => {
    setActiveTrick("dancing");
    if (soundEnabled) {
      playProceduralBark("dance");
    }

    // Spawn music notes
    const notes = ["🎵", "🎶", "🎷", "✨", "🎵"];
    notes.forEach((note, idx) => {
      setTimeout(() => {
        const particle = {
          id: Date.now() + Math.random(),
          symbol: note,
          x: (idx - 2) * 18,
          y: -25,
        };
        setFloatingParticles((prev) => [...prev, particle]);
        setTimeout(() => {
          setFloatingParticles((prev) => prev.filter((p) => p.id !== particle.id));
        }, 1500);
      }, idx * 250);
    });

    if (onDance) onDance();

    setTimeout(() => {
      setActiveTrick("none");
    }, 3200);
  };

  // Backflip trick action
  const handleSpinFlip = () => {
    setActiveTrick("spinning");
    if (soundEnabled) {
      playProceduralBark("flip");
    }

    // Spawn stars
    ["⭐", "🌟", "💫"].forEach((star, idx) => {
      setTimeout(() => {
        const particle = {
          id: Date.now() + Math.random(),
          symbol: star,
          x: (idx - 1) * 22,
          y: -40,
        };
        setFloatingParticles((prev) => [...prev, particle]);
        setTimeout(() => {
          setFloatingParticles((prev) => prev.filter((p) => p.id !== particle.id));
        }, 1200);
      }, idx * 120);
    });

    setTimeout(() => {
      setActiveTrick("none");
    }, 1200);
  };

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28 sm:w-32 sm:h-32",
    lg: "w-36 h-36 sm:w-44 sm:h-44",
  };

  return (
    <div className={`relative flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 select-none ${className}`}>
      {/* Inline styles for dog dancing and jumping animations */}
      <style jsx>{`
        @keyframes doggyDanceAnim {
          0%, 100% {
            transform: scaleX(-1) translateY(0) rotate(0deg);
          }
          15% {
            transform: scaleX(-1) translateY(-14px) rotate(-10deg) scale(1.08);
          }
          30% {
            transform: scaleX(-1) translateY(0) rotate(8deg) scale(0.96);
          }
          45% {
            transform: scaleX(-1) translateY(-16px) rotate(-8deg) scale(1.08);
          }
          60% {
            transform: scaleX(-1) translateY(0) rotate(10deg) scale(0.96);
          }
          75% {
            transform: scaleX(-1) translateY(-10px) rotate(-4deg) scale(1.04);
          }
        }

        @keyframes doggyJumpAnim {
          0% {
            transform: scaleX(-1) translateY(0) scale(1, 1);
          }
          20% {
            transform: scaleX(-1) translateY(8px) scale(1.15, 0.85);
          }
          50% {
            transform: scaleX(-1) translateY(-85px) scale(0.95, 1.15) rotate(10deg);
          }
          75% {
            transform: scaleX(-1) translateY(-25px) scale(1.05, 0.95);
          }
          90% {
            transform: scaleX(-1) translateY(4px) scale(1.12, 0.9);
          }
          100% {
            transform: scaleX(-1) translateY(0) scale(1, 1);
          }
        }

        @keyframes doggySpinAnim {
          0% {
            transform: scaleX(-1) translateY(0) rotate(0deg);
          }
          40% {
            transform: scaleX(-1) translateY(-70px) rotate(180deg) scale(1.15);
          }
          80% {
            transform: scaleX(-1) translateY(-15px) rotate(360deg) scale(1.05);
          }
          100% {
            transform: scaleX(-1) translateY(0) rotate(360deg);
          }
        }

        @keyframes particleFloatUp {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-15px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-70px) scale(1);
          }
        }

        .dog-dance {
          animation: doggyDanceAnim 0.75s ease-in-out infinite !important;
        }

        .dog-jump {
          animation: doggyJumpAnim 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards !important;
        }

        .dog-spin {
          animation: doggySpinAnim 1.0s cubic-bezier(0.2, 0.8, 0.3, 1) forwards !important;
        }

        .floating-particle {
          animation: particleFloatUp 1.2s ease-out forwards;
        }
      `}</style>

      {/* Dog Animation Box */}
      <div className="relative flex-shrink-0 group flex flex-col items-center">
        {/* Floating particles (bones, music notes, paws, stars) */}
        {floatingParticles.map((p) => (
          <div
            key={p.id}
            className="absolute text-xl pointer-events-none floating-particle z-30"
            style={{
              left: `calc(50% + ${p.x}px)`,
              top: `${p.y}px`,
            }}
          >
            {p.symbol}
          </div>
        ))}

        {/* Ambient Halo / Disco Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-xl scale-125 pointer-events-none transition-all duration-500 ${
            effectiveMood === "dancing"
              ? "bg-gradient-to-r from-pink-500/40 via-amber-400/40 to-indigo-500/40 animate-pulse scale-150"
              : effectiveMood === "jumping"
              ? "bg-gradient-to-t from-emerald-400/40 to-amber-400/40 scale-140"
              : "bg-gradient-to-tr from-amber-400/20 via-emerald-400/20 to-indigo-500/20"
          }`}
        />

        {/* Lottie Container */}
        <div
          ref={dogContainerRef}
          className={`${sizeClasses[size]} relative z-10 transition-transform duration-300 ${
            effectiveMood === "dancing"
              ? "dog-dance"
              : effectiveMood === "jumping"
              ? "dog-jump"
              : effectiveMood === "spinning"
              ? "dog-spin"
              : effectiveMood === "celebrating"
              ? "scale-110"
              : ""
          }`}
          style={{ transform: "scaleX(-1)" }} // Face towards the speech bubble
          title="Monk Pup – Click Jump or Dance to entertain the board!"
        />

        {/* Interactive Action Badges (Treat, Jump, Dance, Flip) */}
        <div className="relative -mt-2 z-20 flex items-center gap-1.5 flex-wrap justify-center max-w-[280px]">
          {/* 1. Treat Button */}
          <button
            type="button"
            onClick={handleGiveTreat}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer border border-amber-300/40"
            title="Reward Monk Pup with a Bone!"
          >
            <span>🦴</span>
            <span>{bonesCount > 0 ? `${bonesCount}` : "Treat"}</span>
          </button>

          {/* 2. Jump Trick Button */}
          <button
            type="button"
            onClick={handleJump}
            className={`px-2.5 py-1 rounded-full text-white text-[10px] font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer border ${
              activeTrick === "jumping"
                ? "bg-emerald-600 border-white ring-2 ring-emerald-400/50 scale-105"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300/40"
            }`}
            title="Make Monk Pup Leap & Hop!"
          >
            <span>🦘</span>
            <span>Jump!</span>
          </button>

          {/* 3. Dance Trick Button */}
          <button
            type="button"
            onClick={handleDance}
            className={`px-2.5 py-1 rounded-full text-white text-[10px] font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer border ${
              activeTrick === "dancing"
                ? "bg-pink-600 border-white ring-2 ring-pink-400/50 scale-105 animate-bounce"
                : "bg-gradient-to-r from-pink-500 to-rose-600 border-pink-300/40"
            }`}
            title="Make Monk Pup Groove & Dance!"
          >
            <Music className="w-2.5 h-2.5" />
            <span>Dance!</span>
          </button>

          {/* 4. Flip Trick Button */}
          <button
            type="button"
            onClick={handleSpinFlip}
            className="px-2 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer border border-indigo-300/40"
            title="Acrobatic Backflip Somersault!"
          >
            <span>🤸</span>
            <span>Flip</span>
          </button>
        </div>
      </div>

      {/* Comic Speech Bubble */}
      <div className="flex-1 relative z-20 max-w-2xl w-full">
        <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/80 shadow-xl shadow-amber-500/10">
          {/* Bubble Pointer Triangle */}
          <div
            className="hidden sm:block absolute bottom-4 -left-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-12 border-r-white dark:border-r-slate-900 z-10"
            style={{ filter: "drop-shadow(-2px 0 0 rgba(245, 158, 11, 0.8))" }}
          />

          {/* Mascot Tag Header */}
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span>{voiceMode === "professional" ? "Executive Presenter (Pro Voice)" : "Monk Pup • Host"}</span>
                {isSpeaking ? (
                  <span className="flex items-center gap-0.5 ml-1">
                    <span className="w-0.5 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-amber-500 rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-amber-500 rounded-full animate-pulse delay-150" />
                  </span>
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-500" />
                )}
              </span>
              {activeTrick === "dancing" && (
                <span className="px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[9px] font-black animate-pulse">
                  🎵 Disco Party Mode!
                </span>
              )}
              {activeTrick === "jumping" && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">
                  🦘 High Leap!
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Professional vs Playful Voice Toggle */}
              <button
                type="button"
                onClick={toggleVoiceMode}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black transition cursor-pointer active:scale-95 border ${
                  voiceMode === "professional"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-400 shadow-xs ring-1 ring-indigo-400/30"
                    : "bg-amber-500 hover:bg-amber-600 text-white border-amber-300 shadow-xs"
                }`}
                title={`Switch Voice Style: Currently ${voiceMode === "professional" ? "Executive Professional Boardroom Voice" : "Playful Puppy Mascot Voice"}`}
              >
                <span>{voiceMode === "professional" ? "🎙️ Pro Voice" : "🐶 Pup Voice"}</span>
              </button>

              {/* Dog TTS Read Aloud / Stop Button */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stop();
                  } else {
                    speak(speech);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black transition cursor-pointer active:scale-95 border ${
                  isSpeaking
                    ? "bg-rose-500 text-white border-rose-300 animate-pulse shadow-md"
                    : "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border-amber-300/60"
                }`}
                title={isSpeaking ? "Click to stop speaking" : "Hear narrative spoken aloud"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3 h-3 text-white" />
                    <span className="flex items-center gap-0.5">
                      <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                      <span className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-75" />
                      <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse delay-150" />
                    </span>
                    <span>Speaking...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>

              {onToggleSound && (
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title={soundEnabled ? "Mute Mascot Sounds" : "Enable Mascot Audio"}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Speech Text */}
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
            {speech}
          </p>
        </div>
      </div>
    </div>
  );
};
