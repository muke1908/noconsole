import React from 'react';

export function highlightText(text: string, search: string, caseSensitive: boolean): React.ReactNode[] {
  if (!search) return [text];

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapeRegex(search)})`, flags);
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = caseSensitive 
      ? part === search 
      : part.toLowerCase() === search.toLowerCase();
    
    if (isMatch) {
      return React.createElement('mark', { key: i, className: 'bg-yellow-400 text-black' }, part);
    }
    return part;
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
