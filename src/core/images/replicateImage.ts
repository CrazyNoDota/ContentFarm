import { writeFile } from "node:fs/promises";
import path from "node:path";
import Replicate from "replicate";

export async function generateReplicateImage(prompt: string, outputDir: string, index: number): Promise<string | undefined> {
  if (process.env.REPLICATE_IMAGE_ENABLED !== "true" || !process.env.REPLICATE_API_TOKEN) {
    return undefined;
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
  });

  const model = process.env.REPLICATE_IMAGE_MODEL ?? "black-forest-labs/flux-2-pro";
  const output = await replicate.run(model as `${string}/${string}` | `${string}/${string}:${string}`, {
    input: {
      prompt,
      resolution: process.env.REPLICATE_IMAGE_RESOLUTION ?? "1 MP",
      aspect_ratio: process.env.REPLICATE_IMAGE_ASPECT_RATIO ?? "9:16",
      input_images: [],
      output_format: process.env.REPLICATE_IMAGE_FORMAT ?? "webp",
      output_quality: readNumberEnv("REPLICATE_IMAGE_QUALITY", 80),
      safety_tolerance: readNumberEnv("REPLICATE_SAFETY_TOLERANCE", 2)
    }
  });

  const imageUrl = extractOutputUrl(output);
  if (!imageUrl) return undefined;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Replicate image download failed: ${response.status} ${response.statusText}`);
  }

  const extension = process.env.REPLICATE_IMAGE_FORMAT ?? "webp";
  const filePath = path.join(outputDir, `replicate-${String(index).padStart(2, "0")}.${extension}`);
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  return filePath;
}

function extractOutputUrl(output: unknown): string | undefined {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output.find((item) => typeof item === "string");
    return typeof first === "string" ? first : undefined;
  }
  if (output && typeof output === "object") {
    const record = output as Record<string, unknown>;
    if (typeof record.url === "string") return record.url;
    if (typeof record.output === "string") return record.output;
    if (Array.isArray(record.output)) return extractOutputUrl(record.output);
  }
  return undefined;
}

function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
