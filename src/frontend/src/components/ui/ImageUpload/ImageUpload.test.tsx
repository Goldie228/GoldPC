import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUpload } from './ImageUpload';
import type { ProductImage } from '@/api/types';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  upload: vi.fn(),
  delete: vi.fn(),
  setPrimary: vi.fn(),
  reorder: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: mocks.showToast,
    toasts: [],
    removeToast: vi.fn(),
    clearToasts: vi.fn(),
  })),
}));

vi.mock('@/api/admin', () => ({
  imagesAdminApi: {
    upload: mocks.upload,
    delete: mocks.delete,
    setPrimary: mocks.setPrimary,
    reorder: mocks.reorder,
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function createFile(name: string, type: string, size: number): File {
  const buffer = new ArrayBuffer(size);
  const file = new File([buffer], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('ImageUpload', () => {
  const defaultProps = {
    productId: 'product-1',
    images: [] as ProductImage[],
    onImagesChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders upload zone', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText(/нажмите для загрузки/i)).toBeInTheDocument();
  });

  it('shows empty state when no images', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText(/изображения не добавлены/i)).toBeInTheDocument();
  });

  it('renders existing images', () => {
    const images: ProductImage[] = [
      { id: '1', url: '/img1.jpg', isMain: true, order: 0 },
      { id: '2', url: '/img2.jpg', isMain: false, order: 1 },
    ];
    const { container } = render(<ImageUpload {...defaultProps} images={images} />);
    expect(container.querySelectorAll('img').length).toBe(2);
  });

  it('shows max files info', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText(/до 10 шт/)).toBeInTheDocument();
  });

  it('hides empty state when images exist', () => {
    const images: ProductImage[] = [{ id: '1', url: '/img1.jpg', isMain: true, order: 0 }];
    render(<ImageUpload {...defaultProps} images={images} />);
    expect(screen.queryByText(/изображения не добавлены/i)).not.toBeInTheDocument();
  });

  it('shows Главное badge on primary image', () => {
    const images: ProductImage[] = [{ id: 'img-1', url: '/img1.jpg', isMain: true, order: 0 }];
    render(<ImageUpload {...defaultProps} images={images} />);
    expect(screen.getByText('Главное')).toBeInTheDocument();
  });

  it('does not show Главное badge on non-primary image', () => {
    const images: ProductImage[] = [{ id: 'img-1', url: '/img1.jpg', isMain: false, order: 0 }];
    render(<ImageUpload {...defaultProps} images={images} />);
    expect(screen.queryByText('Главное')).not.toBeInTheDocument();
  });

  it('calls upload API when valid file is selected', async () => {
    const newImage: ProductImage = { id: 'new-1', url: '/new.jpg', isMain: false, order: 0 };
    mocks.upload.mockResolvedValueOnce(newImage);
    render(<ImageUpload {...defaultProps} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('photo.jpg', 'image/jpeg', 1024 * 100)] } });
    await waitFor(() => {
      expect(mocks.upload).toHaveBeenCalledWith('product-1', expect.any(File), expect.any(Function));
    });
  });

  it('calls onImagesChange after successful upload', async () => {
    const newImage: ProductImage = { id: 'new-1', url: '/new.jpg', isMain: false, order: 0 };
    mocks.upload.mockResolvedValueOnce(newImage);
    const onImagesChange = vi.fn();
    render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('photo.jpg', 'image/jpeg', 1024 * 100)] } });
    await waitFor(() => {
      expect(onImagesChange).toHaveBeenCalledWith([newImage]);
    });
  });

  it('shows error toast when upload fails', async () => {
    mocks.upload.mockRejectedValueOnce(new Error('Network error'));
    render(<ImageUpload {...defaultProps} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('photo.jpg', 'image/jpeg', 1024 * 100)] } });
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Ошибка при загрузке "photo.jpg"', 'error');
    });
  });

  it('rejects invalid file type', async () => {
    render(<ImageUpload {...defaultProps} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('doc.pdf', 'application/pdf', 1024)] } });
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Недопустимый формат файла. Разрешены: JPEG, PNG, WebP', 'error');
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('rejects GIF file type', async () => {
    render(<ImageUpload {...defaultProps} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('anim.gif', 'image/gif', 1024)] } });
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Недопустимый формат файла. Разрешены: JPEG, PNG, WebP', 'error');
    });
  });

  it('accepts PNG files', async () => {
    mocks.upload.mockResolvedValueOnce({ id: 'n1', url: '/n.png', isMain: false, order: 0 });
    render(<ImageUpload {...defaultProps} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('photo.png', 'image/png', 1024)] } });
    await waitFor(() => {
      expect(mocks.upload).toHaveBeenCalled();
    });
  });

  it('rejects file exceeding max size', async () => {
    render(<ImageUpload {...defaultProps} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('huge.jpg', 'image/jpeg', 6 * 1024 * 1024)] } });
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('слишком большой'), 'error');
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('respects custom maxFileSize prop', async () => {
    render(<ImageUpload {...defaultProps} maxFileSize={1024 * 100} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('medium.jpg', 'image/jpeg', 1024 * 200)] } });
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('слишком большой'), 'error');
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('rejects file when max files limit is reached', async () => {
    const existing: ProductImage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `img-${i}`, url: `/img${i}.jpg`, isMain: i === 0, order: i,
    }));
    render(<ImageUpload {...defaultProps} images={existing} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('extra.jpg', 'image/jpeg', 1024)] } });
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('Достигнут лимит'), 'error');
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('calls delete API and removes image', async () => {
    mocks.delete.mockResolvedValueOnce(undefined);
    const onImagesChange = vi.fn();
    const images: ProductImage[] = [
      { id: 'img-1', url: '/img1.jpg', isMain: true, order: 0 },
      { id: 'img-2', url: '/img2.jpg', isMain: false, order: 1 },
    ];
    render(<ImageUpload {...defaultProps} images={images} onImagesChange={onImagesChange} />);
    fireEvent.click(screen.getAllByLabelText('Удалить изображение')[0]);
    await waitFor(() => {
      expect(mocks.delete).toHaveBeenCalledWith('product-1', 'img-1');
    });
    expect(onImagesChange).toHaveBeenCalledWith([images[1]]);
  });

  it('shows error toast when delete fails', async () => {
    mocks.delete.mockRejectedValueOnce(new Error('Failed'));
    const onImagesChange = vi.fn();
    const images: ProductImage[] = [{ id: 'img-1', url: '/img1.jpg', isMain: true, order: 0 }];
    render(<ImageUpload {...defaultProps} images={images} onImagesChange={onImagesChange} />);
    fireEvent.click(screen.getByLabelText('Удалить изображение'));
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Не удалось удалить изображение', 'error');
    });
    expect(onImagesChange).toHaveBeenCalledWith(images);
  });

  it('calls setPrimary API when clicking set primary button', async () => {
    mocks.setPrimary.mockResolvedValueOnce(undefined);
    const onImagesChange = vi.fn();
    const images: ProductImage[] = [
      { id: 'img-1', url: '/img1.jpg', isMain: true, order: 0 },
      { id: 'img-2', url: '/img2.jpg', isMain: false, order: 1 },
    ];
    render(<ImageUpload {...defaultProps} images={images} onImagesChange={onImagesChange} />);
    const card = screen.getAllByLabelText('Удалить изображение')[1].closest('div[class*="group"]')!;
    fireEvent.mouseEnter(card);
    fireEvent.click(screen.getByLabelText('Сделать главным изображением'));
    await waitFor(() => {
      expect(mocks.setPrimary).toHaveBeenCalledWith('product-1', 'img-2');
    });
  });

  it('does not show set primary button for primary image', () => {
    const images: ProductImage[] = [{ id: 'img-1', url: '/img1.jpg', isMain: true, order: 0 }];
    render(<ImageUpload {...defaultProps} images={images} />);
    expect(screen.queryByLabelText('Сделать главным изображением')).not.toBeInTheDocument();
  });

  it('shows error toast when setPrimary fails', async () => {
    mocks.setPrimary.mockRejectedValueOnce(new Error('Failed'));
    const onImagesChange = vi.fn();
    const images: ProductImage[] = [
      { id: 'img-1', url: '/img1.jpg', isMain: true, order: 0 },
      { id: 'img-2', url: '/img2.jpg', isMain: false, order: 1 },
    ];
    render(<ImageUpload {...defaultProps} images={images} onImagesChange={onImagesChange} />);
    const card = screen.getAllByLabelText('Удалить изображение')[1].closest('div[class*="group"]')!;
    fireEvent.mouseEnter(card);
    fireEvent.click(screen.getByLabelText('Сделать главным изображением'));
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Не удалось изменить главное изображение', 'error');
    });
    expect(onImagesChange).toHaveBeenCalledWith(images);
  });

  it('handles file drop on the upload zone', async () => {
    mocks.upload.mockResolvedValueOnce({ id: 'd1', url: '/d.jpg', isMain: false, order: 0 });
    const onImagesChange = vi.fn();
    render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);
    const dropZone = screen.getByLabelText(/перетащите или нажмите/i);
    const file = createFile('dropped.jpg', 'image/jpeg', 1024 * 100);
    const dataTransfer = { files: [file], getData: vi.fn(), types: ['Files'] };
    fireEvent.dragEnter(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });
    await waitFor(() => {
      expect(mocks.upload).toHaveBeenCalledWith('product-1', file, expect.any(Function));
    });
  });

  it('shows upload progress indicator during upload', async () => {
    mocks.upload.mockImplementation(() => new Promise(() => {}));
    render(<ImageUpload {...defaultProps} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createFile('uploading.jpg', 'image/jpeg', 1024 * 100)] } });
    await waitFor(() => {
      expect(screen.getByText('uploading.jpg')).toBeInTheDocument();
    });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('uploads multiple valid files', async () => {
    const img1: ProductImage = { id: 'n1', url: '/1.jpg', isMain: false, order: 0 };
    const img2: ProductImage = { id: 'n2', url: '/2.jpg', isMain: false, order: 1 };
    mocks.upload.mockResolvedValueOnce(img1).mockResolvedValueOnce(img2);
    const onImagesChange = vi.fn();
    render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [createFile('p1.jpg', 'image/jpeg', 1024), createFile('p2.png', 'image/png', 1024)] },
    });
    await waitFor(() => {
      expect(mocks.upload).toHaveBeenCalledTimes(2);
    });
    expect(onImagesChange).toHaveBeenCalledWith([img1, img2]);
  });

  it('uploads only valid files when mixed with invalid', async () => {
    const img1: ProductImage = { id: 'n1', url: '/1.jpg', isMain: false, order: 0 };
    mocks.upload.mockResolvedValueOnce(img1);
    const onImagesChange = vi.fn();
    render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);
    const fileInput = screen.getByLabelText(/перетащите или нажмите/i).querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [createFile('p.jpg', 'image/jpeg', 1024), createFile('d.pdf', 'application/pdf', 1024)] },
    });
    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Недопустимый формат файла. Разрешены: JPEG, PNG, WebP', 'error');
    });
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(onImagesChange).toHaveBeenCalledWith([img1]);
  });
});
