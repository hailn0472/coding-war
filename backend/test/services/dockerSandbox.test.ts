import { describe, it, expect, jest, beforeEach } from '@jest/globals';

/**
 * Unit tests for Docker Sandbox Service
 * Tests container lifecycle, compilation, and execution
 */

// Mock child_process
const mockExec = jest.fn<any>();

jest.mock('child_process', () => ({
  exec: mockExec,
}));

// Mock util
jest.mock('util', () => ({
  promisify: jest.fn((fn: any) => fn),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Docker Sandbox Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSandbox', () => {
    it('should create container with correct resource limits', async () => {
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const { createSandbox } = await import('./dockerSandbox');

      const config = {
        language: 'CPP' as const,
        timeLimit: 1000,
        memoryLimit: 256,
        sourceCode: 'int main() { return 0; }',
      };

      const containerName = await createSandbox(config);

      expect(containerName).toMatch(/^judge-[a-f0-9]{16}$/);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--memory=256m')
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--network=none')
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--read-only')
      );
    });

    it('should throw error if container creation fails', async () => {
      mockExec.mockRejectedValue(new Error('Docker error'));

      const { createSandbox } = await import('./dockerSandbox');

      const config = {
        language: 'PYTHON' as const,
        timeLimit: 2000,
        memoryLimit: 512,
        sourceCode: 'print("test")',
      };

      await expect(createSandbox(config)).rejects.toThrow(
        'Failed to create sandbox container'
      );
    });
  });

  describe('destroySandbox', () => {
    it('should stop and remove container', async () => {
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const { destroySandbox } = await import('./dockerSandbox');

      await destroySandbox('test-container');

      expect(mockExec).toHaveBeenCalledWith(
        'docker stop test-container',
        expect.any(Object)
      );
      expect(mockExec).toHaveBeenCalledWith('docker rm test-container');
    });

    it('should not throw error if cleanup fails', async () => {
      mockExec.mockRejectedValue(new Error('Container not found'));

      const { destroySandbox } = await import('./dockerSandbox');

      await expect(destroySandbox('test-container')).resolves.not.toThrow();
    });
  });

  describe('checkSandboxImage', () => {
    it('should return true if image exists', async () => {
      mockExec.mockResolvedValue({ stdout: 'image data', stderr: '' });

      const { checkSandboxImage } = await import('./dockerSandbox');

      const exists = await checkSandboxImage();

      expect(exists).toBe(true);
    });

    it('should return false if image does not exist', async () => {
      mockExec.mockRejectedValue(new Error('Image not found'));

      const { checkSandboxImage } = await import('./dockerSandbox');

      const exists = await checkSandboxImage();

      expect(exists).toBe(false);
    });
  });

  describe('cleanupStaleContainers', () => {
    it('should remove stale containers', async () => {
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const { cleanupStaleContainers } = await import('./dockerSandbox');

      await cleanupStaleContainers();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('docker container prune')
      );
    });
  });
});
