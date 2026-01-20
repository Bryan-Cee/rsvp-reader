export const remapGutenbergTextUrl = (url) => {
  if (!url || typeof url !== "string") {
    return url ?? null;
  }

  try {
    const parsed = new URL(url);

    if (!parsed.hostname?.includes("gutenberg.org")) {
      return url;
    }

    if (parsed.pathname?.startsWith("/cache/epub/")) {
      return url;
    }

    const ebookMatch = parsed.pathname?.match(/\/ebooks\/(\d+)/);

    if (!ebookMatch?.[1]) {
      return url;
    }

    const bookId = ebookMatch[1];
    const hyphenZero = parsed.pathname?.includes("-0") ? "-0" : "";

    return `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}${hyphenZero}.txt`;
  } catch (error) {
    return url;
  }
};
