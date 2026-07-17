import React from 'react';

export function formatMessage(text: string) {
  // If it's an image format ![image](url)
  const imgRegex = /^!\[image\]\((.*?)\)$/;
  const match = text.match(imgRegex);
  if (match) {
    return (
      <a href={match[1]} target="_blank" rel="noreferrer" className="block w-full max-w-[200px] md:max-w-[250px] overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={match[1]} alt="Uploaded content" className="w-full h-auto object-cover hover:opacity-90 transition-opacity" />
      </a>
    );
  }

  // Otherwise parse *bold* and _italic_
  // We split by a regex that captures both to interleave them properly
  const tokens = text.split(/(\*.*?\*|_.*?_)/g);
  
  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
          return <strong key={i} className="font-bold">{token.slice(1, -1)}</strong>;
        }
        if (token.startsWith('_') && token.endsWith('_') && token.length > 2) {
          return <em key={i} className="italic">{token.slice(1, -1)}</em>;
        }
        return <React.Fragment key={i}>{token}</React.Fragment>;
      })}
    </>
  );
}
