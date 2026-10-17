/**
 * Secure Filename Sanitizer & Path Traversal / Zip Slip Prevention (SEC-02, SEC-10)
 * 
 * Protects against:
 * - Zip Slip directory traversal (e.g., ../../../etc/passwd, ..\windows\system32)
 * - Null byte injection (\0, %00)
 * - Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 * - NTFS Alternate Data Streams (filename:stream)
 * - Shell command meta-characters (<, >, |, ;, &, $, `)
 * - Control characters (ASCII 0-31)
 */

const WINDOWS_RESERVED_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
]);

/**
 * Sanitizes a base filename, removing path traversal sequences and unsafe characters
 * while safely preserving valid Unicode characters (including Bengali script).
 */
export function sanitizeSafeFilename(rawName: string, fallback = 'image'): string {
  if (!rawName || typeof rawName !== 'string') {
    return fallback;
  }

  // 1. Remove null bytes and ASCII control characters (0-31 and 127)
  let clean = rawName.replace(/[\x00-\x1F\x7F]/g, '');

  // 2. Extract strictly the file basename (strips any leading path components or ../ sequences)
  clean = clean.replace(/^.*[\\\/]/, '');

  // 3. Remove path traversal patterns (.. sequences)
  clean = clean.replace(/\.{2,}/g, '.');

  // 4. Remove dangerous filesystem characters: < > : " / \ | ? *
  // Also remove shell / NTFS stream meta-characters
  clean = clean.replace(/[<>:"/\\|?*`$;&]/g, '');

  // 5. Trim leading and trailing periods and whitespace
  clean = clean.trim().replace(/^\.+|\.+$/g, '');

  // 6. Check for Windows reserved names
  const nameWithoutExt = clean.includes('.') ? clean.substring(0, clean.lastIndexOf('.')) : clean;
  if (WINDOWS_RESERVED_NAMES.has(nameWithoutExt.toLowerCase())) {
    clean = `file-${clean}`;
  }

  // 7. Enforce maximum filename length (120 characters)
  if (clean.length > 120) {
    const extIdx = clean.lastIndexOf('.');
    if (extIdx > 0 && clean.length - extIdx <= 8) {
      const ext = clean.substring(extIdx);
      const base = clean.substring(0, 120 - ext.length);
      clean = `${base}${ext}`;
    } else {
      clean = clean.substring(0, 120);
    }
  }

  return clean.length > 0 ? clean : fallback;
}

/**
 * Specifically validates and prepares an archive entry path to ensure it cannot
 * escape its intended subfolder inside a ZIP file (Zip Slip Defense - SEC-10).
 */
export function sanitizeZipEntryPath(targetFolder: string, filename: string): string {
  // Strip any directory traversal or root path from folder
  const safeFolder = targetFolder.replace(/^[\\\/]+/, '').replace(/\.{2,}/g, '');
  const safeFile = sanitizeSafeFilename(filename, 'item');

  // Must only be a simple relative path under safeFolder
  return safeFolder ? `${safeFolder}/${safeFile}` : safeFile;
}
