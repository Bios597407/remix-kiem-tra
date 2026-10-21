import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Renders text containing LaTeX math ($...$, $$...$$), HTML tags (<u>, <b>, <i>, <br>),
 * and markdown bold/italic safely without crashing.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by $$...$$ (display math) and $...$ (inline math)
  // Regex looks for $$...$$ or $...$
  const parts: React.ReactNode[] = [];
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    const matchIndex = match.index;

    // Push the text before the match
    if (matchIndex > lastIndex) {
      const regularText = text.substring(lastIndex, matchIndex);
      parts.push(renderFormattedText(regularText, `text-${lastIndex}`));
    }

    const isDisplay = rawMatch.startsWith('$$') && rawMatch.endsWith('$$');
    const formula = isDisplay
      ? rawMatch.slice(2, -2).trim()
      : rawMatch.slice(1, -1).trim();

    try {
      const html = katex.renderToString(formula, {
        displayMode: isDisplay,
        throwOnError: false,
        strict: false,
      });

      parts.push(
        <span
          key={`math-${matchIndex}`}
          className={isDisplay ? 'my-2 block overflow-x-auto py-1 text-center' : 'inline-block px-0.5'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      parts.push(
        <code key={`math-err-${matchIndex}`} className="rounded bg-rose-50 px-1 py-0.5 font-mono text-rose-600">
          {rawMatch}
        </code>
      );
    }

    lastIndex = matchIndex + rawMatch.length;
  }

  // Push remaining text after last match
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parts.push(renderFormattedText(remainingText, `text-${lastIndex}`));
  }

  return <span className={`math-content ${className}`}>{parts}</span>;
};

/**
 * Helper to render line breaks, bold, italic, and <u> tags within standard text
 */
function renderFormattedText(str: string, keyPrefix: string): React.ReactNode {
  // Support simple HTML like <u>word</u>, <b>, <i>, <mark>
  if (/<(u|b|strong|i|em|mark|span)[\s\S]*?>/i.test(str)) {
    return (
      <span
        key={keyPrefix}
        dangerouslySetInnerHTML={{ __html: str.replace(/\n/g, '<br/>') }}
      />
    );
  }

  // Handle standard line breaks
  const lines = str.split('\n');
  if (lines.length === 1) {
    return <span key={keyPrefix}>{str}</span>;
  }

  return (
    <React.Fragment key={keyPrefix}>
      {lines.map((line, idx) => (
        <React.Fragment key={`${keyPrefix}-ln-${idx}`}>
          {line}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

export default MathRenderer;
