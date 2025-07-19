import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { LocalItem } from "@prisma/client";
import * as Lucide from "lucide-react";
import { useCallback, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

import { getUnmappedLocalItems } from "@/lib/actions/server";
import type { ItemMapOperation, ItemSyncResult, MatchStatus } from "@/lib/service/item";

export type LocalStatus = MatchStatus | "pending";
export const StatusMap: Map<LocalStatus, string> = new Map([
  ["exact", "精确匹配"],
  ["multiple", "候选匹配"],
  ["none", "无匹配"],
  ["matched", "已匹配"],
  ["pending", "操作队列"],
]);

export const ActionMap: Map<ItemMapOperation["type"], string> = new Map([
  ["map", "建立映射"],
  ["create", "新建项目"],
  ["unmap", "移除映射"],
  ["refresh", "刷新数据"],
]);

const ActionStyles = {
  map: { bgColor: "#2563eb", color: "#ffffff" },
  create: { bgColor: "#16a34a", color: "#ffffff" },
  unmap: { bgColor: "#e04646ff", color: "#ffffff" },
  refresh: { bgColor: "#f7a518ff", color: "#ffffff" },
};

export const renderMatchStatusIcon = (status: LocalStatus) => {
  switch (status) {
    case "exact":
      return <Lucide.CheckCircle style={{ width: 16, height: 16, color: "#16a34a" }} />;
    case "multiple":
      return <Lucide.MapPin style={{ width: 16, height: 16, color: "#ca8a04" }} />;
    case "none":
      return <Lucide.Link style={{ width: 16, height: 16, color: "#dc2626" }} />;
    case "matched":
      return <Lucide.Check style={{ width: 16, height: 16, color: "#2563eb" }} />;
    case "pending":
      return <Lucide.Clock style={{ width: 16, height: 16, color: "#f59e0b" }} />;
  }
};

export type ExtendedResult = ItemSyncResult & {
  selected?: LocalItem;
  pendingAction?: ItemMapOperation;
};

// 匹配项目显示组件
interface MatchItemDisplayProps {
  item: LocalItem;
  score?: number;
  onSelect?: (id: number) => void;
}

function MatchItemDisplay({ item, score, onSelect }: MatchItemDisplayProps) {
  const isSelected = !!onSelect;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: isSelected ? 2 : 1.5,
        border: isSelected ? 1 : 0,
        borderColor: isSelected ? "divider" : "transparent",
        backgroundColor: isSelected ? "background.paper" : "action.hover",
        borderRadius: 1,
        gap: 1,
        mt: isSelected ? 2 : 0,
      }}
    >
      <Box flex={1} minWidth={0}>
        <Typography
          variant="body2"
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          title={item.title}
        >
          {item.title}
        </Typography>
        {item.premiereDate && (
          <Chip
            label={item.premiereDate.toLocaleDateString("zh-Hans-CN")}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.75rem", height: 24, flexShrink: 0 }}
          />
        )}
      </Box>

      {onSelect && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {score !== undefined && (
            <Chip
              label={`${Math.round(score * 100)}%`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.75rem", height: 24 }}
            />
          )}
          {
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSelect(item.id)}
              sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
            >
              选择
            </Button>
          }
        </Stack>
      )}
    </Box>
  );
}

// 统一的项目卡片组件
interface ItemCardProps {
  item: ExtendedResult;
  selected: boolean;
  onToggle: () => void;
  actions: {
    onClick: (item: ExtendedResult) => void;
    label: string;
    icon: Lucide.LucideIcon;
    variant?: "outlined" | "contained";
  }[];
  onSelectMatch?: (localItem: LocalItem) => void;
  onSelectBestMatch?: () => void;
}

export function ItemCard({ item, selected, onToggle, actions = [], onSelectMatch }: ItemCardProps) {
  const hasPendingAction = !!item.pendingAction; // 操作队列
  const isCreate = item.pendingAction?.type === "create"; // 操作队列-新建
  const isMatched = item.selected || (item.matches.length > 0 && !hasPendingAction);
  const selectedMatch = item.selected ?? item.matches.at(0);

  // 计算卡片样式
  const getCardStyles = () => {
    if (isMatched && !hasPendingAction) {
      return {
        borderColor: "success.main",
        bgcolor: isCreate ? "primary.50" : "success.50",
        "&:hover": { bgcolor: isCreate ? "primary.100" : "success.100" },
      };
    }
    return {
      borderColor: hasPendingAction ? "primary.main" : "divider",
      backgroundColor: hasPendingAction ? "action.hover" : "background.paper",
    };
  };

  return (
    <Card variant="outlined" sx={getCardStyles()}>
      <CardContent
        sx={{
          p: isMatched && !hasPendingAction ? 3 : 2,
          "&:last-child": { pb: isMatched && !hasPendingAction ? 3 : 2 },
        }}
      >
        {/* 主要内容区域 */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1} gap={2}>
          <Box
            display="flex"
            alignItems="flex-start"
            gap={isMatched && !hasPendingAction ? 2 : 1.5}
            flex={1}
            minWidth={0}
          >
            <Checkbox
              checked={selected}
              onChange={onToggle}
              size="small"
              sx={{ mt: isMatched && !hasPendingAction ? 0.5 : 0.25, flexShrink: 0 }}
            />

            <Box flex={1} minWidth={0}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: "medium",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "300px",
                  }}
                  title={item.item.title}
                >
                  {item.item.title}
                </Typography>

                {item.item.premiereDate && (
                  <Chip
                    label={item.item.premiereDate.toLocaleDateString("zh-Hans-CN")}
                    size="small"
                    variant="outlined"
                    color={isMatched && !hasPendingAction ? "default" : undefined}
                    sx={{ fontSize: "0.75rem", height: 24, flexShrink: 0 }}
                  />
                )}

                <Chip
                  label={item.item.type}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem", height: 24, flexShrink: 0 }}
                />

                {item.pendingAction && (
                  <Chip
                    label={ActionMap.get(item.pendingAction.type) || "未知操作"}
                    size="small"
                    sx={{
                      fontSize: "0.75rem",
                      height: 24,
                      flexShrink: 0,
                      color: ActionStyles[item.pendingAction.type].color,
                      bgcolor: ActionStyles[item.pendingAction.type].bgColor,
                    }}
                  />
                )}

                {isCreate && !hasPendingAction && (
                  <Chip label="新建" size="small" color="primary" sx={{ flexShrink: 0 }} />
                )}

                {isMatched && !hasPendingAction && !isCreate && (
                  <Chip label="匹配" size="small" color="success" sx={{ flexShrink: 0 }} />
                )}
              </Stack>

              {item.item.originalTitle && item.item.originalTitle !== item.item.title && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: isMatched && !hasPendingAction ? 1 : 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={`原标题: ${item.item.originalTitle}`}
                >
                  原标题: {item.item.originalTitle}
                </Typography>
              )}

              {item.item.overview && (
                <Typography
                  variant="body2"
                  color={isMatched && !hasPendingAction ? "text.primary" : "text.secondary"}
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                  title={item.item.overview}
                >
                  {item.item.overview}
                </Typography>
              )}

              {/* 显示已选择的匹配项目 */}
              {!isCreate && selectedMatch && isMatched && !hasPendingAction && (
                <MatchItemDisplay item={selectedMatch} />
              )}
            </Box>
          </Box>

          {/* 操作按钮区域 */}
          <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
            {actions.length > 0 && (
              <Stack direction="row" spacing={1}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "outlined"}
                    size="small"
                    onClick={() => action.onClick(item)}
                    startIcon={<action.icon size={16} />}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            )}
          </Box>
        </Box>

        {/* 匹配建议区域 */}
        {onSelectMatch && !hasPendingAction && !isMatched && item.matches.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              匹配建议:
            </Typography>
            <Stack spacing={1}>
              {item.matches.slice(0, 5).map((match) => (
                <MatchItemDisplay
                  key={match.id}
                  item={match}
                  score={match.score}
                  onSelect={() => onSelectMatch(match)}
                />
              ))}
              {item.matches.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  还有 {item.matches.length - 5} 个其他匹配...
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* 无匹配建议提示 */}
        {!hasPendingAction && item.status === "none" && (
          <Box textAlign="center" py={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              无匹配建议
            </Typography>
            <Typography variant="caption" color="text.secondary">
              请选择手动映射或创建新项目
            </Typography>
          </Box>
        )}

        {/* 待处理操作状态 */}
        {hasPendingAction && item.pendingAction && (
          <Alert severity="info" sx={{ mt: 2, fontSize: "0.875rem" }}>
            {item.pendingAction.type === "map" && item.pendingAction.localItemId && (
              <>
                匹配本地项目: {item.selected?.title} ({item.selected?.premiereDate?.getFullYear()})
              </>
            )}
            {item.pendingAction.type === "create" && <>创建新项目</>}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface CustomMapDialogProps {
  onClose: () => void;
  item: ExtendedResult;
  serverId: number;
  onMap: (item: ExtendedResult, localItem: LocalItem) => void;
}

export function CustomMapDialog({ onClose, item, serverId, onMap }: CustomMapDialogProps) {
  const [searchTerm, setSearchTerm] = useDebounceValue("", 300);
  const [availableItems, setAvailableItems] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocalItem, setSelectedLocalItem] = useState<LocalItem | null>(null);

  // 加载可用的本地项目
  const loadAvailableItems = useCallback(
    async (search = "") => {
      setLoading(true);
      const result = await getUnmappedLocalItems(serverId, search);
      if (result.success) {
        setAvailableItems(result.value);
      } else {
        console.error("加载本地项目失败:", result.message);
        setAvailableItems([]);
      }
      setLoading(false);
    },
    [serverId]
  );

  // 初始加载可用项目
  useState(() => {
    (async () => {
      await loadAvailableItems();
    })();
  });

  const handleMap = () => {
    if (selectedLocalItem) {
      onMap(item, selectedLocalItem);
      onClose();
    }
  };

  const filteredItems = availableItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: 24,
        }}
      >
        {/* 标题栏 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 3,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            选择本地项目
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Lucide.X size={16} />
          </IconButton>
        </Box>

        {/* 内容区域 */}
        <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* 搜索框 */}
          <TextField
            placeholder="搜索本地项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* 项目列表 */}
          <Box sx={{ height: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {loading ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lucide.Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  加载中...
                </Typography>
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  暂无可用的本地项目
                </Typography>
                <Button variant="outlined" size="small" onClick={() => loadAvailableItems()}>
                  重新加载
                </Button>
              </Box>
            ) : (
              filteredItems.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    borderColor: selectedLocalItem?.id === item.id ? "primary.main" : "divider",
                    backgroundColor: selectedLocalItem?.id === item.id ? "action.selected" : "background.paper",
                    "&:hover": {
                      backgroundColor: selectedLocalItem?.id === item.id ? "action.selected" : "action.hover",
                    },
                  }}
                  onClick={() => setSelectedLocalItem(item)}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box flex={1} minWidth={0}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {item.title}
                        </Typography>
                        {item.originalTitle && item.originalTitle !== item.title && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.originalTitle}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          {item.premiereDate && (
                            <Chip
                              label={item.premiereDate.getFullYear()}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          )}
                          <Chip label={item.type} size="small" variant="outlined" sx={{ fontSize: "0.75rem" }} />
                        </Stack>
                      </Box>
                      {selectedLocalItem?.id === item.id && <Lucide.Check size={20} style={{ color: "primary" }} />}
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </CardContent>

        {/* 底部按钮 */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, p: 3, borderTop: 1, borderColor: "divider" }}>
          <Button variant="outlined" onClick={onClose}>
            取消
          </Button>
          <Button variant="contained" onClick={handleMap} disabled={!selectedLocalItem}>
            确认选择
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
