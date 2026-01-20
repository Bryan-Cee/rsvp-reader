import { NextResponse } from "next/server";

const API_HOST = "project-gutenberg-free-books-api1.p.rapidapi.com";
const API_BASE_URL = `https://${API_HOST}/books`;
const MAX_LIMIT = 120;
const MAX_REMOTE_PAGES = 10;

export const revalidate = 3600;

const fetchBooksPage = async (url, apiKey) => {
  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": API_HOST,
    },
    cache: "no-store",
  });

  if (!response?.ok) {
    throw new Error(`RapidAPI request failed with status ${response?.status}`);
  }

  return response.json();
};

export async function GET(request) {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing RAPIDAPI_KEY environment variable." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url ?? "");
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "60", 10);
  const targetLimit = Number.isNaN(rawLimit)
    ? 60
    : Math.max(1, Math.min(rawLimit, MAX_LIMIT));

  const aggregated = [];
  let nextPageUrl = API_BASE_URL;
  let pageCount = 0;

  try {
    while (
      aggregated.length < targetLimit &&
      nextPageUrl &&
      pageCount < MAX_REMOTE_PAGES
    ) {
      const data = await fetchBooksPage(nextPageUrl, apiKey);
      aggregated.push(...(data?.results ?? []));
      nextPageUrl = data?.next ?? null;
      pageCount += 1;
    }

    return NextResponse.json({ results: aggregated.slice(0, targetLimit) });
  } catch (error) {
    console.error("Failed to fetch RapidAPI Gutenberg books", error);
    return NextResponse.json(
      { error: "Unable to load books from Project Gutenberg." },
      { status: 502 },
    );
  }
}
