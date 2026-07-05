import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button, Input } from '../ui';

interface FileAttachment {
  file: File;
  fileUrl?: string;
  fileName: string;
  fileSize?: number;
  uploading?: boolean;
}

interface FileInfo {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

interface ChatInputProps {
  onSend: (content: string, fileInfo?: { fileUrl: string; fileName: string; fileSize?: number; contentType?: string }) => Promise<void>;
  onUpload?: (file: File) => Promise<FileInfo | null>;
  disabled?: boolean;
  uploading?: boolean;
  placeholder?: string;
}

/**
 * Chat input with send button, file attach button, and file preview.
 * Enter to send, Shift+Enter for newline.
 * File attachment flow: select file → upload → send message with file metadata.
 */
export function ChatInput({
  onSend,
  onUpload,
  disabled,
  uploading: externalUploading,
  placeholder = 'Написать сообщение...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if ((!trimmed && !attachment) || sending || disabled) return;

    // Upload file first if needed
    let resolvedFile: FileInfo | null = null;
    if (attachment && !attachment.fileUrl && !attachment.uploading && onUpload) {
      setAttachment(prev => prev ? { ...prev, uploading: true } : null);
      const result = await onUpload(attachment.file);
      if (!result) {
        setAttachment(prev => prev ? { ...prev, uploading: false } : null);
        return; // Upload failed — error shown upstream
      }
      resolvedFile = result;
      setAttachment(prev => prev ? { ...prev, fileUrl: result.fileUrl, uploading: false } : null);
    } else if (attachment?.fileUrl) {
      resolvedFile = {
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize ?? 0,
        contentType: '',
      };
    }

    setSending(true);
    try {
      const contentToSend = trimmed || (resolvedFile ? resolvedFile.fileName : '');
      await onSend(contentToSend, resolvedFile ?? undefined);
      setValue('');
      setAttachment(null);
      inputRef.current?.focus();
    } catch {
      // Ошибка handled upstream
    } finally {
      setSending(false);
    }
  }, [value, sending, disabled, attachment, onSend, onUpload]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachment({
      file,
      fileName: file.name,
      fileSize: file.size,
    });

    // Reset so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setAttachment(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const isUploading = sending || externalUploading || attachment?.uploading;
  const canSend = (value.trim().length > 0 || attachment != null) && !isUploading;

  return (
    <div className="chat-input">
      <div className="chat-input__main">
        {attachment && (
          <div className="chat-input__file-preview">
            <span className="chat-input__file-name">{attachment.fileName}</span>
            <span className="chat-input__file-size">{formatFileSize(attachment.fileSize!)}</span>
            {attachment.uploading && <span className="chat-input__file-uploading">Загрузка...</span>}
            <button
              type="button"
              className="chat-input__file-remove"
              onClick={handleRemoveFile}
              disabled={!!attachment.uploading}
              title="Удалить файл"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="chat-input__row">
          <Input
            ref={inputRef}
            placeholder={attachment ? 'Добавить комментарий к файлу...' : placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="chat-input__field"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="secondary"
            className="chat-input__attach"
            disabled={disabled || isUploading}
            onClick={handleAttachClick}
            title="Прикрепить файл"
          >
            <Paperclip size={18} />
          </Button>
          <Button
            type="button"
            className="chat-input__send"
            disabled={disabled || !canSend}
            onClick={handleSend}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        className="chat-input__file-input"
        onChange={handleFileChange}
      />
    </div>
  );
}
