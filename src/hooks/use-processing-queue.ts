import { useCallback } from 'react';
import { useImageStore } from '@/stores/image-store';

export function useProcessingQueue() {
  const {
    items,
    isProcessing,
    totalProgress,
    removeImage,
    clearAllImages,
    setIsProcessing,
  } = useImageStore();

  const completedCount = items.filter((item) => item.status === 'done').length;
  const errorCount = items.filter((item) => item.status === 'error').length;
  const pendingCount = items.filter((item) => item.status === 'idle' || item.status === 'processing').length;

  const retryFailed = useCallback(() => {
    // Reset status of errored items to idle
    const errored = items.filter((item) => item.status === 'error');
    errored.forEach((item) => {
      useImageStore.getState().updateItemProgress(item.id, 0, 'idle');
    });
  }, [items]);

  const cancelQueue = useCallback(() => {
    setIsProcessing(false);
  }, [setIsProcessing]);

  return {
    items,
    isProcessing,
    totalProgress,
    completedCount,
    errorCount,
    pendingCount,
    retryFailed,
    cancelQueue,
    removeImage,
    clearAllImages,
  };
}
