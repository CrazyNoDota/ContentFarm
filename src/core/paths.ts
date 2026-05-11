import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const paths = {
  personas: path.join(repoRoot, "personas"),
  seedData: path.join(repoRoot, "data", "seeds"),
  state: path.join(repoRoot, "data", "state"),
  outputs: path.join(repoRoot, "outputs"),
  renders: path.join(repoRoot, "outputs", "renders")
};

export async function ensureWorkspace(): Promise<void> {
  await Promise.all([
    mkdir(paths.state, { recursive: true }),
    mkdir(paths.outputs, { recursive: true }),
    mkdir(paths.renders, { recursive: true })
  ]);
}
