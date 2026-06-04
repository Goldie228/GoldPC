interface TypingIndicatorProps {
  who?: string;
}

/**
 * Typing indicator with animated dots
 * Shows "Техник печатает..." or just animated dots
 */
export function TypingIndicator({ who }: TypingIndicatorProps) {
  if (!who) return null;

  return (
    <div className="typing-indicator">
      <span className="typing-indicator__text">{who} печатает</span>
      <span className="typing-indicator__dots">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </span>
    </div>
  );
}
