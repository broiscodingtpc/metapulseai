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
  const tests: [string, RegExp][] = [
    ["ai-agents", /\b(ai|agent|gpt|llm|nexus|neural|morph|bot|assistant|chat)/i],
    ["frogs", /\b(pepe|frog|kermit|toad|amphibian)/i],
    ["celeb", /\b(elon|trump|taylor|mrbeast|celebr|kardash|bieber)/i],
    ["halloween", /\b(spook|ghost|pumpkin|howl|hallow|zombie|witch|vampire)/i],
    ["gaming", /\b(game|arena|quest|pixel|8bit|esport|play|gamer|controller)/i],
    ["doge-meme", /\b(doge|shiba|bonk|inu|dog|puppy|woof)/i],
    ["defi", /\b(defi|yield|farm|liquidity|stake|swap|pool|vault)/i],
    ["meme", /\b(meme|viral|wojak|chad|based|cringe)/i]
  ];
  
  // Check each pattern and return first match
  for (const [label, rx] of tests) {
    if (rx.test(s)) {
      return { label, metaScore: 70, reason: `Heuristic match: detected ${label} keywords` };
    }
  }
  
  return { label: "unknown", metaScore: 50, reason: "No strong pattern match" };
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
    console.log("🤖 Calling Groq API for meta analysis...");
    const prompt = `You are MetaPulse AI, an advanced market intelligence system. Analyze this token and classify it into the most appropriate meta category. You can use existing categories or create new ones based on emerging patterns.

EXISTING CATEGORIES:
- ai-agents: AI, GPT, neural networks, machine learning, automation
- frogs: Pepe, Kermit, frog memes, amphibian themes
- celeb: Elon Musk, Trump, Taylor Swift, MrBeast, celebrities
- halloween: Spooky, ghost, pumpkin, horror, Halloween themes
- gaming: Games, esports, gaming platforms, gaming communities
- doge-meme: Doge, Shiba Inu, dog memes, canine themes
- politics: Political themes, elections, governance
- nsfw: Adult content, explicit themes
- defi: DeFi protocols, yield farming, liquidity, staking
- meme: General memes, viral content, internet culture
- anime: Anime, manga, Japanese culture, otaku themes
- sports: Sports teams, athletes, competitions
- music: Musicians, songs, music industry
- art: NFTs, digital art, creative projects
- tech: Technology, innovation, startups, tech companies
- unknown: Unclear or insufficient information

ANALYSIS INSTRUCTIONS:
1. Look for emerging patterns and trends
2. Create new categories if you see a new meta emerging
3. Consider the token's name, symbol, and any available description
4. Analyze market stats for trend indicators
5. Provide a metaScore 0-100 based on trend potential and market activity

Token Info:
- Name: ${input.name || 'Unknown'}
- Symbol: ${input.symbol || 'Unknown'}  
- Description: ${input.desc || 'No description'}
- Stats: ${JSON.stringify(input.stats)}

Respond with JSON only: {"label": "category", "metaScore": number, "reason": "explanation"}`;

    const requestBody = { 
      model, 
      messages: [{ role: "user", content: prompt }], 
      temperature: 0.3,
      max_tokens: 300
    };
    
    console.log("🤖 Groq request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${key}` 
      },
      body: JSON.stringify(requestBody)
    });

    // Track usage
    rateLimitInfo.requestsToday++;
    const estimatedTokens = Math.ceil(prompt.length / 4) + 300; // Rough estimate
    rateLimitInfo.tokensToday += estimatedTokens;

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Groq API error:", response.status, response.statusText);
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
    const text = json.choices?.[0]?.message?.content ?? "";
    
    console.log("🤖 Groq response:", text);
    
    try { 
      const obj = JSON.parse(text);
      console.log("✅ Meta analysis result:", obj);
      return obj; 
    } catch (parseError) {
      console.log("❌ Failed to parse Groq response:", parseError);
      return heuristicMeta(input.name, input.symbol, input.desc);
    }
  } catch (error) {
    console.log("❌ Groq API call failed:", error);
    return heuristicMeta(input.name, input.symbol, input.desc);
  }
}
