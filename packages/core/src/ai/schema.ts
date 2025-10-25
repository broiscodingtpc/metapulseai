import { z } from "zod";

export const AiScoreSchema = z.object({
  prob_enterable: z.number().min(0).max(1),
  risk: z.enum(["LOW","MEDIUM","HIGH"]),
  expected_roi_p50: z.number().min(0),
  expected_roi_p90: z.number().min(0),
  reasoning: z.string().min(6).max(800)
});

export type AiScore = z.infer<typeof AiScoreSchema>;

export const ModelResponseSchema = z.object({
  model: z.string(),
  response: AiScoreSchema,
  timestamp: z.number(),
  tokens_used: z.number().optional(),
  latency_ms: z.number().optional()
});

export type ModelResponse = z.infer<typeof ModelResponseSchema>;

export const ConsensusResultSchema = z.object({
  groq: ModelResponseSchema,
  gemini: ModelResponseSchema,
  consensus: AiScoreSchema,
  delta: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1)
});

export type ConsensusResult = z.infer<typeof ConsensusResultSchema>;