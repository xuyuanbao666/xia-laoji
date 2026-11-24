import { generateCode, storeCode, verifyCode, canSendCode, invalidateCode } from '../services/verificationService';
describe('Email verification', () => {
  it('generates six digits', () => expect(generateCode()).toMatch(/^\d{6}$/));
  it('normalizes email and consumes only at registration', () => {
    storeCode('One@Example.com', '123456');
    expect(verifyCode('one@example.com', '123456', false)).toBe(true);
    expect(verifyCode(' ONE@example.com ', '123456')).toBe(true);
    expect(verifyCode('one@example.com', '123456')).toBe(false);
    expect(canSendCode('one@example.com')).toBe(false);
  });
  it('blocks after five incorrect attempts', () => {
    storeCode('two@example.com', '123456');
    for (let i = 0; i < 5; i++) expect(verifyCode('two@example.com', '654321')).toBe(false);
    expect(verifyCode('two@example.com', '123456')).toBe(false);
  });
  it('expires after five minutes', () => {
    jest.useFakeTimers();
    try {
      storeCode('three@example.com', '123456');
      jest.advanceTimersByTime(300001);
      expect(verifyCode('three@example.com', '123456')).toBe(false);
    } finally { jest.useRealTimers(); }
  });
  it('invalidates failed delivery while retaining cooldown', () => {
    storeCode('four@example.com', '123456');
    invalidateCode('four@example.com');
    expect(verifyCode('four@example.com', '123456')).toBe(false);
    expect(canSendCode('four@example.com')).toBe(false);
  });
});
