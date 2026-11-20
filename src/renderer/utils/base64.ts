// RFC 7617: Basic credentials are UTF-8. btoa() alone takes Latin-1 only: "ç" gets the wrong bytes and "€" throws.
export const base64Utf8 = (text: string): string => {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
};
