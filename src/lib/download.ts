import { Capacitor } from '@capacitor/core';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Save a file to the device.
 *
 * - Web browser: triggers a normal download via a temporary <a download> link.
 * - Capacitor native app (Android/iOS): the WebView cannot download blob/data
 *   URLs, so we write the file into the app's cache and open the native share
 *   sheet, letting the user save it (Files, Drive, email, etc.).
 */
export async function saveFile(blob: Blob, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    try {
      await Share.share({
        title: fileName,
        files: [written.uri],
        dialogTitle: 'Save or share',
      });
    } catch (err) {
      // User dismissed the share sheet — that is not an error.
      console.warn('Share cancelled or unavailable:', err);
    }
    return;
  }

  // Web browser
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
