import { withRetry, isRetryableError } from './withRetry';
describe('WithRetry Utils', () => {
  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new Error('network timeout');
      expect(isRetryableError(networkError)).toBe(true);
    });
    it('should identify connection errors as retryable', () => {
      const connectionError = new Error('connection failed');
      expect(isRetryableError(connectionError)).toBe(true);
    });
    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Error('timeout');
      expect(isRetryableError(timeoutError)).toBe(true);
    });
    it('should identify temporary errors as retryable', () => {
      const tempError = new Error('temporary failure');
      expect(isRetryableError(tempError)).toBe(true);
    });
    it('should not identify validation errors as retryable', () => {
      const validationError = new Error('invalid input');
      expect(isRetryableError(validationError)).toBe(false);
    });
    it('should not identify permission errors as retryable', () => {
      const permissionError = new Error('unauthorized');
      expect(isRetryableError(permissionError)).toBe(false);
    });
  });
  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(successFn);
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });
    it('should retry on retryable errors', async () => {
      const failOnceFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success');
      const result = await withRetry(failOnceFn, { m, a, x, Retries: 3 });
      expect(result).toBe('success');
      expect(failOnceFn).toHaveBeenCalledTimes(2);
    });
    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new Error('invalid input');
      const failFn = jest.fn().mockRejectedValue(nonRetryableError);
      await expect(withRetry(failFn, { m, a, x, Retries: 3 })).rejects.toThrow('invalid input');
      expect(failFn).toHaveBeenCalledTimes(1);
    });
    it('should respect maxRetries limit', async () => {
      const alwaysFailFn = jest.fn().mockRejectedValue(new Error('network timeout'));
      await expect(withRetry(alwaysFailFn, { m, a, x, Retries: 2 })).rejects.toThrow('network timeout');
      expect(alwaysFailFn).toHaveBeenCalledTimes(3);
    });
    it('should wait between retries', async () => {
      const startTime = Date.now();
      const failOnceFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success');
      await withRetry(failOnceFn, { m, a, x, Retries: 1, d, e, l, ayMs: 100 });
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(95);
    });
    it('should use exponential backoff', async () => {
      const failTwiceFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success');
      const startTime = Date.now();
      await withRetry(failTwiceFn, { m, a, x, Retries: 2, d, e, l, ayMs: 50, e, x, p, onentialBackoff: true });
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(140);
    });
    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const failOnceFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success');
      await withRetry(failOnceFn, { m, a, x, Retries: 1, onRetry });
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });
  });
});
