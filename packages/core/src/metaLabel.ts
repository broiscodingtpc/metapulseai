type MetaOutput = { label: string; metaScore: number; reason?: string };

// Rate limit tracking
let rateLimitInfo = {
  requestsToday: 0,
  tokensToday: 0,
  lastReset: new Date(),
  isRateLimited: false,
  retryAfter: 0
};

export function heuristicMeta(name?: string, symbol?: string, desc?: string): MetaOutput {
  const s = `${name ?? ""} ${symbol ?? ""} ${desc ?? ""}`.toLowerCase();
  
  // Advanced pattern matching with scoring
  const tests: [string, RegExp, number][] = [
    // High priority (viral potential)
    ["ai-agents", /\b(ai|agent|gpt|llm|claude|gemini|neural|bot|assistant|chat|openai)/i, 75],
    ["frogs", /\b(pepe|frog|kermit|toad|ribbit|amphibian)/i, 72],
    ["celeb", /\b(elon|trump|taylor|mrbeast|kardash|kanye|bieber|celebrity)/i, 70],
    
    // Seasonal/trending
    ["halloween", /\b(spook|ghost|pumpkin|witch|vampire|zombie|skeleton|haunted)/i, 68],
    ["gaming", /\b(game|minecraft|fortnite|esport|gamer|play|arena|quest|pixel)/i, 68],
    
    // Meme categories
    ["doge-meme", /\b(doge|shiba|bonk|inu|dog|puppy|woof|bark)/i, 70],
    ["meme", /\b(meme|viral|wojak|chad|based|cringe|gigachad|sigma)/i, 65],
    
    // Finance
    ["defi", /\b(defi|yield|farm|liquidity|stake|swap|pool|vault|apy)/i, 65],
    
    // Other
    ["anime", /\b(anime|manga|kawaii|waifu|naruto|pokemon|otaku)/i, 65],
    ["politics", /\b(politic|election|vote|govern|democrat|republican)/i, 60],
    ["sports", /\b(sport|football|basketball|soccer|nba|nfl|athlete)/i, 60],
    ["music", /\b(music|song|album|concert|festival|dj|artist|rapper)/i, 60],
    ["art", /\b(art|nft|artist|paint|canvas|creative|design)/i, 60],
    ["tech", /\b(tech|blockchain|web3|protocol|defi|crypto|solana)/i, 60]
  ];
  
  // Check each pattern and return first match
  for (const [label, rx, baseScore] of tests) {
    if (rx.test(s)) {
      // Boost score if multiple keywords found
      const matches = s.match(rx);
      const boost = matches && matches.length > 1 ? 5 : 0;
      return { 
        label, 
        metaScore: Math.min(85, baseScore + boost), 
        reason: `Strong ${label} signals detected - potential trend match` 
      };
    }
  }
  
  // Check for red flags (spam indicators)
  const spamPatterns = /\b(test|sample|demo|xxx|scam|rug)\b/i;
  if (spamPatterns.test(s)) {
    return { 
      label: "unknown", 
      metaScore: 20, 
      reason: "⚠️ Potential spam detected - low quality signals" 
    };
  }
  
  return { 
    label: "unknown", 
    metaScore: 45, 
    reason: "No strong meta pattern - needs more data" 
  };
}

export async function llmMeta(
  input: { name?: string; symbol?: string; desc?: string; stats: any },
  key?: string,
  model?: string
): Promise<MetaOutput> {
  if (!key || !model) return heuristicMeta(input.name, input.symbol, input.desc);
  
  // Check if we're rate limited
  if (rateLimitInfo.isRateLimited) {
    const now = new Date();
    const timeSinceLimit = now.getTime() - rateLimitInfo.lastReset.getTime();
    if (timeSinceLimit < rateLimitInfo.retryAfter * 1000) {
      console.log(`⏳ Rate limited, using heuristic fallback. Retry in ${Math.ceil((rateLimitInfo.retryAfter * 1000 - timeSinceLimit) / 1000)}s`);
      return heuristicMeta(input.name, input.symbol, input.desc);
    } else {
      rateLimitInfo.isRateLimited = false;
      rateLimitInfo.retryAfter = 0;
    }
  }

  // Check daily limits (conservative approach)
  const today = new Date().toDateString();
  if (rateLimitInfo.lastReset.toDateString() !== today) {
    rateLimitInfo.requestsToday = 0;
    rateLimitInfo.tokensToday = 0;
    rateLimitInfo.lastReset = new Date();
  }

  // Conservative limits to stay well under 500K TPD and 14.4K RPD
  if (rateLimitInfo.requestsToday >= 10000) { // Stay well under 14.4K RPD
    console.log("📊 Daily request limit reached, using heuristic fallback");
    return heuristicMeta(input.name, input.symbol, input.desc);
  }

  if (rateLimitInfo.tokensToday >= 400000) { // Stay well under 500K TPD
    console.log("📊 Daily token limit reached, using heuristic fallback");
    return heuristicMeta(input.name, input.symbol, input.desc);
  }
  
  try {
    console.log("🤖 Calling Gemini API for meta analysis...");
    const prompt = `You are MetaPulse AI, an elite crypto market intelligence system. Your mission: identify HIGH-POTENTIAL metas that traders can profit from.

TRENDING CATEGORIES (Prioritize these):
🤖 ai-agents: AI, GPT, agents, neural networks, Claude, Gemini, chatbots, assistants
🐸 frogs: Pepe, Kermit, frog memes, amphibian, toad, ribbit
⭐ celeb: Elon, Trump, Taylor Swift, Kardashian, celebrity names
🎃 halloween: Spooky, ghost, pumpkin, witch, vampire, zombie
🎮 gaming: Games, esports, Minecraft, Fortnite, gaming platforms
🐕 doge-meme: Doge, Shiba, Bonk, dog memes, woof, puppy
🏛️ politics: Elections, political figures, governance, voting
💰 defi: DeFi, yield, farm, swap, liquidity, vault, staking
😂 meme: Viral memes, wojak, chad, internet culture
🎌 anime: Anime characters, manga, kawaii, otaku
⚽ sports: Teams, athletes, World Cup, Olympics
🎵 music: Musicians, songs, concerts, festivals
🎨 art: NFTs, digital art, artists, creative
💻 tech: Blockchain, crypto tech, Web3, protocols

SCORING CRITERIA:
🔥 90-100: Viral potential, strong trend, high activity
⚡ 70-89: Good momentum, growing trend
💎 50-69: Moderate interest, watchlist material
⚠️ 30-49: Low activity, risky
❌ 0-29: Very weak, likely spam

ANALYZE THIS TOKEN:
Name: ${input.name || 'Unknown'}
Symbol: ${input.symbol || 'Unknown'}
Market Activity: ${input.stats?.buyers || 0} buyers, ${input.stats?.sellers || 0} sellers
Initial Buy: ${input.stats?.solAmount || 0} SOL
Market Cap: $${input.stats?.marketCap || 0}

CRITICAL: Look for:
- Is this part of a trending narrative?
- Does the name/symbol match current viral themes?
- Is there whale activity (large buys)?
- Are there multiple buyers (organic interest)?

Respond with JSON only: {"label": "category", "metaScore": number, "reason": "short explanation with trading insight"}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 300,
        responseMimeType: "application/json"
      }
    };
    
    console.log("🤖 Gemini request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    // Track usage
    rateLimitInfo.requestsToday++;
    const estimatedTokens = Math.ceil(prompt.length / 4) + 300; // Rough estimate
    rateLimitInfo.tokensToday += estimatedTokens;

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Gemini API error:", response.status, response.statusText);
      console.log("❌ Error details:", errorText);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          rateLimitInfo.isRateLimited = true;
          rateLimitInfo.retryAfter = parseInt(retryAfter);
          rateLimitInfo.lastReset = new Date();
          console.log(`⏳ Rate limited, will retry after ${retryAfter} seconds`);
        }
      }
      
      return heuristicMeta(input.name, input.symbol, input.desc);
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    
    console.log("🤖 Gemini response:", text);
    
    try { 
      const obj = JSON.parse(text);
      console.log("✅ Meta analysis result:", obj);
      return obj; 
    } catch (parseError) {
      console.log("❌ Failed to parse Gemini response:", parseError);
      return heuristicMeta(input.name, input.symbol, input.desc);
    }
  } catch (error) {
    console.log("❌ Gemini API call failed:", error);
    return heuristicMeta(input.name, input.symbol, input.desc);
  }
}
