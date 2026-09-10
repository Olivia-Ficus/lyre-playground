import { describe, expect, it } from 'vitest';
import { synthesizePluck } from '../src/audio';
import { frequencyFor, STRINGS } from '../src/instrument';

function rms(samples: Float32Array, from: number, to: number) {
  let energy = 0;
  for (let i = from; i < to; i++) energy += samples[i] ** 2;
  return Math.sqrt(energy / (to - from));
}

describe('synthesized pluck signals', () => {
  for (const sampleRate of [44100, 48000]) {
    it(`produces finite, naturally decaying pitched buffers at ${sampleRate}Hz`, () => {
      for (const { id } of STRINGS) {
        const frequency = frequencyFor(id);
        const samples = synthesizePluck(frequency, sampleRate);
        expect(samples.length).toBe(sampleRate * 3);
        expect(samples.every(Number.isFinite)).toBe(true);
        expect(Math.abs(samples[0])).toBe(0);
        expect(Math.abs(samples.at(-1)!)).toBe(0);
        expect(rms(samples, sampleRate * 2, sampleRate * 2.5)).toBeLessThan(rms(samples, sampleRate * 0.1, sampleRate * 0.5) * 0.25);
        // Estimate period via autocorrelation near the desired fundamental.
        const period = sampleRate / frequency;
        let bestLag = 0;
        let best = -Infinity;
        for (let lag = Math.floor(period * 0.9); lag <= Math.ceil(period * 1.1); lag++) {
          let correlation = 0;
          for (let i = Math.floor(sampleRate * 0.15); i < sampleRate * 0.3; i++) correlation += samples[i] * samples[i + lag];
          if (correlation > best) { best = correlation; bestLag = lag; }
        }
        expect(Math.abs(1200 * Math.log2((sampleRate / bestLag) / frequency))).toBeLessThan(15);
      }
    });
  }
});
