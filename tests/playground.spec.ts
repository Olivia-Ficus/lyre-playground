import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const state = (page: Page) => page.locator('main');
async function pluck(page: Page, ids: number[]) {
  for (const id of ids) {
    const target = page.getByRole('button', { name: `String ${id + 1}`, exact: true });
    if (test.info().project.name === 'mobile') await target.tap();
    else await target.click();
  }
}
async function open(page: Page) {
  await page.goto('/');
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'ARRIVAL');
  await expect(page.getByRole('button')).toHaveCount(7);
}
async function noTheory(page: Page) {
  await expect(page.locator('body')).not.toContainText(/pentatonic|five-note scale/i);
}

test('complete Goal Funnel, exact copy, immutable asset, event order and persistent End instrument', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await expect(page.getByRole('heading')).toHaveText('Play something.');
  await expect(page.getByText('There is no wrong note.')).toBeVisible();
  await noTheory(page);
  await pluck(page, [0]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'FREE_PLAY');
  await pluck(page, [1, 2]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'FIVE_NOTE_PLAY');
  await expect(page.getByRole('heading')).toHaveText('Now try only these five.');
  await expect(page.locator('[data-tone="highlighted"]')).toHaveCount(5);
  await expect(page.locator('[data-tone="muted"]')).toHaveCount(2);
  await noTheory(page);
  await pluck(page, [0, 1, 2, 0, 1]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'NOTICE');
  await expect(page.getByRole('heading')).toHaveText('Notice anything?');
  await noTheory(page);
  await expect(page.getByText('Try mixing them again.')).toBeVisible({ timeout: 3000 });
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'NOTICE');
  await pluck(page, [0, 4, 5]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'DISCOVER');
  await expect(page.getByRole('heading')).toHaveText('You just found a pentatonic scale.');
  await expect(page.getByText('Five notes that naturally leave a lot of room to play.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Discover another sound' })).toHaveCount(0);
  await pluck(page, [3]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'DISCOVER');
  await pluck(page, [6]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'CONTINUE_INTENT');
  await expect(page.getByText('There are many more ways to change how these seven strings feel.')).toBeVisible();
  expect(await page.evaluate(() => window.lyreDebug.events().some(e => e.event === 'discover_another_clicked'))).toBe(false);
  const cta = page.getByRole('button', { name: 'Discover another sound' });
  if (test.info().project.name === 'mobile') await cta.tap(); else await cta.click();
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'END');
  await expect(page.getByRole('heading')).toHaveText('More discoveries coming soon.');
  await expect(page.getByText('You found your first sound.')).toBeVisible();
  await expect(cta).toHaveCount(0);
  await pluck(page, [0, 1, 2, 3, 4, 5, 6]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'END');
  const events = await page.evaluate(() => window.lyreDebug.events());
  expect(events.filter(e => e.event !== 'string_played').map(e => e.event)).toEqual([
    'session_started', 'first_string_played', 'discovery_started', 'five_note_exploration_completed', 'discovery_completed', 'discover_another_shown', 'discover_another_clicked',
  ]);
  const notes = events.filter(e => e.event === 'string_played');
  expect(notes).toHaveLength(20);
  expect(notes.map(e => e.discovery_state)).toEqual([
    'ARRIVAL', 'FREE_PLAY', 'FREE_PLAY', ...Array(5).fill('FIVE_NOTE_PLAY'), ...Array(3).fill('NOTICE'), ...Array(2).fill('DISCOVER'), ...Array(7).fill('END'),
  ]);
  expect(notes.slice(-7).map(e => e.pitch)).toEqual(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5']);
  expect(events.map(e => e.sequence)).toEqual(events.map((_, i) => i + 1));
  expect(new Set(events.map(e => e.session_id)).size).toBe(1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(`lyre-playground:events:${window.lyreDebug.events()[0].session_id}`)!));
  expect(saved.filter((e: { event: string }) => e.event === 'discover_another_clicked')).toHaveLength(1);
  await expect(page.locator('nav, aside, [role="progressbar"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/\b(correct|score|failed|try again)\b/i);
  expect(errors).toEqual([]);
});

test('insufficient unique exploration and de-emphasized plucks never cause a premature reveal', async ({ page }) => {
  await open(page);
  await pluck(page, [0, 1, 2]);
  await pluck(page, [0, 1, 0, 1, 0, 3, 6]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'FIVE_NOTE_PLAY');
  await noTheory(page);
  await pluck(page, [2]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'NOTICE');
  await pluck(page, [3, 6, 0, 1]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'NOTICE');
  await noTheory(page);
  await pluck(page, [5]);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'DISCOVER');
  await expect(page.getByText('Try mixing them again.')).toHaveCount(0);
});

test('asset is unmodified, overlay shares its bounds, strings attach and hit areas stay fixed', async ({ page }) => {
  await open(page);
  const asset = await page.locator('.lyre-body').getAttribute('src');
  const response = await page.request.get(asset!);
  const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
  expect(hash(readFileSync('src/assets/lyre-body.png'))).toBe('bf4fa6c6162445ee4753908a1379ca70b0105974516736cb6782342444df8aa9');
  expect(hash(await response.body())).toBe(hash(readFileSync('src/assets/lyre-body.png')));
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const img = await page.locator('.lyre-body').boundingBox();
    const svg = await page.locator('.lyre-overlay').boundingBox();
    expect(img).toEqual(svg);
    expect(img!.width / img!.height).toBeCloseTo(1122 / 1402, 3);
    expect(img!.x).toBeGreaterThanOrEqual(0);
    expect(img!.x + img!.width).toBeLessThanOrEqual(width);
    const prompt = await page.locator('.prompt').boundingBox();
    const feedback = await page.locator('.feedback').boundingBox();
    expect(prompt!.y + prompt!.height).toBeLessThanOrEqual(img!.y + 1);
    expect(feedback!.y).toBeGreaterThanOrEqual(img!.y + img!.height);
  }
  await expect(page.locator('.lyre-overlay path')).toHaveCount(7);
  await expect(page.locator('.lyre-overlay rect')).toHaveCount(7);
  const hit = page.getByRole('button', { name: 'String 1', exact: true });
  const before = await hit.boundingBox();
  await pluck(page, [0]);
  await expect(page.locator('[data-string-id="0"] path')).toHaveAttribute('data-revision', '1');
  expect(await hit.boundingBox()).toEqual(before);
  await expect(page.locator('[data-string-id="1"] path')).toHaveAttribute('data-revision', '0');
  await expect(page.locator('[data-string-id="0"] path')).toHaveAttribute('d', 'M 410 180 Q 410 659 410 1138');
  await pluck(page, [0]);
  await expect(page.locator('[data-string-id="0"] path')).toHaveAttribute('data-revision', '2');
  expect(await hit.boundingBox()).toEqual(before);
});

test('keyboard plays once per activation and reload starts a new session', async ({ page }) => {
  await open(page);
  const oldSession = await page.evaluate(() => window.lyreDebug.events()[0].session_id);
  await page.getByRole('button', { name: 'String 1', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'String 2', exact: true }).press('Space');
  expect((await page.evaluate(() => window.lyreDebug.events())).filter(e => e.event === 'string_played')).toHaveLength(2);
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'FREE_PLAY');
  await page.reload();
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'ARRIVAL');
  expect(await page.evaluate(() => window.lyreDebug.events()[0].session_id)).not.toBe(oldSession);
  expect(await page.evaluate(() => window.lyreDebug.events())).toHaveLength(1);
});

test('audio failure does not advance Discovery', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true }); });
  await open(page);
  await pluck(page, [0]);
  await expect(page.getByRole('status')).toContainText('Sound is unavailable.');
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'ARRIVAL');
  expect(await page.evaluate(() => window.lyreDebug.events())).toHaveLength(1);
});

test('unavailable localStorage retains a complete in-memory funnel', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Unavailable storage'); } });
  });
  await open(page);
  await pluck(page, [0, 1, 2, 0, 1, 2, 0, 1, 0, 4, 5, 3, 6]);
  await page.getByRole('button', { name: 'Discover another sound' }).click();
  await expect(state(page)).toHaveAttribute('data-discovery-state', 'END');
  expect(await page.evaluate(() => window.lyreDebug.storage())).toBe('memory');
  expect((await page.evaluate(() => window.lyreDebug.events())).filter(e => e.event === 'discover_another_clicked')).toHaveLength(1);
});

test('real Web Audio schedules separate overlapping voices, reuses buffers, and keeps rapid counts', async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { starts: 0, peakVoices: 0, active: 0, buffers: 0, running: true, durations: [] as number[] };
    const seen = new WeakSet<AudioBuffer>();
    Object.assign(window, { audioProbe: probe });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      start.apply(this, args);
      probe.starts++;
      probe.active++;
      probe.peakVoices = Math.max(probe.peakVoices, probe.active);
      probe.running = probe.running && this.context.state === 'running';
      if (this.buffer && !seen.has(this.buffer)) { seen.add(this.buffer); probe.buffers++; }
      probe.durations.push(this.buffer!.duration);
      this.addEventListener('ended', () => probe.active--, { once: true });
    };
  });
  await open(page);
  await pluck(page, [0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6]);
  const probe = await page.evaluate(() => (window as unknown as {
    audioProbe: { starts: number; peakVoices: number; buffers: number; running: boolean; durations: number[] }
  }).audioProbe);
  expect(probe.starts).toBe(11);
  expect(probe.peakVoices).toBeGreaterThan(1);
  expect(probe.buffers).toBe(7);
  expect(probe.running).toBe(true);
  expect(probe.durations).toEqual(Array(11).fill(3));
  const events = await page.evaluate(() => window.lyreDebug.events());
  expect(events.filter(e => e.event === 'string_played')).toHaveLength(11);
  expect(events.filter(e => e.event === 'first_string_played')).toHaveLength(1);
});
