export function cleanText(text: string) {
  return text.replace(/&#(\d+);/g, function (match, dec) {
    return String.fromCharCode(dec);
  });
}
