import { getAllLocalItems } from "@/lib/actions/item";
import { ItemsAdmin } from "./client";
import { unstable_noStore } from "next/cache";
import { getAllTags } from "@/lib/actions/tag";

export default async function ItemsAdminPage() {
  unstable_noStore();
  const [localItems, tags] = await Promise.all([getAllLocalItems(), getAllTags()]);
  if (!localItems.success) {
    throw new Error(localItems.message);
  }
  if (!tags.success) {
    throw new Error(tags.message);
  }
  return <ItemsAdmin localItems={localItems.value} allTags={tags.value} />;
}
