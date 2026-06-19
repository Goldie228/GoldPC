import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthModalBase } from './AuthModalBase';

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title, onClose }: { isOpen: boolean; children: React.ReactNode; title: string; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="close">X</button>
        {children}
      </div>
    );
  },
}));

describe('AuthModalBase', () => {
  it('renders children', () => {
    render(
      <AuthModalBase isOpen={true} onClose={vi.fn()} title="Auth">
        <p>Form content</p>
      </AuthModalBase>
    );
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <AuthModalBase isOpen={true} onClose={vi.fn()} title="Login">
        Content
      </AuthModalBase>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AuthModalBase isOpen={false} onClose={vi.fn()} title="Login">
        Content
      </AuthModalBase>
    );
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('renders switch link when provided', () => {
    const onClick = vi.fn();
    render(
      <AuthModalBase
        isOpen={true}
        onClose={vi.fn()}
        title="Login"
        switchLink={{ text: 'No account?', actionText: 'Register', onClick }}
      >
        Content
      </AuthModalBase>
    );
    expect(screen.getByText('No account?')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('calls switchLink.onClick when action text clicked', () => {
    const onClick = vi.fn();
    render(
      <AuthModalBase
        isOpen={true}
        onClose={vi.fn()}
        title="Login"
        switchLink={{ text: 'No account?', actionText: 'Register', onClick }}
      >
        Content
      </AuthModalBase>
    );
    fireEvent.click(screen.getByText('Register'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <AuthModalBase
        isOpen={true}
        onClose={vi.fn()}
        title="Login"
        footer={<p>Footer content</p>}
      >
        Content
      </AuthModalBase>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('does not render switch link when not provided', () => {
    render(
      <AuthModalBase isOpen={true} onClose={vi.fn()} title="Login">
        Content
      </AuthModalBase>
    );
    expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument();
  });
});
