import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatInput } from './ChatInput';

vi.mock('../ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: ({ ...props }: any) => <input {...props} />,
}));

afterEach(() => cleanup());

describe('ChatInput', () => {
  it('renders input field with default placeholder', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Написать сообщение...')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<ChatInput onSend={vi.fn()} placeholder="Введите отзыв..." />);
    expect(screen.getByPlaceholderText('Введите отзыв...')).toBeInTheDocument();
  });

  it('calls onSend when Enter key is pressed', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput onSend={onSend} />);
    const input = screen.getByPlaceholderText('Написать сообщение...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Test message', undefined);
  });

  it('does not call onSend with empty message', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const input = screen.getByPlaceholderText('Написать сообщение...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });
});
