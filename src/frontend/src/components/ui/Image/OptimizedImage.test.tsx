import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { OptimizedImage } from './OptimizedImage';

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });

  it('applies alt text', () => {
    render(<OptimizedImage src="/test.jpg" alt="My photo" />);
    expect(screen.getByAltText('My photo')).toBeInTheDocument();
  });

  it('applies src', () => {
    render(<OptimizedImage src="/photo.png" alt="Photo" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/photo.png');
  });

  it('applies lazy loading by default', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('applies eager loading when specified', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" loading="eager" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<OptimizedImage src="/test.jpg" alt="Test" className="my-class" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('my-class');
  });

  it('applies width and height', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={200} height={100} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '200');
    expect(img).toHaveAttribute('height', '100');
  });

  it('applies fetchPriority', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" fetchPriority="high" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });
});
