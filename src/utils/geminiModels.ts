/**
 * Centralized Gemini AI Model Management & Fallback Logic
 * Version: 2025.10.15 - Strict HTTP 404 Prevention
 */

export const DEFAULT_MODEL = 'gemini-3-flash-preview';

/**
 * List of fallback models in priority order.
 * If the primary model returns 404, we immediately try these.
 */
export const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

/**
 * Checks localStorage for deprecated models and overrides them with the new default.
 * This prevents the app from reloading old, broken model configurations.
 */
export function initializeAndClearModelCache(): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const stored = localStorage.getItem(key);
      if (stored && (
        stored.includes('gemini-2.5-flash') || 
        stored.includes('gemini-1.5-flash') || 
        stored.includes('gemini-2.0-flash')
      )) {
        console.warn(`[AI System] Detected deprecated model reference in localStorage key "${key}". Overriding with "${DEFAULT_MODEL}".`);
        
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            let changed = false;
            const deepReplace = (obj: any) => {
              for (const k in obj) {
                if (typeof obj[k] === 'string' && (obj[k].includes('gemini-2.5-flash') || obj[k].includes('gemini-1.5-flash') || obj[k].includes('gemini-2.0-flash'))) {
                  obj[k] = DEFAULT_MODEL;
                  changed = true;
                } else if (typeof obj[k] === 'object' && obj[k] !== null) {
                  deepReplace(obj[k]);
                }
              }
            };
            deepReplace(parsed);
            if (changed) localStorage.setItem(key, JSON.stringify(parsed));
          } else {
            localStorage.setItem(key, DEFAULT_MODEL);
          }
        } catch {
          localStorage.setItem(key, DEFAULT_MODEL);
        }
      }
    }
  } catch (err) {
    console.error('Error clearing model cache:', err);
  }
}

/**
 * Generic Fetch Wrapper with Automatic Fallback for 404 / Unavailable Models
 */
export async function fetchGeminiWithFallback(
  requestBody: any,
  apiKey: string,
  options?: {
    temperature?: number;
    responseMimeType?: string;
    maxOutputTokens?: number;
    onModelTry?: (modelName: string) => void;
  }
): Promise<{ data: any; usedModel: string }> {
  let lastError = '';
  
  const candidates = Array.from(new Set([DEFAULT_MODEL, ...FALLBACK_MODELS]));

  for (const modelName of candidates) {
    if (options?.onModelTry) options.onModelTry(modelName);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            responseMimeType: options?.responseMimeType ?? 'application/json',
            maxOutputTokens: options?.maxOutputTokens ?? 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const lowerError = errorText.toLowerCase();
        
        if (
          response.status === 404 || 
          lowerError.includes('not found') || 
          lowerError.includes('no longer available') ||
          lowerError.includes('not_found')
        ) {
          console.warn(`[AI System] Model "${modelName}" is unavailable (HTTP ${response.status}). Trying next candidate...`);
          lastError = `[${modelName}] 404 Not Found`;
          continue;
        }
        
        lastError = `[${modelName}] HTTP ${response.status}: ${errorText}`;
        continue;
      }

      const data = await response.json();
      localStorage.setItem('exam_ai_gemini_model', modelName);
      return { data, usedModel: modelName };

    } catch (err: any) {
      console.error(`[AI System] Critical error with model "${modelName}":`, err);
      lastError = err.message || String(err);
      continue;
    }
  }

  throw new Error(`Tất cả mô hình AI đều không khả dụng. Lỗi cuối cùng: ${lastError}`);
}

/**
 * Utility to extract text candidates from Gemini response
 */
export function extractTextFromGeminiResponse(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const nonThoughtParts = parts.filter(
    (p: { text?: string; thought?: boolean }) => typeof p.text === 'string' && !p.thought
  );
  
  return nonThoughtParts.length > 0
    ? nonThoughtParts.map((p: { text: string }) => p.text).join('\n')
    : parts.map((p: { text?: string }) => p.text || '').join('\n');
}

/**
 * Safe JSON Parser with automatic cleaning, auto-closure, and error recovery.
 * Guaranteed to not crash the application.
 */
export function safeJsonParse(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return null;

  try {
    let cleaned = rawText.trim();

    // 1. Remove Markdown code blocks
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleaned = codeBlockMatch[1].trim();
    } else {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    // Direct JSON parse attempt
    try {
      return JSON.parse(cleaned);
    } catch { /* proceed */ }

    // Strip JS-style comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // Extract JSON object or array bounds
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    if (firstBrace !== -1 && lastBrace > firstBrace && (firstBracket === -1 || firstBrace < firstBracket)) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch { /* proceed */ }
    } else if (firstBracket !== -1 && lastBracket > firstBracket) {
      const candidate = cleaned.slice(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(candidate);
      } catch { /* proceed */ }
    }

    // Sanitized string parse attempt
    try {
      const sanitized = sanitizeJsonStringLiterals(cleaned)
        .replace(/,\s*([\]\}])/g, '$1')
        .replace(/:\s*,/g, ': null,');
      return JSON.parse(sanitized);
    } catch { /* proceed */ }

    // Auto-closed parse attempt
    try {
      const closed = autoCloseJson(cleaned);
      const sanitized = sanitizeJsonStringLiterals(closed)
        .replace(/,\s*([\]\}])/g, '$1')
        .replace(/:\s*,/g, ': null,');
      return JSON.parse(sanitized);
    } catch { /* proceed */ }

    // Salvage balanced objects
    const salvaged = salvageBalancedObjects(cleaned);
    if (salvaged && salvaged.length > 0) {
      if (salvaged.length === 1) return salvaged[0];
      const bestObj = salvaged.find((o) => o && typeof o === 'object' && (o.chuDe || o.cap || o.mon));
      if (bestObj) return bestObj;
      return salvaged;
    }

    return null;
  } catch (err) {
    console.warn('[AI System] safeJsonParse caught exception:', err);
    return null;
  }
}

/** Legacy alias for compatibility */
export const tryRepairJson = safeJsonParse;

function autoCloseJson(str: string): string {
  if (!str) return str;
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}') {
      if (stack[stack.length - 1] === '{') stack.pop();
    } else if (ch === ']') {
      if (stack[stack.length - 1] === '[' ) stack.pop();
    }
  }

  let result = str;
  if (inString) {
    result += '"';
  }

  result = result.replace(/,\s*$/g, '');

  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') result += '}';
    else if (open === '[') result += ']';
  }

  return result;
}

function sanitizeJsonStringLiterals(str: string): string {
  let result = '';
  let inString = false;
  let i = 0;

  while (i < str.length) {
    const char = str[i];
    if (!inString) {
      if (char === '"') inString = true;
      result += char;
      i++;
      continue;
    }
    if (char === '"') {
      inString = false;
      result += char;
      i++;
      continue;
    }
    if (char === '\n') {
      result += '\\n';
      i++;
      continue;
    }
    if (char === '\\') {
      const nextChar = str[i + 1] || '';
      if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar)) {
        result += char + nextChar;
        i += 2;
        continue;
      }
      result += '\\\\';
      i++;
      continue;
    }
    result += char;
    i++;
  }
  return result;
}

function salvageBalancedObjects(str: string): any[] {
  const results: any[] = [];
  let inString = false;
  let escaped = false;
  let depth = 0;
  let objStart = -1;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const rawObj = str.slice(objStart, i + 1);
          try {
            results.push(JSON.parse(rawObj));
          } catch {
            try {
              results.push(JSON.parse(sanitizeJsonStringLiterals(rawObj).replace(/,\s*([\]\}])/g, '$1')));
            } catch { /* ignore broken snippet */ }
          }
          objStart = -1;
        }
      }
    }
  }
  return results;
}
