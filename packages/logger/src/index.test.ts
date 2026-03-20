import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebSocketLogger } from './index.js';

const mockSend = jest.fn();
const mockWs = {
  readyState: 1, // WebSocket.OPEN
  send: mockSend,
};

// Mock the global WebSocket constructor
(global as any).WebSocket = jest.fn(() => mockWs);
(global as any).WebSocket.OPEN = 1;

describe('WebSocketLogger', () => {
  let logger: WebSocketLogger;

  beforeEach(() => {
    mockSend.mockClear();
    (global as any).WebSocket.mockClear();
    mockWs.readyState = 1;
    logger = new WebSocketLogger('wss://localhost:8080');
  });

  it('should send log message over WebSocket', () => {
    logger.log('test message', 123);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const sentData = JSON.parse(mockSend.mock.calls[0][0] as string);

    expect(sentData.type).toBe('log');
    expect(sentData.args).toEqual(['test message', 123]);
    expect(sentData.timestamp).toBeGreaterThan(0);
    expect(sentData.id).toBeDefined();
  });

  it('should handle different log levels', () => {
    logger.warn('warning');
    logger.error('error');
    logger.info('info');
    logger.debug('debug');

    expect(mockSend).toHaveBeenCalledTimes(4);
  });

  it('should not throw when WebSocket is not open', () => {
    mockWs.readyState = 3; // WebSocket.CLOSED
    expect(() => logger.log('test')).not.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });
});
