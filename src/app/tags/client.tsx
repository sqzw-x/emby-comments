"use client";

import React, { useState, useMemo, useCallback } from "react";
import { PageLayout, SearchHeader, ContentArea } from "@/components/common";
import { Tag as TagIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Box, Stack, Typography, Paper, TextField, Collapse, IconButton } from "@mui/material";
import { TagWithCount } from "@/lib/service/tag";
import TagItem from "./components/tag-item";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface TagsClientProps {
  allTags: TagWithCount[];
}

export default function TagsClient({ allTags }: TagsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minCount, setMinCount] = useState<number | "">(2);
  const [maxCount, setMaxCount] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 使用防抖处理搜索和数量筛选
  const searchTerm_ = useDebounce(searchTerm, 1000);
  const minCount_ = useDebounce(minCount, 1000);
  const maxCount_ = useDebounce(maxCount, 1000);

  // 过滤标签
  const filteredTags = useMemo(() => {
    return allTags.filter((tag) => {
      // 名称搜索
      const nameMatch = tag.name.toLowerCase().includes(searchTerm_.toLowerCase());

      // 项目数量筛选
      const itemCount = tag._count.items;
      const minMatch = minCount_ === "" || itemCount >= Number(minCount_);
      const maxMatch = maxCount_ === "" || itemCount <= Number(maxCount_);

      return nameMatch && minMatch && maxMatch;
    });
  }, [searchTerm_, allTags, minCount_, maxCount_]);

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

  // 初始化展开状态：默认折叠包含100个以上标签的分组
  useMemo(() => {
    const newExpandedGroups = new Set<string>();
    Object.entries(groupedTags).forEach(([groupName, tags]) => {
      if (tags.length < 100) {
        newExpandedGroups.add(groupName);
      }
    });
    setExpandedGroups(newExpandedGroups);
  }, [groupedTags]);

  const toggleGroupExpanded = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      newSet.has(groupName) ? newSet.delete(groupName) : newSet.add(groupName);
      return newSet;
    });
  }, []);

  const stats = useMemo(() => {
    const totalTags = allTags.length;
    const filteredCount = filteredTags.length;
    const totalItems = allTags.reduce((sum, tag) => sum + tag._count.items, 0);

    return {
      totalTags,
      filteredCount,
      totalItems,
      activeFilters: [
        typeof minCount_ === "number" && minCount_ > 0 ? `最少${minCount_}项` : null,
        typeof maxCount_ === "number" ? `最多${maxCount_}项` : null,
      ].filter(Boolean),
    };
  }, [allTags, filteredTags, minCount_, maxCount_]);

  const handleMinCountChange = useCallback((value: string) => {
    setMinCount(value === "" ? "" : Number(value));
  }, []);

  const handleMaxCountChange = useCallback((value: string) => {
    setMaxCount(value === "" ? "" : Number(value));
  }, []);

  return (
    <PageLayout>
      {/* 搜索头部 */}
      <SearchHeader
        title="标签管理"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜索标签..."
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* 筛选器 */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="至少包含"
                type="number"
                value={minCount}
                onChange={(e) => handleMinCountChange(e.target.value)}
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
                onChange={(e) => handleMaxCountChange(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                inputProps={{ min: 0 }}
                placeholder="不限制"
              />
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
    </PageLayout>
  );
}
