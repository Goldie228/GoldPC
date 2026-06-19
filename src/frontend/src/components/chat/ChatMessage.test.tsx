import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatMessage } from './ChatMessage';
import type { TicketMessage } from '@/hooks/useTicketChat';

afterEach(() => cleanup());

function makeMessage(overrides: Partial<TicketMessage> = {}): TicketMessage {
  return {
    id: '1',
    ticketId: 't1',
    authorId: 'u1',
    authorRole: 'Customer',
    content: 'Hello world',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ChatMessage', () => {
  it('renders message content', () => {
    render(<ChatMessage message={makeMessage()} isOwn={true} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows "Вы" for own messages', () => {
    render(<ChatMessage message={makeMessage()} isOwn={true} />);
    expect(screen.getByText('Вы')).toBeInTheDocument();
  });

  it('shows "Техник" for Master messages', () => {
    render(
      <ChatMessage message={makeMessage({ authorRole: 'Master' })} isOwn={false} />
    );
    expect(screen.getByText('Техник')).toBeInTheDocument();
  });

  it('shows system message', () => {
    render(
      <ChatMessage
        message={makeMessage({ authorRole: 'System', content: 'Ticket created' })}
        isOwn={false}
      />
    );
    expect(screen.getByText('Ticket created')).toBeInTheDocument();
  });
});
