import { useCallback } from 'react';
import { useImageStore } from '@/stores/image-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ProcessingQueue } from '@/lib/image/queue';
import { toast } from 'sonner';

export function useConverter() {
  const {
    items,
    isProcessing,
    setIsProcessing,
    setTotalProgress,
    updateItemProgress,
    updateItemResult,
    setItemError,
  } = useImageStore();

  const { convPrefs, wmPrefs } = useSettingsStore();

  const convertAll = useCallback(async () => {
    if (items.length === 0) {
      toast.error('No images to convert');
      return;
    }

    setIsProcessing(true);
    setTotalProgress(0);

    const queue = new ProcessingQueue(2);

    try {
      await queue.run(items, convPrefs, wmPrefs, {
        onItemStart: (id) => updateItemProgress(id, 10, 'processing'),
        onItemProgress: (id, prog) => updateItemProgress(id, prog),
        onItemSuccess: (id, res) => updateItemResult(id, res),
        onItemError: (id, err) => setItemError(id, err),
        onTotalProgress: (completed, total) => {
          setTotalProgress(Math.round((completed / total) * 100));
        },
      });

      toast.success('Batch conversion completed!');
    } catch (err: any) {
      toast.error('Batch conversion encountered an error', {
        description: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [items, convPrefs, wmPrefs, setIsProcessing, setTotalProgress, updateItemProgress, updateItemResult, setItemError]);

  return {
    convertAll,
    isProcessing,
    items,
    convPrefs,
  };
}
