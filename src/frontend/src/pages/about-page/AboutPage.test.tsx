import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { AboutPage } from './AboutPage';

afterEach(() => cleanup());

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('AboutPage', () => {
  it('renders without crashing', () => {
    renderWithRouter(<AboutPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays company stats', () => {
    renderWithRouter(<AboutPage />);
    expect(screen.getByText(/довольных клиентов/i)).toBeInTheDocument();
  });

  it('displays contact section', () => {
    renderWithRouter(<AboutPage />);
    expect(screen.getByText(/контакт/i)).toBeInTheDocument();
  });
});
