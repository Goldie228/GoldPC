import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

afterEach(() => cleanup());

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('NotFoundPage', () => {
  it('renders 404 number', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays page not found message', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/страница не найдена/i)).toBeInTheDocument();
  });

  it('has links to home and catalog', () => {
    renderWithRouter(<NotFoundPage />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/catalog');
  });
});
