import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dayIndex, startOfWeek, timeInWeek, weekRange } from '../src/lib/week.js';

describe('Chicago weeks', () => {
  it('starts on Monday 00:00 Chicago time (CST, UTC-6)', () => {
    // Wed Nov 18 2026, 15:00 UTC = 9:00 CST
    assert.equal(startOfWeek(new Date('2026-11-18T15:00:00Z')).toISOString(), '2026-11-16T06:00:00.000Z');
  });

  it('uses CDT (UTC-5) in summer', () => {
    assert.equal(startOfWeek(new Date('2026-07-01T12:00:00Z')).toISOString(), '2026-06-29T05:00:00.000Z');
  });

  it('puts Sunday late evening in Chicago in the old week, even when it is Monday in UTC', () => {
    // Mon Nov 23 03:00 UTC = Sun Nov 22 21:00 CST
    const t = new Date('2026-11-23T03:00:00Z');
    assert.equal(dayIndex(t), 6);
    assert.equal(startOfWeek(t).toISOString(), '2026-11-16T06:00:00.000Z');
  });

  it('handles the week the clocks change', () => {
    // DST ends Sun Nov 1 2026. Week of Oct 26 starts in CDT, the next one in CST.
    const { start, end } = weekRange(new Date('2026-10-28T12:00:00Z'));
    assert.equal(start.toISOString(), '2026-10-26T05:00:00.000Z');
    assert.equal(end.toISOString(), '2026-11-02T06:00:00.000Z');
    assert.equal(timeInWeek(start, 6, 12).toISOString(), '2026-11-01T18:00:00.000Z');
  });
});
