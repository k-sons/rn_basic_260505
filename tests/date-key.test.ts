import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addDaysToKey, isValidDateKey, parseDateKey, toDateKey } from '@/lib/date-key';

describe('date-key helpers', () => {
  it('formats dates as local YYYY-MM-DD keys', () => {
    assert.equal(toDateKey(new Date(2026, 4, 7)), '2026-05-07');
  });

  it('rejects impossible or malformed dates', () => {
    assert.equal(isValidDateKey('2026-02-29'), false);
    assert.equal(isValidDateKey('2026-13-01'), false);
    assert.equal(isValidDateKey('2026/05/07'), false);
  });

  it('parses valid date keys', () => {
    const parsed = parseDateKey('2026-05-07');
    assert.ok(parsed);
    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 4);
    assert.equal(parsed.getDate(), 7);
  });

  it('adds days across month boundaries', () => {
    assert.equal(addDaysToKey('2026-05-31', 1), '2026-06-01');
    assert.equal(addDaysToKey('2026-03-01', -1), '2026-02-28');
  });
});
