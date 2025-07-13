"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchHeader, ContentArea, Pagination, paginateArray } from "@/components/common";
import { Card, CardContent, Typography, Stack, Chip, Button as MuiButton } from "@mui/material";
import { Eye, Trash, Calendar, Film } from "lucide-react";
import { deleteComment } from "@/lib/actions/comment";
import { useToast } from "@/lib/context/toast-context";
import { useConfirm } from "@/lib/context/confirm-context";
import Routes from "@/lib/routes";
import { Prisma } from "@prisma/client";

// 扩展类型以适应API返回的数据结构
type CommentWithItem = Prisma.CommentGetPayload<{
  include: {
    localItem: {
      include: {
        embyItems: true;
      };
    };
  };
}>;

interface CommentsClientProps {
  initialComments: CommentWithItem[];
}

export default function CommentsClient({ initialComments }: CommentsClientProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [comments, setComments] = useState<CommentWithItem[]>(initialComments);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 每页显示10条评论

  // 删除评论 - 使用 Server Action
  const handleDeleteComment = async (commentId: number) => {
    const confirmed = await confirm.confirm({
      title: "删除评论",
      message: "确定要删除这条评论吗？此操作无法撤销。",
      confirmText: "删除",
    });

    if (!confirmed) return;

    confirm.setLoading(true);
    // 使用 Server Action 删除评论
    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast.showSuccess("评论删除成功");
    } else {
      toast.showError(`删除评论失败: ${result.message}`);
    }
    confirm.setLoading(false);
  };

  // 过滤评论
  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      const contentMatch = comment.content.toLowerCase().includes(searchTerm.toLowerCase());
      const titleMatch = comment.localItem?.title.toLowerCase().includes(searchTerm.toLowerCase());
      return contentMatch || titleMatch;
    });
  }, [comments, searchTerm]);

  // 分页数据
  const paginatedData = useMemo(() => {
    return paginateArray(filteredComments, currentPage, pageSize);
  }, [filteredComments, currentPage, pageSize]);

  // 当搜索条件变化时重置页码
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <>
      {/* 搜索头部 */}
      <SearchHeader
        title="评论管理"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜索评论..."
      />

      {/* 内容区域 */}
      <ContentArea
        isEmpty={paginatedData.items.length === 0}
        emptyMessage={searchTerm ? `没有找到与"${searchTerm}"匹配的评论` : "还没有添加任何评论"}
        skeletonType="list"
        skeletonCount={5}
      >
        <Stack spacing={3}>
          <Stack spacing={2}>
            {paginatedData.items.map((comment) => {
              return (
                <Card key={comment.id} variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 2 }}
                    >
                      {comment.localItem ? (
                        <Typography variant="h6" component="h3" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Film size={16} /> {comment.localItem.title}
                        </Typography>
                      ) : (
                        <Typography variant="h6" component="h3" color="text.secondary">
                          已删除的项目
                        </Typography>
                      )}
                      <Chip
                        icon={<Calendar size={14} />}
                        label={comment.createdAt.toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
                      {comment.content}
                    </Typography>
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      {comment.localItem && (
                        <MuiButton
                          variant="outlined"
                          size="small"
                          startIcon={<Eye size={16} />}
                          onClick={() => router.push(Routes.itemDetail({ id: comment.localItem.id.toString() }))}
                        >
                          查看项目
                        </MuiButton>
                      )}
                      <MuiButton
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<Trash size={16} />}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        删除
                      </MuiButton>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {/* 分页组件 */}
          {filteredComments.length > pageSize && (
            <Pagination
              currentPage={paginatedData.pagination.currentPage}
              totalPages={paginatedData.pagination.totalPages}
              onPageChange={setCurrentPage}
              showPageSizeSelector={true}
              pageSize={pageSize}
              totalItems={filteredComments.length}
              pageSizeOptions={[5, 10, 20, 50]}
              onPageSizeChange={(newSize) => {
                setCurrentPage(1);
                setPageSize(newSize);
              }}
            />
          )}
        </Stack>
      </ContentArea>
    </>
  );
}
