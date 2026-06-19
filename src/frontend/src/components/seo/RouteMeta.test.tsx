import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RouteMeta } from './RouteMeta';

afterEach(() => {
  cleanup();
  document.title = '';
  // Clean meta tags
  document.querySelectorAll('meta[property^="og:"]').forEach(el => el.remove());
  document.querySelectorAll('meta[name="description"]').forEach(el => el.remove());
  document.querySelectorAll('meta[name="robots"]').forEach(el => el.remove());
});

describe('RouteMeta', () => {
  it('sets document title', () => {
    render(
      <MemoryRouter initialEntries={['/catalog/cpu']}>
        <Routes>
          <Route path="/catalog/:category?" element={<RouteMeta />} />
        </Routes>
      </MemoryRouter>
    );
    expect(document.title).toContain('GoldPC');
  });

  it('sets title for cpu category', () => {
    render(
      <MemoryRouter initialEntries={['/catalog/cpu']}>
        <Routes>
          <Route path="/catalog/:category?" element={<RouteMeta />} />
        </Routes>
      </MemoryRouter>
    );
    expect(document.title).toContain('процессоры');
  });

  it('sets og:title meta tag', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<RouteMeta />} />
        </Routes>
      </MemoryRouter>
    );
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle).toBeInTheDocument();
    expect(ogTitle?.getAttribute('content')).toContain('GoldPC');
  });
});
