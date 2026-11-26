import { beforeEach, expect, jest, test } from '@jest/globals';
import api from '../api';
import { login, register } from '../auth';

jest.mock('../api', () => ({ __esModule: true, default: { post: jest.fn() } }));
const post = api.post as unknown as jest.Mock<() => Promise<unknown>>;
const user = { _id: 'test-user' };
const credentials = { email: 'test@example.com', password: 'test-password' };
beforeEach(() => { post.mockReset(); });
test('login unwraps the server response before persisting credentials', async () => {
  post.mockResolvedValue({ data: { success: true, data: { user, token: 'test-token' } } });
  await expect(login(credentials)).resolves.toEqual({ user, token: 'test-token' });
});
test('register accepts the same response envelope', async () => {
  post.mockResolvedValue({ data: { success: true, data: { user, token: 'test-token' } } });
  await expect(register({ ...credentials, code: '123456' })).resolves.toEqual({ user, token: 'test-token' });
});
test('invalid response cannot be treated as an authenticated session', async () => {
  post.mockResolvedValue({ data: { success: true, data: { user } } });
  await expect(login(credentials)).rejects.toThrow('Invalid authentication response');
});
