"use server";

import { revalidatePath } from "next/cache";
import { fetchMasterFormOptions, mutateMasterRecord } from "./master-mutations-server";
import type { MasterTableName } from "@/app/constants/master";
import type { MasterMutationInput, MasterMutationResult } from "@/app/utils/master-validation";

export async function mutateMasterRecordAction(
  input: MasterMutationInput
): Promise<MasterMutationResult> {
  const result = await mutateMasterRecord(input);
  if (result.success) {
    for (const path of [
      "/master",
      "/documents",
      "/videos",
      "/applications",
      "/categories",
      "/members",
      "/trash",
    ]) {
      revalidatePath(path);
    }
  }
  return result;
}

export async function fetchMasterFormOptionsAction(table: MasterTableName, id?: number) {
  try {
    return { options: await fetchMasterFormOptions(table, id), error: null };
  } catch (error) {
    return {
      options: null,
      error: error instanceof Error ? error.message : "選択肢の取得に失敗しました。",
    };
  }
}
