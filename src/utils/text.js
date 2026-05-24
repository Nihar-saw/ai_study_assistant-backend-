export const limitText = (text = "", maxChars = 30000) => {
  if (text.length <= maxChars) return text;

  const headLength = Math.floor(maxChars * 0.7);
  const tailLength = maxChars - headLength;

  return `${text.slice(0, headLength)}\n\n[...middle of PDF omitted for length...]\n\n${text.slice(-tailLength)}`;
};

