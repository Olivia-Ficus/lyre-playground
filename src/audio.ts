import { frequencyFor, type StringId } from './instrument';

// A short locally synthesized pluck. No network assets, worklet, or audio library.
export function synthesizePluck(frequency: number, sampleRate: number): Float32Array<ArrayBuffer> {
  const samples = new Float32Array(Math.ceil(sampleRate * 3));
  const period = sampleRate / frequency;
  // The two-point damping filter contributes half a sample of delay.
  const delay = Math.floor(period - 0.5);
  const fraction = period - 0.5 - delay;
  let seed = Math.round(frequency * 1000);
  for (let i = 0; i <= delay + 1; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    samples[i] = (seed / 4294967296 * 2 - 1) * 0.8;
  }
  for (let i = delay + 2; i < samples.length; i++) {
    const first = samples[i - delay] * (1 - fraction) + samples[i - delay - 1] * fraction;
    const second = samples[i - delay - 1] * (1 - fraction) + samples[i - delay - 2] * fraction;
    samples[i] = (first + second) * 0.5 * 0.996;
  }
  // Remove DC, fade the excitation edge, and end at zero without a truncation click.
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const attack = sampleRate * 0.0015;
  const release = sampleRate * 0.1;
  for (let i = 0; i < samples.length; i++) {
    samples[i] = (samples[i] - mean) * Math.min(1, i / attack) * Math.min(1, (samples.length - 1 - i) / release);
  }
  return samples;
}

export function createAudioEngine() {
  let context: AudioContext | null = null;
  let output: GainNode | null = null;
  let compressor: DynamicsCompressorNode | null = null;
  let resuming: Promise<void> | null = null;
  const buffers = new Map<StringId, AudioBuffer>();
  const voices = new Set<AudioBufferSourceNode>();
  function ensureContext() {
    if (context && context.state !== 'closed') return context;
    const Audio = window.AudioContext;
    if (!Audio) throw new Error('Web Audio unavailable');
    context = new Audio({ latencyHint: 'interactive' });
    output = context.createGain();
    output.gain.value = 0.65;
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -15;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    output.connect(compressor);
    compressor.connect(context.destination);
    return context;
  }
  function schedule(id: StringId, active: AudioContext): boolean {
    if (context !== active || active.state !== 'running' || !output) return false;
    let buffer = buffers.get(id);
    if (!buffer) {
      const samples = synthesizePluck(frequencyFor(id), active.sampleRate);
      buffer = active.createBuffer(1, samples.length, active.sampleRate);
      buffer.copyToChannel(samples, 0);
      buffers.set(id, buffer);
    }
    const voice = active.createBufferSource();
    voice.buffer = buffer;
    voice.connect(output);
    voice.onended = () => { voice.disconnect(); voices.delete(voice); };
    voice.start(active.currentTime);
    voices.add(voice);
    return true;
  }
  function play(id: StringId): boolean | Promise<boolean> {
    try {
      const active = ensureContext();
      if (active.state === 'running') return schedule(id, active);
      // Called in the gesture stack, not from a React effect or delayed task.
      if (!resuming) {
        const resume = active.resume();
        resuming = resume.finally(() => { resuming = null; });
      }
      return resuming.then(() => schedule(id, active)).catch(() => false);
    } catch { return false; }
  }
  function dispose() {
    for (const voice of voices) { voice.onended = null; voice.stop(); voice.disconnect(); }
    voices.clear();
    buffers.clear();
    output?.disconnect();
    compressor?.disconnect();
    if (context && context.state !== 'closed') void context.close().catch(() => {});
    context = null;
    output = null;
    compressor = null;
    resuming = null;
  }
  return { play, dispose };
}
