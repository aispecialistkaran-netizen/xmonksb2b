import { NextResponse } from "next/server";

// Curated high-converting, witty & motivational B2B sales/outreach quotes
const CURATED_SALES_QUOTES = [
  {
    quote: "May your coffee be strong and your pipeline follow-ups be warm today ☕",
    tag: "Morning Fuel",
  },
  {
    quote: "Every 'no' is just a 'yes' waiting for a better follow-up 🎯",
    tag: "Pipeline Truth",
  },
  {
    quote: "Prospects may ghost, but your tenacity will haunt their inbox 👻",
    tag: "Outreach Grit",
  },
  {
    quote: "Behind every signed enterprise contract was a rep who followed up one more time 💼",
    tag: "Closer's Mindset",
  },
  {
    quote: "May your objections be few and your decision-makers actually on the call 📞",
    tag: "Sales Prayers",
  },
  {
    quote: "Coffee is for closers, but cold outreach is for champions 🏆",
    tag: "Closer's Coffee",
  },
  {
    quote: "A clean pipeline and a 15-minute scheduled demo cures all monday blues ✨",
    tag: "Rep Therapy",
  },
  {
    quote: "Your prospect didn't reject you; their inbox just wasn't ready for your brilliance 💡",
    tag: "Inbox Wisdom",
  },
  {
    quote: "Outreach is like fishing: patience, the right hook, and never leaving the water early 🎣",
    tag: "Sales Philosophy",
  },
  {
    quote: "Drink the coffee, personalize the first line, and let's go hunt some enterprise logos 🚀",
    tag: "Deal Hunter",
  },
  {
    quote: "Remember: The best time to follow up was yesterday. The second best time is right now ⏰",
    tag: "Action Rule",
  },
  {
    quote: "Keep calm and check your sent folder for 'Contract Signed' 🎉",
    tag: "Closing Vibe",
  },
  {
    quote: "Sales is 10% product, 10% timing, and 80% relentless friendly persistence 🤝",
    tag: "Sales Reality",
  },
  {
    quote: "May your decision-makers have budget, urgency, and calendar availability today 🗓️",
    tag: "B2B Dream",
  },
  {
    quote: "The CRM never sleeps, and neither does our pursuit of quota smashing 📈",
    tag: "Quota Crusher",
  },
];

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const apiKey =
    process.env.gemini_api_key ||
    process.env.GEMINI_API_KEY ||
    "";

  // Try generating via Gemini if key is present
  if (apiKey) {
    const prompt = `You are an elite, witty B2B corporate sales copywriter.
Generate a single witty, humorous, yet genuinely motivating B2B sales and outreach one-liner quote (strictly under 18 words) for a sales rep doing cold outreach, closing deals, and managing pipelines.
Incorporate fun sales themes like coffee, warm leads, gatekeepers, follow-up persistence, decision makers, and quota crushing. Include an emoji at the end.
Respond ONLY with a valid JSON object matching:
{
  "quote": "your short witty quote here",
  "tag": "e.g. Closer's Coffee, Outreach Grit, Pipeline Truth, Deal Energy"
}`;

    for (const model of CANDIDATE_MODELS) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              responseMimeType: "application/json",
            },
          }),
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw.trim());
            if (parsed.quote) {
              return NextResponse.json({
                quote: parsed.quote,
                tag: parsed.tag || "Sales Wisdom",
                source: "ai",
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      } catch (e) {
        // Fallback to next model or curated
      }
    }
  }

  // Fallback to curated quotes
  const randomIndex = Math.floor(Math.random() * CURATED_SALES_QUOTES.length);
  const selected = CURATED_SALES_QUOTES[randomIndex];

  return NextResponse.json({
    quote: selected.quote,
    tag: selected.tag,
    source: "curated",
    timestamp: new Date().toISOString(),
  });
}
