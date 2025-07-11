import { getAllComments } from "@/lib/actions/comment";
import CommentsClient from "./comments-client";
import { unstable_noStore } from "next/cache";

export default async function CommentsPage() {
  unstable_noStore();
  // 在服务器端获取所有评论数据
  const res = await getAllComments();
  if (!res.success) {
    throw new Error(res.message || "获取评论失败");
  }

  // 将数据传递给客户端组件
  return <CommentsClient initialComments={res.value} />;
}
