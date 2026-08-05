import { dataPath } from "./paths";
import { safeReadJsonl } from "./utils";
import type { TractionReview } from "@/lib/types/traction";

const REVIEWS_PATH = dataPath("traction", "reviews.jsonl");

export async function readTractionReviews(): Promise<TractionReview[]> {
  return safeReadJsonl<TractionReview>(REVIEWS_PATH);
}
