"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Collapse,
  TextField,
} from "@mui/material";
import { X } from "lucide-react";
import { ItemSearchOptions, SortField, SortOrder } from "@/lib/service/item";

type Query = Omit<ItemSearchOptions, "search">; // 搜索不由筛选组件处理
export type ItemsFilterProps = {
  isOpen: boolean;
  onClose: () => void;
  // 可选项
  tagOptions: Array<{ id: number; name: string }>;
  // 当前筛选值
  searchOption: Query;
  // 清除筛选
  onClearFilters: () => void;
  // 筛选变化回调. undefined 表示不变, null 表示清除该筛选项
  onFilterChange: (newFilters: { [P in keyof Query]?: Query[P] | null }) => void;
};

const sortByOptions = [
  { value: "title", label: "标题" },
  { value: "premiereDate", label: "年份" },
  { value: "rating", label: "评分" },
] as const;

const sortOrderOptions = [
  { value: "asc", label: "升序" },
  { value: "desc", label: "降序" },
] as const;

export function ItemsFilter({
  isOpen,
  onClose,
  tagOptions,
  searchOption,
  onClearFilters,
  onFilterChange,
}: ItemsFilterProps) {
  // 本地状态管理年份输入
  const [localYearFrom, setLocalYearFrom] = useState(searchOption.yearFrom ?? null);
  const [localYearTo, setLocalYearTo] = useState(searchOption.yearTo ?? null);

  // 同步外部状态到本地状态
  React.useEffect(() => {
    setLocalYearFrom(searchOption.yearFrom ?? null);
  }, [searchOption.yearFrom]);

  React.useEffect(() => {
    setLocalYearTo(searchOption.yearTo ?? null);
  }, [searchOption.yearTo]);

  const hasActiveFilters =
    searchOption.yearFrom || searchOption.yearTo || (searchOption.tagIds && searchOption.tagIds.length > 0);

  const handleYearFromKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onFilterChange({ yearFrom: localYearFrom });
    }
  };

  const handleYearToKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onFilterChange({ yearTo: localYearTo });
    }
  };

  const handleTagToggle = (tagId: number) => {
    const raw = searchOption.tagIds || [];
    const tagIds = raw.includes(tagId) ? raw.filter((t) => t !== tagId) : [...raw, tagId];
    onFilterChange({ tagIds });
  };

  return (
    <Collapse in={isOpen}>
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 3, backgroundColor: "background.paper", borderRadius: 2, border: 1, borderColor: "divider" }}
      >
        <Stack spacing={3}>
          {/* 标题和清除按钮 */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="h3">
              筛选条件
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {hasActiveFilters && (
                <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }} onClick={onClearFilters}>
                  清除筛选
                </Typography>
              )}
              <X size={20} style={{ cursor: "pointer", color: "#666" }} onClick={onClose} />
            </Stack>
          </Stack>

          {/* 筛选选项 */}
          <Stack spacing={3}>
            {/* 年份范围筛选和排序 */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              {/* 年份范围筛选 */}
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  label="年份从"
                  type="number"
                  value={localYearFrom}
                  onChange={(e) => setLocalYearFrom(parseInt(e.target.value) || null)}
                  onKeyDown={handleYearFromKeyDown}
                  onBlur={() => onFilterChange({ yearFrom: localYearFrom })}
                  sx={{ minWidth: 120 }}
                  inputProps={{ min: 1900, max: new Date().getFullYear() + 5 }}
                />
                <Typography variant="body2" color="text.secondary">
                  至
                </Typography>
                <TextField
                  size="small"
                  label="年份到"
                  type="number"
                  value={localYearTo}
                  onChange={(e) => parseInt(e.target.value) && setLocalYearTo(parseInt(e.target.value))}
                  onKeyDown={handleYearToKeyDown}
                  onBlur={() => onFilterChange({ yearTo: localYearTo })}
                  sx={{ minWidth: 120 }}
                  inputProps={{ min: 1900, max: new Date().getFullYear() + 5 }}
                />
              </Stack>

              {/* 排序方式 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>排序</InputLabel>
                <Select<SortField>
                  value={searchOption.sortBy || "title"}
                  label="排序"
                  onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                  MenuProps={{ disableScrollLock: true }}
                >
                  {sortByOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 排序顺序 */}
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>顺序</InputLabel>
                <Select<SortOrder>
                  value={searchOption.sortOrder || "asc"}
                  label="顺序"
                  onChange={(e) => onFilterChange({ sortOrder: e.target.value })}
                  MenuProps={{ disableScrollLock: true }}
                >
                  {sortOrderOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* 标签筛选 - 独立显示 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                标签
              </Typography>
              <Box
                sx={{
                  maxHeight: 200,
                  overflowY: "auto",
                  p: 1,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  backgroundColor: "background.default",
                }}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {tagOptions.map((tag) => {
                    const isSelected = searchOption.tagIds?.includes(tag.id) || false;
                    return (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        variant={isSelected ? "filled" : "outlined"}
                        color={isSelected ? "primary" : "default"}
                        clickable
                        onClick={() => handleTagToggle(tag.id)}
                        size="small"
                      />
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Stack>

          {/* 当前筛选条件显示 */}
          {hasActiveFilters && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                当前筛选:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {searchOption.yearFrom && (
                  <Chip
                    label={`年份从: ${searchOption.yearFrom}`}
                    variant="outlined"
                    size="small"
                    onDelete={() => onFilterChange({ yearFrom: null })}
                    deleteIcon={<X size={14} />}
                  />
                )}
                {searchOption.yearTo && (
                  <Chip
                    label={`年份到: ${searchOption.yearTo}`}
                    variant="outlined"
                    size="small"
                    onDelete={() => onFilterChange({ yearTo: null })}
                    deleteIcon={<X size={14} />}
                  />
                )}
                {searchOption.tagIds &&
                  searchOption.tagIds.map((tagId) => (
                    <Chip
                      key={tagId}
                      label={`标签: ${tagOptions.find((t) => t.id === tagId)?.name || tagId}`}
                      variant="outlined"
                      size="small"
                      onDelete={() => {
                        const newTags = searchOption.tagIds?.filter((id) => id !== tagId) || [];
                        onFilterChange({ tagIds: newTags.length > 0 ? newTags : undefined });
                      }}
                      deleteIcon={<X size={14} />}
                    />
                  ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Collapse>
  );
}
