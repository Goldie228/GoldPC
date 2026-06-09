/**
 * ImagesTab — вкладка «Изображения»
 * Использует ImageUpload из Слоя 2
 */

import { ImageUpload } from '@/components/ui/ImageUpload/ImageUpload';
import type { ProductImage } from '@/api/types';

interface ImagesTabProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

export function ImagesTab({ productId, images, onImagesChange }: ImagesTabProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Загрузите изображения товара. Первое изображение будет использоваться как основное в каталоге.
      </p>
      <ImageUpload
        productId={productId}
        images={images}
        onImagesChange={onImagesChange}
      />
    </div>
  );
}
