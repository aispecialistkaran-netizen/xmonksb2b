import { NextResponse } from "next/server";

// Fallback curated quotes if third-party public API is temporarily unreachable
const FALLBACK_QUOTES = [
  {
    quote: "May your coffee be strong and your pipeline follow-ups be warm today ☕",
    tag: "Morning Fuel",
  },
  {
    quote: "Every 'no' is just a 'yes' waiting for a better follow-up 🎯",
    tag: "Pipeline Truth",
  },
  {
    quote: "Behind every signed contract was a rep who followed up one more time 💼",
    tag: "Motivation",
  },
  {
    quote: "Prospects may ghost, but your tenacity will haunt their inbox 👻",
    tag: "Sales Humor",
  },
  {
    quote: "Coffee is for closers, but cold outreach is for champions 🏆",
    tag: "Closer's Coffee",
  },
  {
    quote: "Success is dependent upon the glands — sweat glands 💦",
    tag: "Zig Ziglar",
  },
  {
    quote: "The secret of getting ahead is getting started 🚀",
    tag: "Mark Twain",
  },
  {
    quote: "Your prospect didn't reject you; their inbox just wasn't ready for your brilliance 💡",
    tag: "Sales Humor",
  },
  {
    quote: "Don't watch the clock; do what it does. Keep going ⏰",
    tag: "Sam Levenson",
  },
  {
    quote: "May your objections be few and your decision-makers actually on the call 📞",
    tag: "Sales Humor",
  },
];

interface QuoteResult {
  quote: string;
  tag: string;
  source: string;
}

// 1. Fetch from DummyJSON Quotes (Free Public API - Motivational)
async function fetchDummyJsonQuote(): Promise<QuoteResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch("https://dummyjson.com/quotes/random", {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.quote) {
        return {
          quote: data.quote,
          tag: data.author ? `${data.author}` : "Motivation",
          source: "dummyjson",
        };
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

// 2. Fetch from ZenQuotes (Free Public API - Inspirational)
async function fetchZenQuote(): Promise<QuoteResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch("https://zenquotes.io/api/random", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.q) {
        return {
          quote: data[0].q,
          tag: data[0].a ? `${data[0].a}` : "Inspiration",
          source: "zenquotes",
        };
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

// 3. Fetch from ICanHazDadJoke (Free Public API - Funny / Humor)
async function fetchFunnyDadJoke(): Promise<QuoteResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch("https://icanhazdadjoke.com/", {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "xMonksB2BApp/1.0",
      },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.joke) {
        return {
          quote: data.joke,
          tag: "Daily Humor 😄",
          source: "icanhazdadjoke",
        };
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

// 4. Fetch from Official Joke API (Free Public API - Funny / Laughs)
async function fetchOfficialJoke(): Promise<QuoteResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch("https://official-joke-api.appspot.com/random_joke", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.setup && data.punchline) {
        return {
          quote: `${data.setup} — ${data.punchline}`,
          tag: "Sales Laugh 😂",
          source: "official-joke-api",
        };
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

export async function GET() {
  // Alternate between funny and motivational online APIs (50% funny, 50% motivational)
  const isHumor = Math.random() > 0.5;

  const primaryFetchers = isHumor
    ? [fetchFunnyDadJoke, fetchOfficialJoke, fetchDummyJsonQuote, fetchZenQuote]
    : [fetchDummyJsonQuote, fetchZenQuote, fetchFunnyDadJoke, fetchOfficialJoke];

  // Try the free public online APIs in order
  for (const fetcher of primaryFetchers) {
    const result = await fetcher();
    if (result && result.quote) {
      return NextResponse.json({
        quote: result.quote,
        tag: result.tag,
        source: result.source,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Fallback to curated quote catalog if network offline
  const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  return NextResponse.json({
    quote: randomFallback.quote,
    tag: randomFallback.tag,
    source: "local-fallback",
    timestamp: new Date().toISOString(),
  });
}
