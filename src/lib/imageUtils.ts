/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Compresses and selects optimal area from a base64 image string.
 * High-res native photos are downscaled first, and the central area is prioritized.
 */
export async function compressImage(base64: string, maxWidth: number = 1024, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // We prioritize the center but leave enough margin for native camera shots
      // Standard license plates are wide. 85% width, 60% height is safer for AI to find context.
      const cropWidthPercent = 0.85;
      const cropHeightPercent = 0.60;
      
      const sourceX = img.width * (1 - cropWidthPercent) / 2;
      const sourceY = img.height * (1 - cropHeightPercent) / 2;
      const sourceW = img.width * cropWidthPercent;
      const sourceH = img.height * cropHeightPercent;

      let targetW = sourceW;
      let targetH = sourceH;
      
      // Limit resolution to keep payload small for AI speed
      if (targetW > maxWidth) {
        targetH = Math.round((targetH * maxWidth) / targetW);
        targetW = maxWidth;
      }

      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, targetW, targetH
      );
      
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = (err) => reject(err);
  });
}
