"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, TextField } from "@mui/material";
import { Box, Paper, Typography, IconButton, Container, Link } from "@mui/material";
import { useToast } from "@/lib/context/toast-context";
import { useConfirm } from "@/lib/context/confirm-context";
import {
  Star,
  Calendar,
  Film,
  Tag as TagIcon,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Save,
  ExternalLink,
} from "lucide-react";
import { setRating, deleteRating } from "@/lib/actions/rating";
import { addTagToItem, removeTagFromItem, addTagByGenre, tagExists } from "@/lib/actions/tag";
import { createComment, deleteComment, updateComment, getCommentsByItemId } from "@/lib/actions/comment";
import { EmbyServer, Comment, Tag, ExternalLinkProvider, EmbyItem, Prisma } from "@prisma/client";
import Routes from "@/lib/routes";
import { dbStringToArray } from "@/lib/utils/db-convert";

interface ItemClientProps {
  item: Prisma.LocalItemGetPayload<{ include: { tags: true; rating: true } }> & { embyItem: EmbyItem | null };
  activeServer: EmbyServer;
  externalLinkProviders: ExternalLinkProvider[];
}

export default function ItemClient({ item, activeServer, externalLinkProviders }: ItemClientProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { confirm, setLoading: setConfirmLoading } = useConfirm();

  // 用户交互状态
  const [userRating, setUserRating] = useState<number | null>(item.rating ? item.rating.score : null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tags, setTags] = useState<Tag[]>(item.tags);
  const [newTag, setNewTag] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [loading, setLoading] = useState(false); // 加载注释
  useEffect(() => {
    const loadComments = async () => {
      if (item.id) {
        const result = await getCommentsByItemId(item.id);
        if (result.success) {
          setComments(result.value);
        } else {
          showError(`加载评论失败: ${result.message}`);
        }
      }
    };
    loadComments();
  }, [item.id, showError]);

  // 构建海报URL
  const posterUrl = item.embyItem ? `${activeServer.url}/Items/${item.embyItem.embyId}/Images/Primary` : null;

  // 构建背景URL
  const backdropUrl = item.embyItem ? `${activeServer.url}/Items/${item.embyItem.embyId}/Images/Backdrop` : null;

  // 设置评分
  const handleSetRating = async (score: number) => {
    if (!item.id) {
      showError("项目未关联到本地数据，无法设置评分");
      return;
    }

    if (userRating === score) {
      // 如果点击了当前评分，则取消评分
      setLoading(true);
      // 使用Server Action删除评分
      const result = await deleteRating(item.id);

      if (result.success) {
        setUserRating(null);
        showSuccess("评分已取消");
      } else {
        showError(`取消评分失败: ${result.message}`);
      }
      setLoading(false);
    } else {
      // 否则设置评分
      setLoading(true);
      // 使用Server Action设置评分
      const result = await setRating(item.id, score);

      if (result.success) {
        setUserRating(score);
        showSuccess(`评分已设置为 ${score} 分`);
      } else {
        showError(`设置评分失败: ${result.message}`);
      }
      setLoading(false);
    }
  };

  // 添加标签
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    if (!item.id) {
      showError("项目未关联到本地数据，无法添加标签");
      return;
    }

    setLoading(true);
    // 使用Server Action添加标签
    const result = await addTagToItem(item.id, newTag);

    if (result.success) {
      setTags([...tags, result.value]);
      setNewTag("");
      showSuccess("标签添加成功");
    } else {
      showError(`添加标签失败: ${result.message}`);
    }
    setLoading(false);
  };

  // 删除标签
  const handleRemoveTag = async (tagId: number, tagName: string) => {
    const confirmed = await confirm({
      title: "确认删除标签",
      message: `确定要从此项目中移除标签 "${tagName}" 吗？此操作不会删除标签本身，只是将其从当前项目中移除。`,
      confirmText: "删除",
    });

    if (!confirmed) return;

    if (!item.id || !tagId) return;
    setLoading(true);
    setConfirmLoading(true);
    const result = await removeTagFromItem(item.id, tagId);
    if (result.success) {
      setTags(tags.filter((tag) => tag.id !== tagId));
      showSuccess("标签移除成功");
    } else {
      showError(`移除标签失败: ${result.message}`);
    }
    setLoading(false);
    setConfirmLoading(false);
  };

  // 添加评论
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!item.id) {
      showError("项目未关联到本地数据，无法添加评论");
      return;
    }

    setLoading(true);
    // 使用Server Action创建评论
    const result = await createComment(item.id, newComment);

    if (result.success) {
      setComments([...comments, result.value]);
      setNewComment("");
      showSuccess("评论添加成功");
    } else {
      showError(`添加评论失败: ${result.message}`);
    }
    setLoading(false);
  };

  // 编辑评论
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  // 保存编辑后的评论
  const handleSaveComment = async () => {
    if (!editingCommentId || !editCommentText.trim()) return;
    setLoading(true);
    const result = await updateComment(editingCommentId, editCommentText);
    if (result.success) {
      setComments(
        comments.map((comment) =>
          comment.id === editingCommentId ? { ...comment, content: editCommentText } : comment
        )
      );
      setEditingCommentId(null);
      setEditCommentText("");
      showSuccess("评论更新成功");
    } else {
      showError(`更新评论失败: ${result.message}`);
    }
    setLoading(false);
  };

  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    const confirmed = await confirm({
      title: "确认删除评论",
      message: "确定要删除这条评论吗？此操作无法撤销。",
      confirmText: "删除",
    });
    if (!confirmed) return;
    if (!commentId) return;
    setLoading(true);
    setConfirmLoading(true);
    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(comments.filter((comment) => comment.id !== commentId));
      showSuccess("评论删除成功");
    } else {
      showError(`删除评论失败: ${result.message}`);
    }
    setLoading(false);
    setConfirmLoading(false);
  };

  // 转换 Emby genre 为本地标签
  const handleEmbyGenreClick = async (genre: string) => {
    genre = genre.trim();
    // 检查该项是否已有同名本地标签
    const existingTag = tags.find((tag) => tag.name === genre);
    if (existingTag) {
      // 如果已有同名标签，直接返回
      return;
    }
    // 检查是否已存在同名标签
    const exist = await tagExists(genre);
    if (!exist.success) {
      showError(`检查标签 "${genre}" 是否存在失败: ${exist.message}`);
      return;
    }
    if (exist.value) {
      // 如果已存在同名标签，仅添加到当前项目
      setLoading(true);
      const result = await addTagToItem(item.id, genre);
      if (result.success) {
        setTags([...tags, result.value]);
        showSuccess(`标签添加成功`);
      } else {
        showError(`添加标签失败: ${result.message}`);
      }
      setLoading(false);
      return;
    }

    // 弹出确认对话框
    const confirmed = await confirm({
      title: "确认创建标签",
      message: `即将创建标签 "${genre}" 并将其添加到所有包含此类型的项目中。此操作将影响多个项目，确认继续吗？`,
      confirmText: "创建",
    });

    if (!confirmed) return;

    setLoading(true);
    setConfirmLoading(true);
    const result = await addTagByGenre(genre, activeServer.id);
    if (result.success) {
      // 重新获取标签列表
      setTags([...tags, result.value]);
      showSuccess("标签创建成功");
    } else {
      showError(`创建标签失败: ${result.message}`);
    }
    setLoading(false);
    setConfirmLoading(false);
  };

  const kv = new Map(externalLinkProviders.map((provider) => [provider.key, provider]));
  let externalIds: Record<string, string> | null = null;
  if (typeof item.externalIds === "object" && item.externalIds !== null) {
    externalIds = item.externalIds as Record<string, string>;
  }

  return (
    <>
      {/* 背景图 */}
      {backdropUrl && (
        <Box sx={{ position: "absolute", left: 0, top: 0, width: "100%", height: 384, overflow: "hidden", zIndex: -1 }}>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: (theme) => `linear-gradient(to top, ${theme.palette.background.default}, transparent)`,
            }}
          />
          <img src={backdropUrl} alt={item.title} style={{ objectFit: "cover", opacity: 0.3 }} />
        </Box>
      )}

      {/* 内容区域 */}
      <Container maxWidth="xl" sx={{ pt: 8, pb: 16 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 8 }}>
          {/* 左侧海报区 */}
          <Box sx={{ width: { xs: "100%", md: "33.333%" }, flexShrink: 0 }}>
            <Box sx={{ aspectRatio: "2/3", position: "relative", borderRadius: 2, overflow: "hidden", boxShadow: 3 }}>
              {posterUrl && (
                <img src={posterUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </Box>

            {/* 评分选择区 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <Star style={{ marginRight: 8, width: 16, height: 16 }} /> 我的评分
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <IconButton
                    key={score}
                    onClick={() => handleSetRating(score)}
                    disabled={loading}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: userRating === score ? "warning.main" : "action.hover",
                      color: userRating === score ? "white" : "text.primary",
                      "&:hover": { backgroundColor: userRating === score ? "warning.dark" : "warning.light" },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {score}
                  </IconButton>
                ))}
              </Box>
            </Box>

            {/* 外部链接区 */}
            {(externalIds || item.embyItem) && (
              <Box sx={{ mt: 6 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  外部链接
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {/* Emby 详情页 */}
                  {item.embyItem && (
                    <Link
                      href={`${activeServer.url}/web/index.html#!/item?id=${item.embyItem.embyId}&serverId=${activeServer.remoteId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="none"
                    >
                      <Button variant="outlined" sx={{ gap: 1 }}>
                        <ExternalLink style={{ width: 16, height: 16 }} />在 Emby 中查看
                      </Button>
                    </Link>
                  )}
                  {/* 其它外部链接 */}
                  {externalIds &&
                    Object.entries(externalIds).map(([key, value]) => {
                      const externalId = kv.get(key);
                      if (!externalId) return null;
                      const link = externalId.template.replace("{value}", value);
                      return (
                        <Link key={key} href={link} target="_blank" rel="noopener noreferrer" underline="none">
                          <Button variant="outlined" sx={{ gap: 1 }}>
                            <ExternalLink style={{ width: 16, height: 16 }} /> {externalId.name}
                          </Button>
                        </Link>
                      );
                    })}
                </Box>
              </Box>
            )}
          </Box>

          {/* 右侧详情区 */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
              {item.title}
            </Typography>
            {item.originalTitle && item.originalTitle !== item.title && (
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                {item.originalTitle}
              </Typography>
            )}

            {/* 基本信息标签 */}
            <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {item.premiereDate && (
                <Chip
                  variant="outlined"
                  icon={<Calendar style={{ width: 12, height: 12 }} />}
                  label={item.premiereDate.toLocaleDateString("zh-Hans-CN")}
                  size="small"
                />
              )}
              {item.type === "Movie" && (
                <Chip variant="outlined" icon={<Film style={{ width: 12, height: 12 }} />} label="电影" size="small" />
              )}
            </Box>

            {/* 标签管理区域 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <TagIcon style={{ marginRight: 8, width: 16, height: 16 }} /> 标签
              </Typography>

              {/* 本地标签 */}
              {tags.length > 0 ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    我的标签
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        variant="filled"
                        color="primary"
                        icon={<TagIcon style={{ width: 12, height: 12 }} />}
                        label={tag.name}
                        size="small"
                        onClick={() => router.push(Routes.tagDetail({ id: tag.id.toString() }))}
                        onDelete={() => handleRemoveTag(tag.id, tag.name)}
                        sx={{
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          "&:hover": { bgcolor: "primary.dark" },
                          "& .MuiChip-deleteIcon": {
                            color: "primary.contrastText",
                            "&:hover": { color: "primary.contrastText", opacity: 0.8 },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mb: 2, p: 2, borderRadius: 1, border: "1px dashed" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                    暂无标签，可新建或从下方 Emby 标签添加
                  </Typography>
                </Box>
              )}

              {/* Emby 标签区域 */}
              {item.embyItem?.genres && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Emby 标签
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {dbStringToArray(item.embyItem.genres).map((genre: string) => (
                      <Chip
                        key={`emby-${genre}`}
                        variant="outlined"
                        color={tags.some((tag) => tag.name === genre) ? "primary" : "secondary"}
                        icon={<Plus style={{ width: 12, height: 12 }} />}
                        label={genre}
                        size="small"
                        onClick={() => handleEmbyGenreClick(genre)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "secondary.main", borderColor: "secondary.main" },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* 添加新标签区域 */}
              <Box
                sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  添加新标签
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="输入标签名称..."
                    size="small"
                    sx={{
                      flexGrow: 1,
                      maxWidth: 300,
                      "& .MuiOutlinedInput-root": { "&:hover fieldset": { borderColor: "primary.main" } },
                    }}
                    onKeyDown={(e) => {
                      if (!e.nativeEvent.isComposing && e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddTag}
                    disabled={loading || !newTag.trim()}
                    variant="contained"
                    sx={{ gap: 0.5, minWidth: 80 }}
                  >
                    <Plus style={{ width: 16, height: 16 }} /> 添加
                  </Button>
                </Box>
              </Box>
            </Box>

            {item.overview && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  剧情简介
                </Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {
                    // 支持 <br> 换行, 但避免 HTML 注入
                    item.overview.split(/<br\s*\/?>/gi).map((line, index, array) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < array.length - 1 && <br />}
                      </React.Fragment>
                    ))
                  }
                </Typography>
              </Box>
            )}

            {/* 评论区域 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <MessageSquare style={{ marginRight: 8, width: 16, height: 16 }} /> 评论
              </Typography>

              {/* 添加评论 */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="写下你的评论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                    发表评论
                  </Button>
                </Box>
              </Box>

              {/* 评论列表 */}
              {comments.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">暂无评论，快来添加第一条评论吧！</Typography>
                </Paper>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {comments.map((comment) => (
                    <Paper key={comment.id} sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.createdAt).toLocaleString("zh-CN")}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleEditComment(comment)} disabled={loading}>
                            <Edit size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={loading}
                            sx={{ color: "error.main" }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>

                      {editingCommentId === comment.id ? (
                        <Box>
                          <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            variant="outlined"
                            sx={{ mb: 2 }}
                          />
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditCommentText("");
                              }}
                              disabled={loading}
                            >
                              取消
                            </Button>
                            <Button
                              onClick={handleSaveComment}
                              disabled={loading || !editCommentText.trim()}
                              sx={{ gap: 0.5 }}
                            >
                              <Save style={{ width: 16, height: 16 }} /> 保存
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{comment.content}</Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
}
