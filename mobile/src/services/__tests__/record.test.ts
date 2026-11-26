import { beforeEach, expect, jest, test } from '@jest/globals';
import api from '../api';
import { createRecord, updateRecord } from '../record';
import { localDateKey } from '../../utils/date';
jest.mock('../api', () => ({ __esModule: true, default: { post: jest.fn(), put: jest.fn() } }));
const post = api.post as unknown as jest.Mock<() => Promise<unknown>>;
const put = api.put as unknown as jest.Mock<() => Promise<unknown>>;
beforeEach(() => { post.mockReset(); put.mockReset(); });
test('calendar keys use local date fields including month and year boundaries', () => {
  expect(localDateKey(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  expect(localDateKey(new Date(2026, 11, 31, 23, 55))).toBe('2026-12-31');
  // Independently exercise local calendar fields even when CI is in UTC.
  const local = new Date('2026-11-26T16:05:00Z');
  jest.spyOn(local, 'getFullYear').mockReturnValue(2026);
  jest.spyOn(local, 'getMonth').mockReturnValue(10);
  jest.spyOn(local, 'getDate').mockReturnValue(27);
  expect(localDateKey(local)).toBe('2026-11-27');
});
test('record creation preserves a zero amount instead of substituting 100', async () => {
  const record = { _id: 'record' };
  post.mockResolvedValue({ data: { success: true, data: record } });
  await expect(createRecord({ date: '2026-11-27', meal: 'breakfast', foodId: 'food', amount: 0 })).resolves.toEqual(record);
  expect(post).toHaveBeenCalledWith('/records', expect.objectContaining({
    date: '2026-11-27', foods: [expect.objectContaining({ foodId: 'food', amount: 0 })],
  }));
});
test('record update unwraps the API response', async () => {
  const record = { _id: 'record', note: 'updated' };
  put.mockResolvedValue({ data: { success: true, data: record } });
  await expect(updateRecord('record', { note: 'updated' })).resolves.toEqual(record);
});
