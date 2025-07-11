import type { ItemSyncResult, ItemMapOperation } from "@/lib/service/item";
import { useState, useEffect, useCallback } from "react";
import * as Lucide from "lucide-react";
import { getUnmappedLocalItems } from "@/lib/actions/server";
import type { LocalItem, EmbyItem } from "@prisma/client";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Checkbox,
  Stack,
  Button,
  Alert,
  TextField,
} from "@mui/material";

// 匹配状态类型
export const MatchStatusNames = {
  exact: "精确匹配",
  multiple: "候选匹配",
  none: "无匹配",
  matched: "已匹配",
} as const;
export type MatchStatus = keyof typeof MatchStatusNames;
export const MatchStatusValues = Object.keys(MatchStatusNames) as (keyof typeof MatchStatusNames)[];
export const renderMatchStatusIcon = (status: MatchStatus) => {
  switch (status) {
    case "exact":
      return <Lucide.CheckCircle style={{ width: 16, height: 16, color: "#16a34a" }} />;
    case "multiple":
      return <Lucide.MapPin style={{ width: 16, height: 16, color: "#ca8a04" }} />;
    case "none":
      return <Lucide.Link style={{ width: 16, height: 16, color: "#dc2626" }} />;
    case "matched":
      return <Lucide.Check style={{ width: 16, height: 16, color: "#2563eb" }} />;
  }
};

export type ExtendedResult = ItemSyncResult & {
  status: MatchStatus;
  selected?: LocalItem;
  pendingAction?: ItemMapOperation;
};
export function getMatchStatus(item: ItemSyncResult): MatchStatus {
  if (item.exact) {
    return "exact";
  }
  if (item.matches.length > 0) {
    return "multiple";
  }
  return "none";
}

interface UnmatchedItemCardProps {
  item: ExtendedResult;
  selected: boolean;
  onToggle: () => void;
  onSelectBestMatch: () => void;
  onSelectMatch: (localItem: LocalItem) => void;
  onCreateNew: () => void;
  onCustomMap: () => void;
  onRemovePendingAction: () => void;
}

export function UnmatchedItemCard({
  item,
  selected,
  onToggle,
  onSelectBestMatch,
  onSelectMatch,
  onCreateNew,
  onCustomMap,
  onRemovePendingAction,
}: UnmatchedItemCardProps) {
  const hasPendingAction = !!item.pendingAction;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: hasPendingAction ? "primary.main" : "divider",
        backgroundColor: hasPendingAction ? "action.hover" : "background.paper",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* 主要内容区域 */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1} gap={2}>
          <Box display="flex" alignItems="flex-start" gap={1.5} flex={1} minWidth={0}>
            <Checkbox checked={selected} onChange={onToggle} size="small" sx={{ mt: 0.25, flexShrink: 0 }} />
            <Box flex={1} minWidth={0}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                    cursor: "help",
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
                    sx={{ fontSize: "0.75rem", height: 24 }}
                  />
                )}
                <Chip label={item.item.type} size="small" variant="outlined" sx={{ fontSize: "0.75rem", height: 24 }} />
                {hasPendingAction && (
                  <Chip
                    label={item.pendingAction?.type === "map" ? "待映射" : "待创建"}
                    size="small"
                    color="primary"
                    sx={{ fontSize: "0.75rem", height: 24 }}
                  />
                )}
              </Stack>

              {item.item.originalTitle && item.item.originalTitle !== item.item.title && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "help",
                  }}
                  title={`原标题: ${item.item.originalTitle}`}
                >
                  原标题: {item.item.originalTitle}
                </Typography>
              )}

              {item.item.overview && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    cursor: "help",
                  }}
                  title={item.item.overview}
                >
                  {item.item.overview}
                </Typography>
              )}
            </Box>
          </Box>

          {/* 操作按钮区域 */}
          {hasPendingAction ? (
            <Button
              variant="outlined"
              size="small"
              onClick={onRemovePendingAction}
              startIcon={<Lucide.X size={16} />}
              sx={{ flexShrink: 0 }}
            >
              撤销
            </Button>
          ) : (
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={onCustomMap}
                startIcon={<Lucide.ExternalLink size={16} />}
              >
                选择
              </Button>
              <Button variant="outlined" size="small" onClick={onCreateNew} startIcon={<Lucide.Plus size={16} />}>
                新建
              </Button>
            </Stack>
          )}
        </Box>

        {/* 匹配建议区域 */}
        {!hasPendingAction && item.matches.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              匹配建议:
            </Typography>
            <Stack spacing={1}>
              {item.matches.slice(0, 5).map((match, index) => (
                <Box
                  key={match.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    backgroundColor: "action.hover",
                    borderRadius: 1,
                    gap: 1,
                  }}
                >
                  <Box flex={1} minWidth={0}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "help",
                      }}
                      title={match.title}
                    >
                      {match.title}
                    </Typography>
                    {match.premiereDate && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ cursor: "help" }}
                        title={`年份: ${match.premiereDate.getFullYear()}`}
                      >
                        ({match.premiereDate.getFullYear()})
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Chip
                      label={`${Math.round(match.score * 100)}%`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.75rem", height: 24 }}
                    />
                    <Button
                      size="small"
                      variant={index === 0 ? "contained" : "outlined"}
                      onClick={() => {
                        if (index === 0) {
                          onSelectBestMatch();
                        } else {
                          onSelectMatch(match);
                        }
                      }}
                      sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                    >
                      {index === 0 ? "最佳匹配" : "选择"}
                    </Button>
                  </Stack>
                </Box>
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
        {!hasPendingAction && item.matches.length === 0 && (
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

interface MatchedItemCardProps {
  item: ExtendedResult;
  selected: boolean;
  onToggle: () => void;
  onCancel: () => void;
}

export function MatchedItemCard({ item, selected, onToggle, onCancel }: MatchedItemCardProps) {
  const isCreated = item.pendingAction?.type === "create";
  const match = item.selected ?? item.matches.at(0);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "success.main",
        bgcolor: isCreated ? "primary.50" : "success.50",
        "&:hover": {
          bgcolor: isCreated ? "primary.100" : "success.100",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
          <Box display="flex" alignItems="flex-start" gap={2} flex={1} minWidth={0}>
            <Checkbox checked={selected} onChange={onToggle} size="small" sx={{ mt: 0.5, flexShrink: 0 }} />

            <Box flex={1} minWidth={0}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: "medium",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "300px",
                    cursor: "help",
                  }}
                  title={item.item.title}
                >
                  {item.item.title}
                </Typography>
                <Chip label={item.item.type} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                {item.item.premiereDate && (
                  <Chip
                    label={item.item.premiereDate.getFullYear()}
                    size="small"
                    variant="outlined"
                    color="default"
                    sx={{ flexShrink: 0 }}
                  />
                )}
                {isCreated ? (
                  <Chip label="新建" size="small" color="primary" sx={{ flexShrink: 0 }} />
                ) : (
                  <Chip label="匹配" size="small" color="success" sx={{ flexShrink: 0 }} />
                )}
              </Stack>

              {item.item.originalTitle && item.item.originalTitle !== item.item.title && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "help",
                  }}
                  title={`原标题: ${item.item.originalTitle}`}
                >
                  原标题: {item.item.originalTitle}
                </Typography>
              )}

              {item.item.overview && (
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    cursor: "help",
                  }}
                  title={item.item.overview}
                >
                  {item.item.overview}
                </Typography>
              )}

              {/* 显示匹配的本地项目 */}
              {!isCreated && match && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "background.paper",
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: "medium", mb: 0.5 }}>
                        匹配项目:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "help",
                        }}
                        title={match.title}
                      >
                        {match.title}
                      </Typography>
                      {match.originalTitle && match.originalTitle !== match.title && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "help",
                          }}
                          title={`原标题: ${match.originalTitle}`}
                        >
                          原标题: {match.originalTitle}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <IconButton size="small" onClick={onCancel} color="default" sx={{ flexShrink: 0 }}>
            <Lucide.X size={16} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

interface CustomMapDialogProps {
  onClose: () => void;
  embyItem: EmbyItem;
  serverId: number;
  onMap: (embyItem: EmbyItem, localItem: LocalItem) => void;
}

export function CustomMapDialog({ onClose, embyItem, serverId, onMap }: CustomMapDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
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

  // 搜索防抖处理
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAvailableItems(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, serverId, loadAvailableItems]);

  const handleMap = () => {
    if (selectedLocalItem) {
      onMap(embyItem, selectedLocalItem);
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
