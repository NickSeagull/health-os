import { dataPath } from "./paths";
import { safeReadJson, safeWriteJson } from "./utils";
import type { ProfileData } from "@/lib/types/profile";

const PROFILE_PATH = () => dataPath("profile.json");

export async function readProfile(): Promise<ProfileData | null> {
  return safeReadJson<ProfileData>(PROFILE_PATH());
}

export async function writeProfile(data: ProfileData): Promise<void> {
  await safeWriteJson(PROFILE_PATH(), data);
}
