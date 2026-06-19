import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the apiClient module
const mockPost = vi.fn().mockResolvedValue({});
vi.mock('../api/client', () => ({
  default: { post: mockPost },
  BASE_URL: 'http://localhost:5000',
}));

describe('telemetry.ts', () => {
  let telemetryTrack: typeof import('./telemetry').telemetryTrack;
  let telemetryInitAutoFlush: typeof import('./telemetry').telemetryInitAutoFlush;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset the module to clear internal queue
    vi.resetModules();
    const mod = await import('./telemetry');
    telemetryTrack = mod.telemetryTrack;
    telemetryInitAutoFlush = mod.telemetryInitAutoFlush;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('telemetryTrack', () => {
    it('does not throw when called with a valid event name', () => {
      expect(() => telemetryTrack('page_view')).not.toThrow();
    });

    it('does nothing when called with empty string', () => {
      telemetryTrack('');
      vi.advanceTimersByTime(2000);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('does nothing when called with whitespace-only string', () => {
      telemetryTrack('   ');
      vi.advanceTimersByTime(2000);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('schedules a flush after 1500ms', () => {
      telemetryTrack('click');
      expect(mockPost).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1500);
      expect(mockPost).toHaveBeenCalled();
    });

    it('batches multiple events into one flush', () => {
      telemetryTrack('event1');
      telemetryTrack('event2');
      telemetryTrack('event3');
      vi.advanceTimersByTime(1500);
      expect(mockPost).toHaveBeenCalledTimes(1);
      const callArgs = mockPost.mock.calls[0];
      expect(callArgs[1].events).toHaveLength(3);
    });

    it('sends events with name, timestamp, and optional props', () => {
      telemetryTrack('click', { button: 'submit' });
      vi.advanceTimersByTime(1500);
      const callArgs = mockPost.mock.calls[0];
      const event = callArgs[1].events[0];
      expect(event.name).toBe('click');
      expect(event.props).toEqual({ button: 'submit' });
      expect(event.ts).toBeTruthy();
    });
  });

  describe('telemetryInitAutoFlush', () => {
    it('does not throw when called', () => {
      expect(() => telemetryInitAutoFlush()).not.toThrow();
    });
  });
});
