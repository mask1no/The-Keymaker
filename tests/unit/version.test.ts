import { APP_VERSION, getVersion, VERSION_INFO } from '@/lib/version';

describe('Version Management', () => {
  it('should export consistent version', () => {
    expect(APP_VERSION).toBe('1.5.2');
    expect(getVersion()).toBe('1.5.2');
    expect(VERSION_INFO.version).toBe('1.5.2');
  });

  it('should have valid version format', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should include build metadata', () => {
    expect(VERSION_INFO.buildDate).toBeDefined();
    expect(VERSION_INFO.nodeVersion).toBeDefined();
    expect(new Date(VERSION_INFO.buildDate)).toBeInstanceOf(Date);
  });

  it('should be immutable', () => {
    expect(() => {
      (VERSION_INFO as any).version = '2.0.0';
    }).toThrow();
  });
});
