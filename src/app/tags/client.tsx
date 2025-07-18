"use client";

import {
  Box,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ChevronDown, ChevronRight, Tag as TagIcon } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { ContentArea, SearchHeader } from "@/components/common";
import { TagWithCount } from "@/lib/service/tag";
import { dbStringToSet, setToDbString } from "@/lib/utils/db-convert";

import TagItem from "./components/tag-item";

interface TagsClientProps {
  allTags: TagWithCount[];
}

type SortType = "name-asc" | "name-desc" | "count-desc" | "count-asc";

export default function TagsClient({ allTags }: TagsClientProps) {
  const [searchTermShow, setSearchTermShow] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const numberDeserializer = (value: string): number | "" => (value === "" ? "" : Number(value));
  const [minCount, setMinCount] = useLocalStorage<number | "">("tags.minCount", 0, {
    deserializer: numberDeserializer,
    serializer: (v) => v.toString(),
  });
  const [maxCount, setMaxCount] = useLocalStorage<number | "">("tags.maxCount", "", {
    deserializer: numberDeserializer,
    serializer: (v) => v.toString(),
  });
  const [showFilters, setShowFilters] = useState(true);
  const [expandedGroups, setExpandedGroups] = useLocalStorage<Set<string>>("tags.expandedGroups", new Set(), {
    deserializer: dbStringToSet,
    serializer: (v) => setToDbString(v) ?? "",
  });
  const [sortType, setSortType] = useLocalStorage<SortType>("tags.sortType", "count-desc");

  // 处理搜索逻辑
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearchTerm(searchTermShow.trim().toLowerCase());
    },
    [searchTermShow]
  );
  // 过滤和排序标签
  const filteredTags = useMemo(() => {
    const filtered = allTags.filter((tag) => {
      // 名称搜索
      const nameMatch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());

      // 项目数量筛选
      const itemCount = tag._count.items;
      const minMatch = minCount === "" || itemCount >= Number(minCount);
      const maxMatch = maxCount === "" || itemCount <= Number(maxCount);

      return nameMatch && minMatch && maxMatch;
    });

    // 排序
    return filtered.sort((a, b) => {
      switch (sortType) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "count-asc":
          return a._count.items - b._count.items;
        case "count-desc":
        default:
          return b._count.items - a._count.items;
      }
    });
  }, [searchTerm, allTags, minCount, maxCount, sortType]);

  // 按组分组标签
  const groupedTags = useMemo(() => {
    const groups: { [key: string]: TagWithCount[] } = {};
    filteredTags.forEach((tag) => {
      const group = tag.group || "未分类";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(tag);
    });
    return groups;
  }, [filteredTags]);

  const toggleGroupExpanded = useCallback(
    (groupName: string) => {
      setExpandedGroups((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(groupName)) {
          newSet.delete(groupName);
        } else {
          newSet.add(groupName);
        }
        return newSet;
      });
    },
    [setExpandedGroups]
  );

  const stats = useMemo(() => {
    const totalTags = allTags.length;
    const filteredCount = filteredTags.length;
    const totalItems = allTags.reduce((sum, tag) => sum + tag._count.items, 0);

    return {
      totalTags,
      filteredCount,
      totalItems,
      activeFilters: [
        typeof minCount === "number" && minCount > 0 ? `最少${minCount}项` : null,
        typeof maxCount === "number" ? `最多${maxCount}项` : null,
      ].filter(Boolean),
    };
  }, [allTags, filteredTags, minCount, maxCount]);

  return (
    <>
      {/* 搜索头部 */}
      <SearchHeader
        title="标签管理"
        searchTerm={searchTermShow}
        onSearchChange={setSearchTermShow}
        onSubmit={handleSearch}
        searchPlaceholder="搜索标签..."
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* 筛选器 */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                label="至少包含"
                type="number"
                value={minCount}
                onChange={(e) => setMinCount(e.target.value === "" ? "" : Number(e.target.value))}
                size="small"
                sx={{ minWidth: 150 }}
                inputProps={{ min: 0 }}
              />
              <Typography variant="body2" color="text.secondary">
                至
              </Typography>
              <TextField
                label="至多包含"
                type="number"
                value={maxCount}
                onChange={(e) => setMaxCount(e.target.value === "" ? "" : Number(e.target.value))}
                size="small"
                sx={{ minWidth: 150 }}
                inputProps={{ min: 0 }}
                placeholder="不限制"
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>排序方式</InputLabel>
                <Select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  label="排序方式"
                  MenuProps={{ disableScrollLock: true }}
                >
                  <MenuItem value="count-desc">项目数 (高到低)</MenuItem>
                  <MenuItem value="count-asc">项目数 (低到高)</MenuItem>
                  <MenuItem value="name-asc">标签名 (A-Z)</MenuItem>
                  <MenuItem value="name-desc">标签名 (Z-A)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      {/* 统计信息 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          显示 {stats.filteredCount} / {allTags.length} 个标签
          {stats.filteredCount !== allTags.length && <span> · 已应用筛选条件</span>}
        </Typography>
      </Box>

      {/* 内容区域 */}
      <ContentArea
        isEmpty={filteredTags.length === 0}
        emptyMessage={searchTerm || stats.activeFilters.length > 0 ? `没有找到符合条件的标签` : "还没有创建任何标签"}
        skeletonType="cards"
        skeletonCount={9}
      >
        <Stack spacing={4}>
          {Object.keys(groupedTags)
            .sort()
            .map((groupName) => {
              const isExpanded = expandedGroups.has(groupName);
              const groupTags = groupedTags[groupName];

              return (
                <Box key={groupName}>
                  {/* 分组标题 */}
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      pb: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                    }}
                    onClick={() => toggleGroupExpanded(groupName)}
                  >
                    <IconButton size="small" sx={{ mr: 0.5 }}>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </IconButton>
                    <TagIcon size={20} />
                    {`${groupName}(${groupTags.length})`}
                  </Typography>

                  {/* 该分组下的标签 */}
                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          md: "repeat(3, 1fr)",
                          lg: "repeat(4, 1fr)",
                          xl: "repeat(5, 1fr)",
                        },
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      {groupTags.map((tag) => (
                        <TagItem key={tag.id} tag={tag} />
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
        </Stack>
      </ContentArea>
    </>
  );
}
