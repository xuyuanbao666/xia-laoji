import { beforeEach, expect, jest, test } from '@jest/globals';
import api from '../api';
import { getFoodById } from '../food';
import { useFoodStore } from '../../store/foodStore';
import type { Food } from '../../types';

jest.mock('../api', () => ({ __esModule: true, default: { get: jest.fn() } }));
const get = api.get as unknown as jest.Mock<() => Promise<unknown>>;
const food = (id: string): Food => ({
  _id: id, name: id, nameZh: id, category: 'test',
  nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  servingSize: 100, servingName: 'g',
});
const response = (foods: Food[], total: number, page = 1) => ({
  data: { success: true, data: { foods, total, page, limit: 50 } },
});
beforeEach(() => {
  get.mockReset();
  useFoodStore.getState().clearSearch();
});
test('food detail unwraps the backend response', async () => {
  const item = food('detail');
  get.mockResolvedValueOnce({ data: { success: true, data: item } });
  await expect(getFoodById('detail')).resolves.toEqual(item);
});
test('pagination uses a stable page size and stops after all results are loaded', async () => {
  const first = Array.from({ length: 50 }, (_, i) => food(String(i)));
  const second = Array.from({ length: 5 }, (_, i) => food(String(i + 50)));
  get.mockResolvedValueOnce(response(first, 55));
  get.mockResolvedValueOnce(response(second, 55, 2));
  await useFoodStore.getState().searchFoods('apple');
  await useFoodStore.getState().loadMore('apple');
  expect(get).toHaveBeenNthCalledWith(1, '/foods', { params: { q: 'apple', page: 1, limit: 50 } });
  expect(get).toHaveBeenNthCalledWith(2, '/foods', { params: { q: 'apple', page: 2, limit: 50 } });
  expect(useFoodStore.getState().searchResults).toEqual([...first, ...second]);
  expect(useFoodStore.getState().hasMore).toBe(false);
  await useFoodStore.getState().loadMore('apple');
  expect(get).toHaveBeenCalledTimes(2);
});
test('an older search cannot overwrite a newer search', async () => {
  let resolveOld!: (value: unknown) => void;
  get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  get.mockResolvedValueOnce(response([food('new')], 1));
  const old = useFoodStore.getState().searchFoods('old');
  await useFoodStore.getState().searchFoods('new');
  resolveOld(response([food('old')], 1));
  await old;
  expect(useFoodStore.getState().searchResults).toEqual([food('new')]);
});
test('clearing search invalidates an in-flight result', async () => {
  let resolve!: (value: unknown) => void;
  get.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const pending = useFoodStore.getState().searchFoods('apple');
  useFoodStore.getState().clearSearch();
  resolve(response([food('old')], 1));
  await pending;
  expect(useFoodStore.getState().searchResults).toEqual([]);
  expect(useFoodStore.getState().isLoading).toBe(false);
});
