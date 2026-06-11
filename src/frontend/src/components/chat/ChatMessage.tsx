import { FileText, Download, ImageIcon } from 'lucide-react';
import type { TicketMessage } from '@/hooks/useTicketChat';

interface ChatMessageProps {
  message: TicketMessage;
  isOwn: boolean;
}

const FILE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg|pdf|doc|docx|txt|zip|rar|xlsx|xls)$/i;

/**
 * Returns appropriate icon based on file extension
 */
function getFileIcon(fileName: string) {
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileName)) {
    return <ImageIcon size={16} />;
  }
  return <FileText size={16} />;
}

/**
 * Chat message bubble — customer (right) or technician (left).
 * Files are displayed with a download link and appropriate icon.
 */
export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const isSystem = message.authorRole === 'System';
  const time = new Date(message.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const authorName = isOwn ? 'Вы' : message.authorRole === 'Master' ? 'Техник' : message.authorRole === 'System' ? 'Система' : 'Клиент';

  const hasFile = Boolean(message.fileUrl) || Boolean(message.fileName);
  const fileExtMatches = FILE_EXTENSIONS.test(message.content);

  if (isSystem) {
    return (
      <div className="chat-message chat-message--system">
        <span className="chat-message__time">{time}</span>
        <span className="chat-message__content">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`chat-message ${isOwn ? 'chat-message--own' : 'chat-message--other'}`}>
      <div className="chat-message__bubble">
        <div className="chat-message__header">
          <span className="chat-message__author">{authorName}</span>
          <span className="chat-message__time">{time}</span>
        </div>

        {/* Show message text if it's not just a filename */}
        {message.content && (!fileExtMatches || (hasFile && message.content !== message.fileName)) && (
          <div className="chat-message__content">{message.content}</div>
        )}

        {/* File attachment section */}
        {(hasFile || fileExtMatches) && (
          <div className="chat-message__file">
            <div className="chat-message__file-icon">
              {getFileIcon(message.fileName || message.content)}
            </div>
            <div className="chat-message__file-info">
              {message.fileUrl ? (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-message__file-link"
                  download={message.fileName || message.content}
                >
                  {message.fileName || message.content}
                </a>
              ) : (
                <span className="chat-message__file-name">
                  {message.fileName || message.content}
                </span>
              )}
              {message.fileSize != null && message.fileSize > 0 && (
                <span className="chat-message__file-size">
                  {message.fileSize < 1024 * 1024
                    ? `${(message.fileSize / 1024).toFixed(1)} КБ`
                    : `${(message.fileSize / (1024 * 1024)).toFixed(1)} МБ`}
                </span>
              )}
            </div>
            {message.fileUrl && (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-message__file-download"
                title="Скачать файл"
                download={message.fileName || message.content}
              >
                <Download size={16} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
