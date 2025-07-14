"use client";

import { useMemo, useState, useCallback, JSX } from "react";
import * as Lucide from "lucide-react";
import { syncServer, batchProcessMappings } from "@/lib/actions/server";
import { useToast } from "@/lib/context/toast-context";
import type { EmbyServer, LocalItem } from "@prisma/client";
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
import { ExtendedResult, StatusMap, renderMatchStatusIcon, CustomMapDialog, LocalStatus, ItemCard } from "./sync-card";

// 排序类型
type SortType = "title" | "year" | "score" | "type";
type SortOrder = "asc" | "desc";

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
  const [activeTab, setActiveTab] = useState<LocalStatus>("exact");
  // 过滤状态
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hasMatchesFilter, setHasMatchesFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortType>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  // 复选框选择状态
  const [selectedItems, setSelectedItems] = useState<Set<ExtendedResult>>(new Set());

  // 待处理
  const [pendingItems, setPendingItems] = useState<ExtendedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 自定义映射对话框状态
  const [customMapItem, setCustomMapItem] = useState<ExtendedResult | null>(null);

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

  // 计算不同状态的项目
  const syncItems = useMemo(() => {
    const exact = filterAndSortItems(results.filter((item) => item.status === "exact"));
    const multiple = filterAndSortItems(results.filter((item) => item.status === "multiple"));
    const none = filterAndSortItems(results.filter((item) => item.status === "none"));
    const matched = filterAndSortItems(results.filter((item) => item.status === "matched"));
    return { exact, multiple, none, matched };
  }, [results, filterAndSortItems]);
  const itemsByStatus = useMemo(() => {
    return { ...syncItems, pending: filterAndSortItems(pendingItems) };
  }, [syncItems, pendingItems, filterAndSortItems]);

  // 当前标签页的过滤和排序结果
  const currentTabItems = useMemo(() => itemsByStatus[activeTab], [activeTab, itemsByStatus]);

  // 开始同步
  const doStartSync = useCallback(async () => {
    if (!server) return;
    setSyncStatus("running");
    setResults([]);
    setSelectedItems(new Set());
    setSearchTerm("");
    setTypeFilter("all");
    setHasMatchesFilter("all");
    setSortBy("title");
    setSortOrder("asc");
    setPendingItems([]);

    const syncRes = await syncServer(server);
    if (syncRes.success) {
      setSyncStatus("success");
      if (syncRes.value.reduce((total, item) => total + (item.status !== "matched" ? 1 : 0), 0) === 0) {
        toast.showSuccess("同步完成，所有项目均已匹配");
      } else {
        toast.showSuccess(`同步完成，发现 ${syncRes.value.length} 个需要处理的项目`);
      }
      setResults(syncRes.value);
    } else {
      setSyncStatus("error");
      toast.showError(`同步失败: ${syncRes.message}`);
      setResults([]);
    }
  }, [server, toast]);
  // 执行操作
  const doActions = useCallback(async () => {
    const actions = pendingItems.map((item) => item.pendingAction).filter((item) => !!item);
    if (actions.length === 0) return;
    setIsProcessing(true);
    const result = await batchProcessMappings(actions);
    if (result.success) {
      toast.showSuccess(`批量操作执行成功，处理了 ${actions.length} 个项目`);
      // 重新同步获取最新状态
      await doStartSync();
    } else {
      toast.showError(`批量操作失败: ${result.message || "未知错误"}`);
    }
    setIsProcessing(false);
  }, [pendingItems, doStartSync, toast]);

  // 添加到待处理操作队列
  const addPendingAction = (action: ItemMapOperation, item: ExtendedResult) => {
    item.pendingAction = action;
    // 添加到待处理项目
    setPendingItems((prev) => [...prev, item]);
    // 从结果中移除
    setResults((prev) => prev.filter((i) => i !== item));
  };

  // 移除待处理操作
  const removePendingAction = (item: ExtendedResult) => {
    if (!item.pendingAction) return;
    item.pendingAction = undefined;
    // 从待处理项目中移除
    setPendingItems((prev) => prev.filter((i) => i !== item));
    // 将项目重新添加到结果中
    setResults((prev) => [...prev, item]);
  };

  // 选择最佳匹配
  const handleSelectBestMatch = useCallback((item: ExtendedResult) => {
    if (item.matches.length === 0) return;
    const bestMatch = item.matches.reduce((best, current) => (current.score > best.score ? current : best));
    addPendingAction({ type: "map", embyItemId: item.item.id, localItemId: bestMatch.id }, item);
  }, []);

  // 选择指定匹配
  const handleSelectMatch = useCallback((item: ExtendedResult, localItem: LocalItem) => {
    item.selected = localItem;
    addPendingAction({ type: "map", embyItemId: item.item.id, localItemId: localItem.id }, item);
  }, []);

  // 创建新项目
  const handleCreateNew = useCallback(
    (item: ExtendedResult) => addPendingAction({ type: "create", embyItemId: item.item.id }, item),
    []
  );

  // 刷新数据
  const handleRefresh = useCallback(
    (item: ExtendedResult) => addPendingAction({ type: "refresh", embyItemId: item.item.id }, item),
    []
  );

  // 取消映射
  const handleUnmap = useCallback(
    (item: ExtendedResult) => addPendingAction({ type: "unmap", embyItemId: item.item.id }, item),
    []
  );
  // 批量选择最佳匹配
  const handleBatchSelectBestMatch = useCallback(() => {
    selectedItems.forEach((item) => {
      if (item.matches.length > 0) {
        handleSelectBestMatch(item);
      }
    });
    setSelectedItems(new Set());
  }, [selectedItems, handleSelectBestMatch]);

  // 批量创建新项目
  const handleBatchCreateNew = useCallback(() => {
    selectedItems.forEach((item) => handleCreateNew(item));
    setSelectedItems(new Set());
  }, [selectedItems, handleCreateNew]);

  // 批量刷新
  const handleBatchRefresh = useCallback(() => {
    selectedItems.forEach((item) => handleRefresh(item));
    setSelectedItems(new Set());
  }, [selectedItems, handleRefresh]);

  // 批量取消映射
  const handleBatchUnmap = useCallback(() => {
    selectedItems.forEach((item) => handleUnmap(item));
    setSelectedItems(new Set());
  }, [selectedItems, handleUnmap]);

  // 批量撤销
  const handleBatchCancel = useCallback(() => {
    selectedItems.forEach((item) => removePendingAction(item));
    setSelectedItems(new Set());
  }, [selectedItems]);

  // 切换选择
  const toggleSelection = useCallback((item: ExtendedResult) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  }, []);

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    const notAllSelected = currentTabItems.some((item) => !selectedItems.has(item));
    setSelectedItems(() => (notAllSelected ? new Set(currentTabItems) : new Set()));
  }, [currentTabItems, selectedItems]);

  // 获取类型列表用于过滤
  const availableTypes = useMemo(() => {
    return Array.from(new Set(results.map((r) => r.item.type)));
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

  const renderUnmatchedItem = useCallback(
    (item: ExtendedResult) => (
      <ItemCard
        key={item.item.id}
        item={item}
        selected={selectedItems.has(item)}
        onToggle={() => toggleSelection(item)}
        onSelectBestMatch={() => handleSelectBestMatch(item)}
        onSelectMatch={(localItem) => handleSelectMatch(item, localItem)}
        actions={[
          { onClick: removePendingAction, label: "撤销", icon: Lucide.X },
          { onClick: setCustomMapItem, label: "选择", icon: Lucide.ExternalLink },
          { onClick: handleCreateNew, label: "新建", icon: Lucide.Plus },
        ]}
      />
    ),
    [selectedItems, toggleSelection, handleSelectBestMatch, handleSelectMatch, handleCreateNew]
  );

  const renderPendingItem = useCallback(
    (item: ExtendedResult) => (
      <ItemCard
        key={item.item.id}
        item={item}
        selected={selectedItems.has(item)}
        onToggle={() => toggleSelection(item)}
        actions={[{ onClick: removePendingAction, label: "撤销", icon: Lucide.X }]}
      />
    ),
    [selectedItems, toggleSelection]
  );

  const renderMatchedItem = useCallback(
    (item: ExtendedResult) => (
      <ItemCard
        key={item.item.id}
        item={item}
        selected={selectedItems.has(item)}
        onToggle={() => toggleSelection(item)}
        actions={[
          { onClick: () => handleRefresh(item), label: "刷新数据", icon: Lucide.RefreshCcw },
          { onClick: () => handleUnmap(item), label: "取消映射", icon: Lucide.X },
        ]}
      />
    ),
    [selectedItems, toggleSelection, handleRefresh, handleUnmap]
  );

  const ItemList = useCallback(
    ({ status }: { status: LocalStatus }) => {
      switch (status) {
        case "exact":
          return (
            <ResultList
              items={itemsByStatus[status]}
              selectedItems={selectedItems}
              onToggleSelectAll={toggleSelectAll}
              renderItem={renderUnmatchedItem}
              batchActions={[{ onClick: handleBatchSelectBestMatch, label: "选择最佳匹配", icon: Lucide.Check }]}
            />
          );
        case "multiple":
        case "none":
          return (
            <ResultList
              items={itemsByStatus[status]}
              selectedItems={selectedItems}
              onToggleSelectAll={toggleSelectAll}
              renderItem={renderUnmatchedItem}
              batchActions={[{ onClick: handleBatchCreateNew, label: "新建本地项目", icon: Lucide.Plus }]}
            />
          );
        case "matched":
          return (
            <ResultList
              items={itemsByStatus[status]}
              selectedItems={selectedItems}
              onToggleSelectAll={toggleSelectAll}
              renderItem={renderMatchedItem}
              batchActions={[
                { onClick: handleBatchRefresh, label: "刷新数据", icon: Lucide.RefreshCcw },
                { onClick: handleBatchUnmap, label: "取消映射", icon: Lucide.X },
              ]}
            />
          );
        case "pending":
          return (
            <ResultList
              items={itemsByStatus[status]}
              selectedItems={selectedItems}
              onToggleSelectAll={toggleSelectAll}
              renderItem={renderPendingItem}
              batchActions={[
                { onClick: handleBatchCancel, label: "撤销操作", icon: Lucide.X },
                { onClick: doActions, label: "执行所有操作", icon: Lucide.Check },
              ]}
            />
          );
      }
    },
    [
      itemsByStatus,
      selectedItems,
      toggleSelectAll,
      renderUnmatchedItem,
      renderMatchedItem,
      renderPendingItem,
      doActions,
      handleBatchSelectBestMatch,
      handleBatchCreateNew,
      handleBatchRefresh,
      handleBatchUnmap,
      handleBatchCancel,
    ]
  );

  const lists = useMemo(
    () => new Map(StatusMap.keys().map((status) => [status, <ItemList key={status} status={status} />])),
    [ItemList]
  );

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
                    disabled={pendingItems.length === 0 || isProcessing}
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
                    {pendingItems.length > 0 && (
                      <Chip label={pendingItems.length} size="small" variant="outlined" sx={{ ml: 1 }} />
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
                {StatusMap.entries()
                  .map(([status, name]) => (
                    <Tab
                      key={status}
                      value={status}
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {renderMatchStatusIcon(status)}
                          <Typography variant="body2">
                            {name} ({itemsByStatus[status].length})
                          </Typography>
                        </Stack>
                      }
                    />
                  ))
                  .toArray()}
              </Tabs>
            </Box>
            {StatusMap.entries()
              .map(([status, name]) => (
                <Box key={status} role="tabpanel" hidden={activeTab !== status} sx={{ mt: 3 }}>
                  {activeTab === status && (
                    <>
                      {itemsByStatus[status].length > 0 ? (
                        lists.get(status)
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
                            暂无{name}项目
                          </Typography>
                        </Paper>
                      )}
                    </>
                  )}
                </Box>
              ))
              .toArray()}
          </Box>

          {/* 自定义映射对话框 */}
          {customMapItem && (
            <CustomMapDialog
              onClose={() => setCustomMapItem(null)}
              item={customMapItem}
              serverId={server.id}
              onMap={(embyItem, localItem) => {
                handleSelectMatch(embyItem, localItem);
                setCustomMapItem(null);
              }}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}

const ResultList = ({
  items,
  selectedItems,
  onToggleSelectAll,
  renderItem,
  batchActions,
}: {
  items: ExtendedResult[];
  selectedItems: Set<ExtendedResult>;
  onToggleSelectAll: () => void;
  renderItem: (item: ExtendedResult) => JSX.Element;
  batchActions: { onClick: () => void; label: string; icon: Lucide.LucideIcon }[];
}) => (
  <Stack spacing={2}>
    {/* 批量操作工具栏 */}
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <FormControlLabel
          control={
            <Checkbox
              checked={items.length > 0 && items.every((item) => selectedItems.has(item))}
              onChange={onToggleSelectAll}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              已选择 {items.filter((item) => selectedItems.has(item)).length} 项
            </Typography>
          }
        />
        <Stack direction="row" spacing={1}>
          {batchActions.map((action) => (
            <Button
              key={action.label}
              variant="outlined"
              size="small"
              onClick={action.onClick}
              startIcon={<action.icon className="h-4 w-4" />}
              disabled={items.every((item) => !selectedItems.has(item))}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
    {/* 项目列表 */}
    <Box sx={{ minHeight: 400 }}>
      {items.length > 0 ? (
        <Stack spacing={1}>{items.map(renderItem)}</Stack>
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
