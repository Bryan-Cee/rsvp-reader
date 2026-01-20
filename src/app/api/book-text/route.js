import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["www.gutenberg.org", "gutenberg.org"]);

export const revalidate = 3600;

const isAllowedUrl = (value) => {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_HOSTS.has(parsed.hostname?.toLowerCase?.())
    );
  } catch (error) {
    return false;
  }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url ?? "");
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url query parameter." },
      { status: 400 },
    );
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json(
      { error: "Invalid or unsupported text source." },
      { status: 400 },
    );
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      redirect: "follow",
      cache: "no-store",
    });

    if (!upstreamResponse?.ok) {
      return NextResponse.json(
        { error: "Upstream source returned an error." },
        { status: upstreamResponse?.status ?? 502 },
      );
    }

    const text = await upstreamResponse.text();

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to proxy Gutenberg text", error);
    return NextResponse.json(
      { error: "Failed to load book content." },
      { status: 502 },
    );
  }
}
