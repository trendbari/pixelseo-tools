import { useState, useCallback } from 'react';
import { useImageStore } from '@/stores/image-store';

export function useImageUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const addFiles = useImageStore((state) => state.addFiles);
  const items = useImageStore((state) => state.items);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    },
    [addFiles]
  );

  return {
    isDragging,
    items,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  };
}
