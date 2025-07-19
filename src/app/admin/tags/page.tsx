import { unstable_noStore } from "next/cache";

import { getAllTags } from "@/lib/actions/tag";

import { TagsAdmin } from "./client";

export default async function TagsAdminPage() {
  unstable_noStore();
  const result = await getAllTags();

  if (!result.success) {
    throw new Error(result.message);
  }

  const groups = new Set(result.value.map((tag) => tag.group));

  return <TagsAdmin initData={result.value} groups={groups} />;
}
