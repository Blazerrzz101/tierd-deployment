// A comprehensive profanity filter for community discussions
// This helps maintain a respectful environment without stifling expression

// Common profanity words to filter
// This is a minimal list - in a production app, you would use a more comprehensive list or a service
const PROFANITY_LIST = [
  "fuck", "shit", "ass", "bitch", "cunt", "dick", "bastard", "whore", "slut", 
  "piss", "damn", "hell", "crap", "cock", "pussy", "asshole", "dumbass", "motherfucker",
  "bullshit", "fag", "faggot", "nigger", "twat", "wanker", "retard", "moron", "idiot",
  // Add more words as needed
];

// Words that should be allowed even if they contain filtered substrings
const ALLOWED_WORDS = [
  "class", "classic", "assignment", "assassin", "assume", "assumption", "pass", "passion", 
  "hell-bent", "hello", "cockatoo", "peacock", "gamecock", "cockpit", "cocktail", 
  "scunthorpe", "analysis", "analytical", "passionate", "assist", "assistance"
];

/**
 * Checks if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // First check allowed words
  for (const allowedWord of ALLOWED_WORDS) {
    lowerText.replace(new RegExp("\\b" + allowedWord + "\\b", "gi"), "");
  }
  
  // Then check for profanity
  return PROFANITY_LIST.some(word => 
    new RegExp("\\b" + word + "\\b", "i").test(lowerText)
  );
}

/**
 * Censors profanity in text, replacing with asterisks
 */
export function censorProfanity(text: string): string {
  if (!text) return text;
  
  let censoredText = text;
  
  // First check allowed words and temporarily replace them
  const placeholders: Record<string, string> = {};
  
  ALLOWED_WORDS.forEach((word, index) => {
    const placeholder = `__ALLOWED_${index}__`;
    const regex = new RegExp("\\b" + word + "\\b", "gi");
    censoredText = censoredText.replace(regex, (match) => {
      placeholders[placeholder] = match;
      return placeholder;
    });
  });
  
  // Then censor profanity
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp("\\b" + word + "\\b", "gi");
    censoredText = censoredText.replace(regex, match => 
      match.charAt(0) + "*".repeat(match.length - 1)
    );
  });
  
  // Restore allowed words
  Object.entries(placeholders).forEach(([placeholder, word]) => {
    censoredText = censoredText.replace(placeholder, word);
  });
  
  return censoredText;
}

/**
 * Highlights profanity in text for moderation purposes
 */
export function highlightProfanity(text: string): string {
  if (!text) return text;
  
  let highlightedText = text;
  
  // First check allowed words and temporarily replace them
  const placeholders: Record<string, string> = {};
  
  ALLOWED_WORDS.forEach((word, index) => {
    const placeholder = `__ALLOWED_${index}__`;
    const regex = new RegExp("\\b" + word + "\\b", "gi");
    highlightedText = highlightedText.replace(regex, (match) => {
      placeholders[placeholder] = match;
      return placeholder;
    });
  });
  
  // Then highlight profanity
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp("\\b" + word + "\\b", "gi");
    highlightedText = highlightedText.replace(regex, match => 
      `<span class="bg-red-500/20 text-red-700 dark:text-red-400 px-1 rounded">${match}</span>`
    );
  });
  
  // Restore allowed words
  Object.entries(placeholders).forEach(([placeholder, word]) => {
    highlightedText = highlightedText.replace(placeholder, word);
  });
  
  return highlightedText;
} 