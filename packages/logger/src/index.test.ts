import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebSocketLogger } from './index.js';

describe('WebSocketLogger', () => {
  let logger: WebSocketLogger;
  let mockWs: any;

  beforeEach(() => {
    mockWs = {
      readyState: 1, // WebSocket.OPEN
      send: jest.fn()
    };
    logger = new WebSocketLogger(mockWs);
  });

  it('should send log message over WebSocket', () => {
    logger.log('test message', 123);
    
    expect(mockWs.send).toHaveBeenCalledTimes(1);
    const sentData = JSON.parse(mockWs.send.mock.calls[0][0]);
    
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
    
    expect(mockWs.send).toHaveBeenCalledTimes(4);
  });

  it('should gracefully handle disconnected WebSocket', () => {
    const disconnectedLogger = new WebSocketLogger(null);
    expect(() => disconnectedLogger.log('test')).not.toThrow();
  });
});
