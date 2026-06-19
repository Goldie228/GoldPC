import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import OfflineBanner from './OfflineBanner';

vi.mock('@/hooks/useOfflineStatus', () => ({
  useOfflineStatus: vi.fn(() => ({ isOffline: false, isOnline: true })),
}));

import { useOfflineStatus } from '@/hooks/useOfflineStatus';
const mockUseOfflineStatus = vi.mocked(useOfflineStatus);

afterEach(() => cleanup());

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    mockUseOfflineStatus.mockReturnValue({ isOffline: false, isOnline: true });
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows banner when offline', () => {
    mockUseOfflineStatus.mockReturnValue({ isOffline: true, isOnline: false });
    render(<OfflineBanner />);
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
  });
});
