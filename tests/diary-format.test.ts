import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { needsRootFormatUpgrade, parseDiaryStorage, stringifyDiaryDocument } from '@/lib/diary-format';
import { DIARY_STORAGE_FORMAT_VERSION } from '@/types/diary';

describe('diary storage format', () => {
  it('parses current format documents', () => {
    const raw = JSON.stringify({
      formatVersion: DIARY_STORAGE_FORMAT_VERSION,
      entries: {
        '2026-05-07': { imageUri: 'file://photo.jpg', memo: 'hello' },
      },
    });

    const parsed = parseDiaryStorage(raw);
    assert.equal(parsed['2026-05-07'].imageUri, 'file://photo.jpg');
    assert.equal(parsed['2026-05-07'].memo, 'hello');
    assert.equal(parsed['2026-05-07'].schemaVersion, DIARY_STORAGE_FORMAT_VERSION);
  });

  it('parses legacy root date-key maps', () => {
    const raw = JSON.stringify({
      '2026-05-07': { imageUri: '', memo: 'legacy' },
    });

    assert.equal(needsRootFormatUpgrade(raw), true);
    assert.equal(parseDiaryStorage(raw)['2026-05-07'].memo, 'legacy');
  });

  it('ignores malformed date keys and malformed entries', () => {
    const raw = JSON.stringify({
      formatVersion: DIARY_STORAGE_FORMAT_VERSION,
      entries: {
        '2026-05-07': { imageUri: 'data:image/jpeg;base64,x', memo: 'ok' },
        '2026-99-99': { imageUri: '', memo: 'bad date' },
        'not-date': { imageUri: '', memo: 'bad key' },
        '2026-05-08': null,
      },
    });

    const parsed = parseDiaryStorage(raw);
    assert.deepEqual(Object.keys(parsed), ['2026-05-07']);
    assert.equal(parsed['2026-05-07'].memo, 'ok');
  });

  it('stringifies documents with the current format version', () => {
    const raw = stringifyDiaryDocument({
      '2026-05-07': { imageUri: '', memo: 'saved' },
    });
    const parsed = JSON.parse(raw);

    assert.equal(parsed.formatVersion, DIARY_STORAGE_FORMAT_VERSION);
    assert.equal(parsed.entries['2026-05-07'].memo, 'saved');
  });
});
