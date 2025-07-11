"use client";

import { useMemo, useState, useCallback, JSX } from "react";
import * as Lucide from "lucide-react";
import { syncServer, batchProcessMappings } from "@/lib/actions/server";
import { useToast } from "@/lib/context/toast-context";
import type { EmbyServer, LocalItem, EmbyItem } from "@prisma/client";
import type { ItemMapOperation } from "@/lib/service/item";
import {
  Box,
  Chip,
  Button,
  TextField,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  Paper,
  Typography,
  IconButton,
  Card,
  CardContent,
  Container,
  Checkbox,
  FormControlLabel,
  Stack,
} from "@mui/material";
import {
  ExtendedResult,
  getMatchStatus,
  MatchStatus,
  MatchStatusValues,
  UnmatchedItemCard,
  renderMatchStatusIcon,
  MatchStatusNames,
  MatchedItemCard,
  CustomMapDialog,
} from "./sync-card";

// 排序类型
type SortType = "title" | "year" | "score" | "type";
type SortOrder = "asc" | "desc";

// region ServerSync
interface ServerSyncProps {
  server: EmbyServer;
  onClose: () => void;
}
export default function ServerSync({ server, onClose }: ServerSyncProps) {
  const toast = useToast();
  // 同步操作状态
  const [syncStatus, setSyncStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [results, setResults] = useState<ExtendedResult[]>([]);
  // 活动标签页
  const [activeTab, setActiveTab] = useState("exact");
  // 过滤状态
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hasMatchesFilter, setHasMatchesFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortType>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  // 选择状态
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // 待处理操作队列
  const [pendingActions, setPendingActions] = useState<ItemMapOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 自定义映射对话框状态
  const [isCustomMapDialogOpen, setIsCustomMapDialogOpen] = useState(false);
  const [customMapEmbyItem, setCustomMapEmbyItem] = useState<EmbyItem | null>(null);

  // 计算不同状态的项目
  const itemsByStatus = useMemo(() => {
    const exact = results.filter((item) => item.status === "exact");
    const multiple = results.filter((item) => item.status === "multiple");
    const none = results.filter((item) => item.status === "none");
    const matched = results.filter((item) => item.status === "matched");

    return { exact, multiple, none, matched };
  }, [results]);

  // 过滤和排序项目的通用函数
  const filterAndSortItems = useCallback(
    (items: ExtendedResult[]) => {
      // 过滤
      const filtered = items.filter((item) => {
        const matchesSearch =
          item.item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item.originalTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || item.item.type === typeFilter;
        const matchesHasMatches =
          hasMatchesFilter === "all" ||
          (hasMatchesFilter === "has-matches" && item.matches.length > 0) ||
          (hasMatchesFilter === "no-matches" && item.matches.length === 0);
        return matchesSearch && matchesType && matchesHasMatches;
      });

      // 排序
      return [...filtered].sort((a, b) => {
        let aVal, bVal;

        switch (sortBy) {
          case "title":
            aVal = a.item.title.toLowerCase();
            bVal = b.item.title.toLowerCase();
            break;
          case "year":
            aVal = a.item.premiereDate?.getFullYear() || 0;
            bVal = b.item.premiereDate?.getFullYear() || 0;
            break;
          case "type":
            aVal = a.item.type;
            bVal = b.item.type;
            break;
          case "score":
            aVal = a.matches.length > 0 ? Math.max(...a.matches.map((m) => m.score)) : 0;
            bVal = b.matches.length > 0 ? Math.max(...b.matches.map((m) => m.score)) : 0;
            break;
          default:
            return 0;
        }

        if (sortOrder === "asc") {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    },
    [searchTerm, typeFilter, hasMatchesFilter, sortBy, sortOrder]
  );

  // 当前标签页的过滤和排序结果
  const currentTabItems = useMemo(() => {
    let items: ExtendedResult[] = [];
    switch (activeTab) {
      case "exact":
        items = itemsByStatus.exact;
        break;
      case "multiple":
        items = itemsByStatus.multiple;
        break;
      case "none":
        items = itemsByStatus.none;
        break;
      case "matched":
        items = itemsByStatus.matched;
        break;
      default:
        items = [];
    }
    return filterAndSortItems(items);
  }, [activeTab, itemsByStatus, filterAndSortItems]);

  // 开始同步
  const doStartSync = async () => {
    if (!server) return;
    setSyncStatus("running");
    setResults([]);
    setSelectedItems(new Set());
    setSearchTerm("");
    setTypeFilter("all");
    setHasMatchesFilter("all");
    setSortBy("title");
    setSortOrder("asc");
    setPendingActions([]);

    const syncRes = await syncServer(server);
    if (syncRes.success) {
      setSyncStatus("success");
      const extendedResults: ExtendedResult[] = syncRes.value.map((item) => {
        const status = getMatchStatus(item);
        return {
          ...item,
          status,
        };
      });
      if (extendedResults.length === 0) {
        toast.showSuccess("同步完成，所有项目均已匹配");
      } else {
        toast.showSuccess(`同步完成，发现 ${extendedResults.length} 个需要处理的项目`);
      }
      setResults(extendedResults);
    } else {
      setSyncStatus("error");
      toast.showError(`同步失败: ${syncRes.message}`);
      setResults([]);
    }
  };
  // 执行操作
  const doActions = async () => {
    if (pendingActions.length === 0) return;
    setIsProcessing(true);
    const result = await batchProcessMappings(pendingActions);
    if (result.success) {
      toast.showSuccess(`批量操作执行成功，处理了 ${pendingActions.length} 个项目`);
      // 重新同步获取最新状态
      await doStartSync();
    } else {
      toast.showError(`批量操作失败: ${result.message || "未知错误"}`);
    }
    setIsProcessing(false);
  };
  // 添加到待处理操作队列 (前端操作)
  const addPendingAction = (action: ItemMapOperation) => {
    setPendingActions((prev) => {
      // 移除针对同一项目的现有操作，然后添加新操作
      const filtered = prev.filter((a) => a.embyItemId !== action.embyItemId);
      return [...filtered, action];
    });

    // 更新结果项的状态
    setResults((prev) =>
      prev.map((item) => {
        if (item.item.id === action.embyItemId) {
          let newStatus: MatchStatus;
          if (action.type === "unmap") {
            newStatus = getMatchStatus(item);
          } else {
            newStatus = "matched";
          }

          return {
            ...item,
            status: newStatus,
            pendingAction: action,
          };
        }
        return item;
      })
    );
  };

  // 移除待处理操作
  const removePendingAction = (embyItemId: number) => {
    setPendingActions((prev) => prev.filter((a) => a.embyItemId !== embyItemId));
    // 恢复项目的原始状态
    setResults((prev) =>
      prev.map((item) => {
        if (item.item.id === embyItemId) {
          const originalStatus = getMatchStatus(item);
          return {
            ...item,
            status: originalStatus,
            pendingAction: undefined,
          };
        }
        return item;
      })
    );
  };

  // region 前端操作
  // 选择最佳匹配
  const handleSelectBestMatch = (item: ExtendedResult) => {
    if (item.matches.length === 0) return;
    const bestMatch = item.matches.reduce((best, current) => (current.score > best.score ? current : best));
    addPendingAction({ type: "map", embyItemId: item.item.id, localItemId: bestMatch.id });
  };
  // 选择指定匹配
  const handleSelectMatch = (embyItem: EmbyItem, localItem: LocalItem) => {
    const item = results.find((r) => r.item.id === embyItem.id);
    if (item) item.selected = localItem;
    addPendingAction({ type: "map", embyItemId: embyItem.id, localItemId: localItem.id });
  };
  // 创建新项目
  const handleCreateNew = (item: ExtendedResult) => addPendingAction({ type: "create", embyItemId: item.item.id });
  // 撤销操作
  const handleCancel = (embyItemId: number) => removePendingAction(embyItemId);
  // 批量选择最佳匹配
  const handleBatchSelectBestMatch = () => {
    selectedItems.forEach((itemId) => {
      const item = results.find((r) => r.item.id === itemId);
      if (item && item.matches.length > 0) {
        handleSelectBestMatch(item);
      }
    });
    setSelectedItems(new Set());
  };
  // 批量创建新项目
  const handleBatchCreateNew = () => {
    selectedItems.forEach((itemId) => {
      const item = results.find((r) => r.item.id === itemId);
      if (item) handleCreateNew(item);
    });
    setSelectedItems(new Set());
  };
  // 批量撤销
  const handleBatchCancel = () => {
    selectedItems.forEach((itemId) => handleCancel(itemId));
    setSelectedItems(new Set());
  };

  // 切换选择
  const toggleSelection = (itemId: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const allIds = currentTabItems.map((item) => item.item.id);
    const allSelected = allIds.every((id) => selectedItems.has(id));

    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => newSet.delete(id));
      } else {
        allIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  // 获取类型列表用于过滤
  const availableTypes = useMemo(() => {
    const types = new Set(results.map((r) => r.item.type));
    return Array.from(types);
  }, [results]);

  // 准备选择框选项数据
  const typeFilterOptions = useMemo(
    () => [{ value: "all", label: "所有类型" }, ...availableTypes.map((type) => ({ value: type, label: type }))],
    [availableTypes]
  );

  const hasMatchesFilterOptions = [
    { value: "all", label: "全部" },
    { value: "has-matches", label: "有匹配建议" },
    { value: "no-matches", label: "无匹配建议" },
  ];

  const sortByOptions = [
    { value: "title", label: "标题" },
    { value: "year", label: "年份" },
    { value: "score", label: "匹配度" },
    { value: "type", label: "类型" },
  ];

  // region 函数组件
  const renderBasicList = (
    onBatchButtonClick: () => void,
    batchButtonText: string,
    BatchButtonIcon: typeof Lucide.Link | typeof Lucide.X,
    renderItem: (item: ExtendedResult) => JSX.Element
  ) => (
    <Stack spacing={2}>
      {/* 批量操作工具栏 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    currentTabItems.length > 0 && currentTabItems.every((item) => selectedItems.has(item.item.id))
                  }
                  onChange={() => toggleSelectAll()}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  已选择 {currentTabItems.filter((item) => selectedItems.has(item.item.id)).length} 项
                </Typography>
              }
            />
          </Stack>
          {currentTabItems.some((item) => selectedItems.has(item.item.id)) && (
            <Button
              variant="outlined"
              size="small"
              onClick={onBatchButtonClick}
              startIcon={<BatchButtonIcon className="h-4 w-4" />}
            >
              {batchButtonText}
            </Button>
          )}
        </Stack>
      </Paper>
      {/* 项目列表 */}
      <Box sx={{ minHeight: 400 }}>
        {currentTabItems.length > 0 ? (
          <Stack spacing={1}>{currentTabItems.map(renderItem)}</Stack>
        ) : (
          <Paper sx={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              暂无项目
            </Typography>
          </Paper>
        )}
      </Box>
    </Stack>
  );
  const renderUnmatchedItem = (item: ExtendedResult) => (
    <UnmatchedItemCard
      key={item.item.id}
      item={item}
      selected={selectedItems.has(item.item.id)}
      onToggle={() => toggleSelection(item.item.id)}
      onSelectBestMatch={() => handleSelectBestMatch(item)}
      onSelectMatch={(localItem) => handleSelectMatch(item.item, localItem)}
      onCreateNew={() => handleCreateNew(item)}
      onCustomMap={() => {
        setCustomMapEmbyItem(item.item);
        setIsCustomMapDialogOpen(true);
      }}
      onRemovePendingAction={() => removePendingAction(item.item.id)}
    />
  );
  const renderMatchedItem = (item: ExtendedResult) => (
    <MatchedItemCard
      key={item.item.id}
      item={item}
      selected={selectedItems.has(item.item.id)}
      onToggle={() => toggleSelection(item.item.id)}
      onCancel={() => removePendingAction(item.item.id)}
    />
  );
  const renderList = (status: MatchStatus) => {
    switch (status) {
      case "exact":
        return renderBasicList(handleBatchSelectBestMatch, "匹配", Lucide.Link, renderUnmatchedItem);
      case "multiple":
      case "none":
        return renderBasicList(handleBatchCreateNew, "新建", Lucide.Plus, renderUnmatchedItem);
      case "matched":
        return renderBasicList(handleBatchCancel, "撤销", Lucide.X, renderMatchedItem);
    }
  };
  // region ServerSync 主体
  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Paper elevation={3} sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 3 }}>
          {/* 标题栏 */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h5" component="h1" fontWeight="bold">
              服务器同步: {server?.name || "加载中..."}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Lucide.X className="h-5 w-5" />
            </IconButton>
          </Stack>

          {/* 同步操作区域 */}
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    数据同步
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    从Emby服务器拉取项目并与本地数据匹配
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={doActions}
                    disabled={pendingActions.length === 0 || isProcessing}
                    variant="outlined"
                    startIcon={
                      isProcessing ? (
                        <Lucide.Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lucide.Check className="h-4 w-4" />
                      )
                    }
                  >
                    {isProcessing ? "执行中..." : "执行所有操作"}
                    {pendingActions.length > 0 && (
                      <Chip label={pendingActions.length} size="small" variant="outlined" sx={{ ml: 1 }} />
                    )}
                  </Button>
                  <Button
                    onClick={doStartSync}
                    disabled={syncStatus === "running"}
                    variant="contained"
                    startIcon={
                      syncStatus === "running" ? (
                        <Lucide.Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lucide.RefreshCw className="h-4 w-4" />
                      )
                    }
                  >
                    {syncStatus === "running" ? "同步中..." : "开始同步"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* 结果展示区域 */}
          {results.length > 0 && (
            <>
              {/* 搜索和过滤 */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <TextField
                      placeholder="搜索项目标题..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      fullWidth
                      size="small"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lucide.Search className="h-4 w-4 text-gray-400" />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 200 }}>
                        <Lucide.Filter className="h-4 w-4 text-gray-500" />
                        <FormControl size="small" fullWidth>
                          <Select
                            value={typeFilter}
                            onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
                            displayEmpty
                            MenuProps={{ disableScrollLock: true }}
                          >
                            {typeFilterOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 200 }}>
                        <Lucide.Filter className="h-4 w-4 text-gray-500" />
                        <FormControl size="small" fullWidth>
                          <Select
                            value={hasMatchesFilter}
                            onChange={(e: SelectChangeEvent) => setHasMatchesFilter(e.target.value)}
                            displayEmpty
                            MenuProps={{ disableScrollLock: true }}
                          >
                            {hasMatchesFilterOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Lucide.ArrowUpDown className="h-4 w-4 text-gray-500" />
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={sortBy}
                            onChange={(e: SelectChangeEvent) => setSortBy(e.target.value as SortType)}
                            displayEmpty
                            MenuProps={{ disableScrollLock: true }}
                          >
                            {sortByOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          size="small"
                          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                          title={sortOrder === "asc" ? "当前升序，点击切换为降序" : "当前降序，点击切换为升序"}
                        >
                          {sortOrder === "asc" ? (
                            <Lucide.ArrowUp className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Lucide.ArrowDown className="h-4 w-4 text-blue-600" />
                          )}
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Tab导航 */}
              <Box sx={{ width: "100%" }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)} variant="fullWidth">
                    {MatchStatusValues.map((status) => (
                      <Tab
                        key={status}
                        value={status}
                        label={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {renderMatchStatusIcon(status)}
                            <Typography variant="body2">
                              {MatchStatusNames[status]} ({itemsByStatus[status].length})
                            </Typography>
                          </Stack>
                        }
                      />
                    ))}
                  </Tabs>
                </Box>
                {MatchStatusValues.map((status) => (
                  <Box key={status} role="tabpanel" hidden={activeTab !== status} sx={{ mt: 3 }}>
                    {activeTab === status && (
                      <>
                        {itemsByStatus[status].length > 0 ? (
                          renderList(status)
                        ) : (
                          <Paper
                            sx={{
                              minHeight: 400,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              py: 8,
                            }}
                          >
                            {renderMatchStatusIcon(status)}
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                              暂无{MatchStatusNames[status]}项目
                            </Typography>
                          </Paper>
                        )}
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* 自定义映射对话框 */}
          {isCustomMapDialogOpen && customMapEmbyItem && (
            <CustomMapDialog
              onClose={() => setIsCustomMapDialogOpen(false)}
              embyItem={customMapEmbyItem}
              serverId={server.id}
              onMap={(embyItem, localItem) => {
                handleSelectMatch(embyItem, localItem);
                setIsCustomMapDialogOpen(false);
              }}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}
