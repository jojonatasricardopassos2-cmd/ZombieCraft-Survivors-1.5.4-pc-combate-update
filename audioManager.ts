let isInitialized = false;
const audioElements = new Map<string, HTMLAudioElement>();
const activeLoops = new Map<string, HTMLAudioElement>();

// This function must be called after a user interaction
export function initAudioManager() {
    if (isInitialized) return;
    try {
        // A simple way to unlock audio on modern browsers
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (context.state === 'suspended') {
            context.resume();
        }
        isInitialized = true;
        console.log("Audio Manager Initialized.");
    } catch (e) {
        console.error("Could not initialize Audio Context:", e);
    }
}

function getAudioElement(src: string): HTMLAudioElement {
    if (audioElements.has(src)) {
        const audio = audioElements.get(src)!;
        audio.currentTime = 0; // Rewind before playing again
        return audio;
    }
    const audio = new Audio(src);
    audioElements.set(src, audio);
    return audio;
}

interface PlaySoundOptions {
    volume?: number;
    loop?: boolean;
    id?: string;
}

export function playSound(src: string, options: PlaySoundOptions = {}) {
    if (!isInitialized) return;

    const { volume = 1.0, loop = false, id = src } = options;

    if (loop && activeLoops.has(id)) {
        const existingAudio = activeLoops.get(id);
        if (existingAudio && !existingAudio.paused) {
             return; // Already playing
        }
    }
    
    const audio = getAudioElement(src);
    audio.volume = volume;
    audio.loop = loop;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => console.error(`Error playing sound: ${src}`, e));
    }

    if (loop) {
        activeLoops.set(id, audio);
    }
}

export function stopSound(id: string) {
    if (activeLoops.has(id)) {
        const audio = activeLoops.get(id)!;
        audio.pause();
        audio.currentTime = 0;
        activeLoops.delete(id);
    }
}

export function stopAllSounds() {
    activeLoops.forEach((audio, id) => {
        audio.pause();
        audio.currentTime = 0;
    });
    activeLoops.clear();
     audioElements.forEach(audio => {
        if (!audio.loop) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}
