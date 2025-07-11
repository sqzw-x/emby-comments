"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layouts/main-layout";
import { SearchHeader, ContentArea, Pagination, paginateArray } from "@/components/common";
import { MediaCard } from "@/components/media/media-card";
import Routes from "@/lib/routes";
import { Box, Typography, Paper, Chip, IconButton, Stack, TextField } from "@mui/material";
import { ArrowLeft, Edit, Trash2, Tag as TagIcon, X, Check } from "lucide-react";
import { EmbyServer, Prisma } from "@prisma/client";
import { deleteTag, updateTag } from "@/lib/actions/tag";
import { useConfirm } from "@/lib/context/confirm-context";
import { useToast } from "@/lib/context/toast-context";

interface TagDetailClientProps {
  tag: Prisma.TagGetPayload<{
    include: {
      items: { include: { tags: true; rating: true; embyItems: true } };
      _count: { select: { items: true } };
    };
  }>;
  activeServer: EmbyServer;
}

export default function TagDetailClient({ tag, activeServer }: TagDetailClientProps) {
  const router = useRouter();
  const { confirm, setLoading: setConfirmLoading } = useConfirm();
  const { showError, showSuccess } = useToast();

  // 合并标签状态
  const [tagState, setTagState] = useState(tag);

  // 编辑时的临时状态
  const [editingTag, setEditingTag] = useState(tag);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(18); // 每页显示18个项目（6x3网格）
  const [isEditing, setIsEditing] = useState(false);

  // 更新编辑状态字段
  const updateEditingField = (field: keyof typeof editingTag, value: string) => {
    setEditingTag((prev) => ({ ...prev, [field]: value.trim() }));
  };

  // 过滤项目
  const filteredItems = useMemo(() => {
    return tag.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.originalTitle && item.originalTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tag.items, searchTerm]);

  // 分页数据
  const paginatedData = useMemo(() => {
    return paginateArray(filteredItems, currentPage, pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // 当搜索条件变化时重置页码
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 删除标签
  const handleDeleteTag = async () => {
    const confirmed = await confirm({
      title: "删除标签",
      message: `确定要删除标签"${tagState.name}"吗？这将从所有关联项目中移除此标签。`,
      confirmText: "删除",
      cancelText: "取消",
    });

    if (!confirmed) return;

    setConfirmLoading(true);
    const result = await deleteTag(tag.id);
    setConfirmLoading(false);

    if (result.success) {
      router.push(Routes.tags());
      showSuccess("标签删除成功");
    } else {
      showError(`删除标签失败: ${result.message}`);
    }
  };

  // 更新标签
  const handleUpdateTag = async () => {
    if (
      editingTag.name === tagState.name &&
      editingTag.group === tagState.group &&
      editingTag.description === tagState.description
    ) {
      setIsEditing(false);
      return;
    }
    setLoading(true);
    const result = await updateTag(tag.id, editingTag.name, editingTag.description ?? undefined, editingTag.group);
    if (result.success) {
      setIsEditing(false);
      setTagState(editingTag);
      showSuccess("标签更新成功");
    } else {
      showError(`更新标签失败: ${result.message}`);
    }
    setLoading(false);
  };

  // 将项目转换为MediaCard所需的格式
  const convertItemForCard = (item: (typeof tag.items)[0]) => ({
    ...item,
    createdAt: new Date(), // MediaCard需要但在这里不重要的字段
    updatedAt: new Date(), // MediaCard需要但在这里不重要的字段
    rating: item.rating?.score || null,
    tags: item.tags.map((tag) => tag.name),
    embyItem: item.embyItems.length > 0 ? item.embyItems[0] : null,
  });

  return (
    <MainLayout>
      {/* 标签信息头部 */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ flex: 1 }}>
            <IconButton
              onClick={() => router.back()}
              sx={{ bgcolor: "action.hover", "&:hover": { bgcolor: "action.selected" }, mt: 1 }}
            >
              <ArrowLeft />
            </IconButton>
            <TagIcon size={32} color="#666" style={{ marginTop: 8 }} />
            <Stack spacing={2} sx={{ flex: 1 }}>
              {isEditing ? (
                // 编辑模式
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      value={editingTag.name}
                      onChange={(e) => updateEditingField("name", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateTag();
                        }
                      }}
                      variant="outlined"
                      size="small"
                      sx={{
                        "& .MuiInputBase-input": { fontSize: "2rem", fontWeight: "bold", padding: "8px 12px" },
                        minWidth: "300px",
                      }}
                      autoFocus
                    />
                    {/* 确认更改 */}
                    <IconButton onClick={handleUpdateTag} disabled={loading}>
                      <Check size={20} />
                    </IconButton>
                    {/* 取消编辑 */}
                    <IconButton
                      onClick={() => {
                        setEditingTag(tagState);
                        setIsEditing(false);
                      }}
                      disabled={loading}
                    >
                      <X size={20} />
                    </IconButton>
                  </Stack>
                  <TextField
                    value={editingTag.group}
                    onChange={(e) => updateEditingField("group", e.target.value)}
                    label="标签分组"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ maxWidth: "300px" }}
                  />
                  <TextField
                    value={editingTag.description}
                    onChange={(e) => updateEditingField("description", e.target.value)}
                    placeholder="添加标签描述..."
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    fullWidth
                    sx={{ maxWidth: "600px" }}
                  />
                </Stack>
              ) : (
                // 显示模式
                <Stack spacing={1}>
                  <Typography variant="h4" component="h1" fontWeight="bold">
                    {tagState.name}
                  </Typography>
                  {tagState.group && (
                    <Typography variant="body2" color="primary" sx={{ fontWeight: "medium" }}>
                      分组: {tagState.group}
                    </Typography>
                  )}
                  {tagState.description && (
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: "600px" }}>
                      {tagState.description}
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            {!isEditing && (
              // 编辑按钮
              <IconButton
                onClick={() => {
                  setEditingTag(tagState);
                  setIsEditing(true);
                }}
                sx={{
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.main" },
                }}
              >
                <Edit size={20} />
              </IconButton>
            )}
            {/* 删除按钮 */}
            <IconButton
              onClick={handleDeleteTag}
              disabled={loading}
              sx={{ bgcolor: "error.light", color: "error.contrastText", "&:hover": { bgcolor: "error.main" } }}
            >
              <Trash2 size={20} />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label={`${tag._count.items} 个项目`} variant="outlined" size="medium" />
        </Stack>
      </Paper>

      {/* 项目列表 */}
      <SearchHeader
        title={`标签: ${tagState.name}`}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜索项目..."
      />

      <ContentArea>
        {paginatedData.items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? "未找到匹配的项目" : "此标签下暂无项目"}
            </Typography>
            {searchTerm && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                尝试调整搜索条件
              </Typography>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(5, 1fr)",
                xl: "repeat(6, 1fr)",
              },
              gap: 2,
              px: 1,
            }}
          >
            {paginatedData.items.map((item) => (
              <MediaCard key={item.id} item={convertItemForCard(item)} activeServer={activeServer} />
            ))}
          </Box>
        )}
      </ContentArea>

      {paginatedData.pagination.totalPages > 1 && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Pagination
            currentPage={currentPage}
            totalPages={paginatedData.pagination.totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={paginatedData.pagination.totalItems}
          />
        </Box>
      )}
    </MainLayout>
  );
}
