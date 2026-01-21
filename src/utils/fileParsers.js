import JSZip from "jszip";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".epub"]);

const stripHtmlTags = (value = "") =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const deriveTitleFromName = (fileName = "") => {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExt.replace(/[_-]+/g, " ").trim();
  if (normalized) return normalized;
  return "Untitled Upload";
};

const readPlainText = async (file) => file.text();

const extractTextFromPdf = async (file) => {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
  const workerSrcModule = await import("pdfjs-dist/build/pdf.worker.min.js");
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrcModule?.default ?? workerSrcModule;

  const pdfData = await file.arrayBuffer();
  const task = pdfjsLib.getDocument({ data: pdfData, useWorkerFetch: false });
  const pdf = await task.promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const strings = textContent.items
      .map((item) => (typeof item?.str === "string" ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    pages.push(strings);
  }

  return pages.join("\n\n").trim();
};

const extractTextFromEpub = async (file) => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const htmlEntries = Object.keys(zip.files).filter((name) =>
    /\.(xhtml|html|htm)$/i.test(name),
  );

  const chapters = [];
  for (const entryName of htmlEntries) {
    const entry = zip.files[entryName];
    if (!entry) continue;
    const raw = await entry.async("string");
    const normalized = stripHtmlTags(raw);
    if (normalized) {
      chapters.push(normalized);
    }
  }

  const combined = chapters.join("\n\n").trim();
  if (!combined) {
    throw new Error("No readable chapters found in this EPUB.");
  }
  return combined;
};

const getExtension = (fileName = "") => {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return `.${parts.pop()?.toLowerCase?.() ?? ""}`;
};

const countWords = (text = "") =>
  text
    ?.trim()
    ?.split(/\s+/)
    ?.filter(Boolean)?.length ?? 0;

export const parseUploadedFile = async (file) => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  const extension = getExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported file type. Please use TXT, Markdown, PDF, or EPUB.");
  }

  let content = "";
  if (extension === ".pdf") {
    content = await extractTextFromPdf(file);
  } else if (extension === ".epub") {
    content = await extractTextFromEpub(file);
  } else {
    content = await readPlainText(file);
  }

  const normalizedContent = content.trim();
  if (!normalizedContent) {
    throw new Error("The uploaded file does not contain readable text.");
  }

  const title = deriveTitleFromName(file.name);
  const wordCount = countWords(normalizedContent);
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 250));

  return {
    title,
    author: "Uploaded File",
    content: normalizedContent,
    wordCount,
    estimatedMinutes,
    sourceType: "upload",
    suggestedCategory: wordCount <= 20000 ? "quick-reads" : "uploads",
    fileName: file.name,
  };
};

export const supportedUploadExtensions = Array.from(SUPPORTED_EXTENSIONS);
