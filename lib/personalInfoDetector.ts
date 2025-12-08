// Detect personal information patterns in text
export function detectPersonalInfo(text: string) {
  const personalInfoPatterns = [
    { type: 'name', pattern: /^(?:my name is|i am|i'm|called|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i },
    { type: 'city', pattern: /(?:from|in|live in|living in|from the city of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i },
    { type: 'country', pattern: /(?:from|in|live in|in the country of|from the country of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i },
    { type: 'age', pattern: /(?:i'm|i am|age is)\s+(\d{1,3})\s+years?\s+old/i },
    { type: 'occupation', pattern: /(?:i'm|i am|work as|work in|occupation is)\s+([a-z\s]+)/i },
  ];

  const detectedInfo: Array<{ type: string; value: string }> = [];

  personalInfoPatterns.forEach(({ type, pattern }) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      detectedInfo.push({
        type,
        value: match[1].trim(),
      });
    }
  });

  return detectedInfo;
}

// Format detected info for display
export function formatDetectedInfo(detectedInfo: Array<{ type: string; value: string }>) {
  if (detectedInfo.length === 0) return null;

  const formatted = detectedInfo.map(info => {
    const typeLabel = info.type.charAt(0).toUpperCase() + info.type.slice(1);
    return `${typeLabel}: ${info.value}`;
  }).join(', ');

  return formatted;
}

// Create a message asking about fact-checking
export function createPersonalInfoMessage(detectedInfo: Array<{ type: string; value: string }>) {
  if (detectedInfo.length === 0) return null;

  const formatted = formatDetectedInfo(detectedInfo);
  
  return `I detected that you mentioned: ${formatted}. Would you like me to verify any facts related to this information?`;
}
