/**
 * Lightweight Text Analysis utility for Sahayam
 * Detects spam, keyboard mashing, excessive capitalization, and basic profanity.
 */

const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'bastard',
  'motherfucker', 'nigger', 'faggot', 'retard', 'spam', 'scam', 'crypto', 'bitcoin', 'investment'
];

/**
 * Evaluates text for spam/abusive patterns.
 * @param {string} text - The input string to check
 * @returns {object} { isSpam: boolean, reason: string | null }
 */
const evaluateText = (text) => {
  if (!text || typeof text !== 'string') return { isSpam: false, reason: null };

  const cleanText = text.trim();
  if (cleanText.length < 3) return { isSpam: true, reason: 'Text too short' };

  // 1. Check for basic profanity/spam words
  const lowercaseText = cleanText.toLowerCase();
  for (const word of BAD_WORDS) {
    // Regex boundary to match exact words
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowercaseText)) {
      return { isSpam: true, reason: 'Contains restricted vocabulary' };
    }
  }

  // 2. Check for excessive capitalization (over 70% in strings > 10 chars)
  if (cleanText.length > 10) {
    const capsCount = (cleanText.match(/[A-Z]/g) || []).length;
    const alphaCount = (cleanText.match(/[a-zA-Z]/g) || []).length;
    
    if (alphaCount > 5 && (capsCount / alphaCount) > 0.8) {
      return { isSpam: true, reason: 'Excessive capitalization detected' };
    }
  }

  // 3. Check for keyboard mashing (e.g., asdasd, fffff)
  // Matches 4 or more identical consecutive characters OR 4 or more consecutive alternating characters (e.g., abababab)
  if (/(.)\1{4,}/i.test(cleanText)) {
    return { isSpam: true, reason: 'Keyboard mashing detected (repeating chars)' };
  }
  
  // Checking for common mash patterns
  const mashPatterns = [/asdf/i, /qwer/i, /zxcv/i, /hjkl/i];
  if (mashPatterns.some(pattern => pattern.test(cleanText))) {
     // Only flag if it's a huge part of the string or the string is very short
     if (cleanText.length < 15) {
       return { isSpam: true, reason: 'Keyboard mashing detected (home row)' };
     }
  }

  return { isSpam: false, reason: null };
};

module.exports = { evaluateText };
