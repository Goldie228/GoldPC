import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Footer', () => {
  it('renders without crashing', () => {
    renderInRouter(<Footer />);
    expect(document.querySelector('footer')).toBeInTheDocument();
  });

  it('renders the brand name', () => {
    renderInRouter(<Footer />);
    // "GoldPC" appears in copyright text and potentially as logo
    expect(screen.getByText(/GoldPC/)).toBeInTheDocument();
  });

  it('renders catalog links', () => {
    renderInRouter(<Footer />);
    expect(screen.getByText('Процессоры')).toBeInTheDocument();
    expect(screen.getByText('Видеокарты')).toBeInTheDocument();
  });

  it('renders service links', () => {
    renderInRouter(<Footer />);
    expect(screen.getByText('Конструктор ПК')).toBeInTheDocument();
  });

  it('renders info links', () => {
    renderInRouter(<Footer />);
    expect(screen.getByText('О нас')).toBeInTheDocument();
    const contacts = screen.getAllByText('Контакты');
    expect(contacts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders copyright with current year', () => {
    renderInRouter(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument();
  });

  it('renders social media links', () => {
    renderInRouter(<Footer />);
    expect(screen.getByLabelText(/instagram/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/facebook/i)).toBeInTheDocument();
  });

  it('renders catalog links as Link components', () => {
    renderInRouter(<Footer />);
    const catalogLink = screen.getByText('Процессоры').closest('a');
    expect(catalogLink).toHaveAttribute('href', '/catalog?category=cpu');
  });
});
