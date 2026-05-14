import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components';

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageFile,
  onCrop,
  onCancel
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (imageUrl && imageRef.current && (window as any).Cropper) {
      const Cropper = (window as any).Cropper;
      cropperRef.current = new Cropper(imageRef.current, {
        viewMode: 1,
        autoCropArea: 1,
        movable: true,
        zoomable: true,
        scalable: true,
      });
    }
    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
      }
    };
  }, [imageUrl]);

  const handleDone = () => {
    if (cropperRef.current) {
      cropperRef.current.getCroppedCanvas().toBlob((blob: Blob) => {
        const croppedFile = new File([blob], imageFile.name, { type: imageFile.type });
        onCrop(croppedFile);
      }, imageFile.type);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ 
        width: '100%', height: 400, background: '#000', 
        borderRadius: 8, overflow: 'hidden', position: 'relative' 
      }}>
        <img 
          ref={imageRef} 
          src={imageUrl} 
          alt="To crop" 
          style={{ maxWidth: '100%', display: 'block' }} 
        />
      </div>
      
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button onClick={handleDone}>Xác nhận cắt ảnh</Button>
      </div>
    </div>
  );
};
