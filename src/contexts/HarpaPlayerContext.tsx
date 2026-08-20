// ─────────────────────────────────────────────────────────────────────────────
// HarpaPlayerContext.tsx — Bíblia Vive
// Global singleton audio player for Harpa Cristã hymns.
// A single HTMLAudioElement lives in this provider so navigation between routes
// never destroys the audio — the element persists for the full app lifetime.
// ─────────────────────────────────────────────────────────────────────────────

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import hymnsData from '@/data/harpa-hymns.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HarpaPlayerState {
    hymnNumber: number | null;
    title: string;
    audioUrl: string;
    isPlaying: boolean;
    progress: number;      // 0–100
    duration: number;      // seconds
    volume: number;        // 0–1
    isMuted: boolean;
    loopMode: boolean;
    autoAdvance: boolean;
    error: boolean;
}

export interface PlayHymnPayload {
    hymnNumber: number;
    title: string;
    audioUrl: string;
}

interface HarpaPlayerContextValue {
    state: HarpaPlayerState;
    play: (hymn: PlayHymnPayload) => void;
    pause: () => void;
    resume: () => void;
    /** ratio: 0–1 */
    seek: (ratio: number) => void;
    setVolume: (v: number) => void;
    toggleMute: () => void;
    toggleLoop: () => void;
    toggleAutoAdvance: () => void;
    next: () => void;
    close: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: HarpaPlayerState = {
    hymnNumber: null,
    title: '',
    audioUrl: '',
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    loopMode: false,
    autoAdvance: false,
    error: false,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const HarpaPlayerContext = createContext<HarpaPlayerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function HarpaPlayerProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<HarpaPlayerState>(INITIAL_STATE);

    // Singleton audio element — never recreated
    const audioRef        = useRef<HTMLAudioElement | null>(null);
    const prevVolumeRef   = useRef(0.8);
    // Keep refs in sync so event handlers (attached once) always read fresh values
    const stateRef        = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // ── Helper: attach events to the singleton audio element ─────────────────
    const attachListeners = useCallback((audio: HTMLAudioElement) => {
        audio.onloadedmetadata = () => {
            setState(s => ({ ...s, duration: audio.duration }));
        };
        audio.ontimeupdate = () => {
            if (audio.duration > 0) {
                setState(s => ({ ...s, progress: (audio.currentTime / audio.duration) * 100 }));
            }
        };
        audio.onended = () => {
            const { autoAdvance, loopMode } = stateRef.current;
            // loopMode is handled natively by audio.loop — only handle autoAdvance here
            if (autoAdvance && !loopMode) {
                // advance() reads stateRef so it always has the latest hymnNumber
                advanceAudio();
                return;
            }
            if (!loopMode) {
                setState(s => ({ ...s, isPlaying: false, progress: 0 }));
                audio.currentTime = 0;
            }
        };
        audio.onerror = () => {
            setState(s => ({ ...s, error: true, isPlaying: false }));
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Helper: find next hymn with audio ────────────────────────────────────
    const findNextHymnWithAudio = useCallback((currentNumber: number): typeof hymnsData[0] | null => {
        const sorted = [...hymnsData]
            .filter(h => h.hasAudio && h.audioFile)
            .sort((a, b) => a.numero - b.numero);
        const idx = sorted.findIndex(h => h.numero === currentNumber);
        if (idx === -1 || idx === sorted.length - 1) return null;
        return sorted[idx + 1];
    }, []);

    // ── Helper: advance to next (used by onended + next action) ──────────────
    const advanceAudio = useCallback(() => {
        const { hymnNumber } = stateRef.current;
        if (hymnNumber === null) return;
        const nextHymn = findNextHymnWithAudio(hymnNumber);
        if (!nextHymn || !nextHymn.audioFile) {
            // Last hymn — stop
            const audio = audioRef.current;
            if (audio) { audio.pause(); audio.currentTime = 0; }
            setState(s => ({ ...s, isPlaying: false, progress: 0 }));
            return;
        }
        const baseUrl = import.meta.env.VITE_R2_AUDIO_URL as string;
        const nextUrl = `${baseUrl}/harpas/${encodeURIComponent(nextHymn.audioFile)}`;
        const audio = audioRef.current;
        if (!audio) return;
        audio.src = nextUrl;
        audio.currentTime = 0;
        audio.play().catch(() => setState(s => ({ ...s, error: true, isPlaying: false })));
        setState(s => ({
            ...s,
            hymnNumber: nextHymn.numero,
            title: nextHymn.tituloFormatado,
            audioUrl: nextUrl,
            isPlaying: true,
            progress: 0,
            duration: 0,
            error: false,
        }));
    }, [findNextHymnWithAudio]);

    // ── Ensure singleton audio exists ─────────────────────────────────────────
    const getOrCreateAudio = useCallback((): HTMLAudioElement => {
        if (!audioRef.current) {
            const audio = new Audio();
            audio.volume = stateRef.current.volume;
            audio.loop   = stateRef.current.loopMode;
            attachListeners(audio);
            audioRef.current = audio;
        }
        return audioRef.current;
    }, [attachListeners]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const play = useCallback((hymn: PlayHymnPayload) => {
        const { hymnNumber: current, isPlaying } = stateRef.current;

        // Toggle if same hymn already active
        if (hymn.hymnNumber === current) {
            const audio = audioRef.current;
            if (!audio) return;
            if (isPlaying) {
                audio.pause();
                setState(s => ({ ...s, isPlaying: false }));
            } else {
                audio.play().catch(() => setState(s => ({ ...s, error: true })));
                setState(s => ({ ...s, isPlaying: true }));
            }
            return;
        }

        // Switch to new hymn
        const audio = getOrCreateAudio();
        audio.pause();
        audio.src = hymn.audioUrl;
        audio.currentTime = 0;
        audio.loop = stateRef.current.loopMode;
        audio.play().catch(() => setState(s => ({ ...s, error: true, isPlaying: false })));

        setState(s => ({
            ...s,
            hymnNumber: hymn.hymnNumber,
            title: hymn.title,
            audioUrl: hymn.audioUrl,
            isPlaying: true,
            progress: 0,
            duration: 0,
            error: false,
        }));
    }, [getOrCreateAudio]);

    const pause = useCallback(() => {
        audioRef.current?.pause();
        setState(s => ({ ...s, isPlaying: false }));
    }, []);

    const resume = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.play().catch(() => setState(s => ({ ...s, error: true })));
        setState(s => ({ ...s, isPlaying: true }));
    }, []);

    const seek = useCallback((ratio: number) => {
        const audio = audioRef.current;
        if (!audio || audio.duration === 0) return;
        const clamped = Math.max(0, Math.min(1, ratio));
        audio.currentTime = clamped * audio.duration;
        setState(s => ({ ...s, progress: clamped * 100 }));
    }, []);

    const setVolume = useCallback((v: number) => {
        const clamped = Math.max(0, Math.min(1, v));
        if (audioRef.current) audioRef.current.volume = clamped;
        if (clamped > 0) prevVolumeRef.current = clamped;
        setState(s => ({ ...s, volume: clamped, isMuted: clamped === 0 }));
    }, []);

    const toggleMute = useCallback(() => {
        const { volume, isMuted } = stateRef.current;
        if (!isMuted && volume > 0) {
            prevVolumeRef.current = volume;
            if (audioRef.current) audioRef.current.volume = 0;
            setState(s => ({ ...s, volume: 0, isMuted: true }));
        } else {
            const restored = prevVolumeRef.current || 0.8;
            if (audioRef.current) audioRef.current.volume = restored;
            setState(s => ({ ...s, volume: restored, isMuted: false }));
        }
    }, []);

    const toggleLoop = useCallback(() => {
        setState(s => {
            const next = !s.loopMode;
            if (audioRef.current) audioRef.current.loop = next;
            return { ...s, loopMode: next, autoAdvance: next ? false : s.autoAdvance };
        });
    }, []);

    const toggleAutoAdvance = useCallback(() => {
        setState(s => ({
            ...s,
            autoAdvance: !s.autoAdvance,
            loopMode: !s.autoAdvance ? false : s.loopMode,
        }));
    }, []);

    const next = useCallback(() => {
        advanceAudio();
    }, [advanceAudio]);

    const close = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.src = '';
        }
        setState(INITIAL_STATE);
    }, []);

    // ─── Context value ────────────────────────────────────────────────────────

    const value: HarpaPlayerContextValue = {
        state,
        play,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        toggleLoop,
        toggleAutoAdvance,
        next,
        close,
    };

    return (
        <HarpaPlayerContext.Provider value={value}>
            {children}
        </HarpaPlayerContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHarpaPlayer(): HarpaPlayerContextValue {
    const ctx = useContext(HarpaPlayerContext);
    if (!ctx) throw new Error('useHarpaPlayer must be used inside HarpaPlayerProvider');
    return ctx;
}
