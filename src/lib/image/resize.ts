export interface ResizeDimensions {
  width: number;
  height: number;
}

/**
 * Calculates new dimensions preserving aspect ratio if requested
 */
export function calculateResizeDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  preserveAspectRatio: boolean = true
): ResizeDimensions {
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  if (!maxWidth && !maxHeight) {
    return { width: targetWidth, height: targetHeight };
  }

  if (preserveAspectRatio) {
    const aspectRatio = naturalWidth / naturalHeight;

    if (maxWidth && maxHeight) {
      if (naturalWidth / maxWidth > naturalHeight / maxHeight) {
        targetWidth = Math.min(naturalWidth, maxWidth);
        targetHeight = Math.round(targetWidth / aspectRatio);
      } else {
        targetHeight = Math.min(naturalHeight, maxHeight);
        targetWidth = Math.round(targetHeight * aspectRatio);
      }
    } else if (maxWidth && naturalWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else if (maxHeight && naturalHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = Math.round(targetHeight * aspectRatio);
    }
  } else {
    if (maxWidth) targetWidth = maxWidth;
    if (maxHeight) targetHeight = maxHeight;
  }

  return {
    width: Math.max(1, Math.round(targetWidth)),
    height: Math.max(1, Math.round(targetHeight)),
  };
}
