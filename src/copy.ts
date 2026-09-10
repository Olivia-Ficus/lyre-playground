import type { DiscoveryState } from './discovery';

export const COPY: Record<DiscoveryState, { prompt: string; supporting?: string; explanation?: string; invitation?: string }> = {
  ARRIVAL: { prompt: 'Play something.', supporting: 'There is no wrong note.' },
  FREE_PLAY: { prompt: 'Play something.', supporting: 'There is no wrong note.' },
  FIVE_NOTE_PLAY: { prompt: 'Now try only these five.', supporting: 'Any order. Any rhythm.' },
  NOTICE: { prompt: 'Notice anything?' },
  DISCOVER: {
    prompt: 'You just found a pentatonic scale.',
    explanation: 'Five notes that naturally leave a lot of room to play.',
    invitation: 'Keep playing for a moment.',
  },
  CONTINUE_INTENT: {
    prompt: 'You just found a pentatonic scale.',
    explanation: 'Five notes that naturally leave a lot of room to play.',
    invitation: 'Keep playing for a moment.',
  },
  END: { prompt: 'More discoveries coming soon.', explanation: 'You found your first sound.' },
};
export const NOTICE_SUPPORTING = 'Try mixing them again.';
export const CTA = 'Discover another sound';
export const CTA_SUPPORTING = 'There are many more ways to change how these seven strings feel.';
export const AUDIO_UNAVAILABLE = 'Sound is unavailable. Touch a string to try enabling audio.';
