"use client";

import { Box, Stack } from "@mui/material";
import { EmbyServer } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { ContentArea, paginateArray, Pagination, SearchHeader } from "@/components/common";
import { ItemsFilter } from "@/components/items/items-filter";
import { ItemForCard, MediaCard } from "@/components/media/media-card";
import { useConfig } from "@/lib/context/config-context";
import Routes from "@/lib/routes";
import { ItemSearchOptions } from "@/lib/service/item";
import { TagWithCount } from "@/lib/service/tag";
import { toSearchParams } from "@/lib/utils/params";
import { getNew, NullablePartial } from "@/lib/utils/types";

interface MoviesClientProps {
  items: ItemForCard[];
  searchOptions: ItemSearchOptions;
  tagOptions: TagWithCount[];
  activeServer: EmbyServer;
}

export default function Items({ items, searchOptions, tagOptions, activeServer }: MoviesClientProps) {
  const router = useRouter();
  const { config, setConfigKey } = useConfig();
  const [searchOption, setSearchOption] = useState(searchOptions);
  const [showFilters, setShowFilters] = useLocalStorage("items.showFilters", false);
  const [pageSize, setPageSize] = useState(config["items.pageSize"]);
  const [curPage, setCurPage] = useLocalStorage("items.curPage", 1);

  // embyCreatedAt 排序由前端进行
  const sortedItems = useMemo(() => {
    if (searchOptions.sortBy === "embyCreatedAt") {
      const sorted = [...items].sort((a, b) => {
        const aDate = a.embyItem?.embyCreateAt;
        const bDate = b.embyItem?.embyCreateAt;
        // null 值排在最后
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        const aTime = new Date(aDate).getTime();
        const bTime = new Date(bDate).getTime();
        return searchOptions.sortOrder === "desc" ? bTime - aTime : aTime - bTime;
      });
      return sorted;
    }
    return items;
  }, [items, searchOptions.sortBy, searchOptions.sortOrder]);

  // 分页数据
  const paginatedData = useMemo(() => {
    return paginateArray(sortedItems, curPage, pageSize);
  }, [sortedItems, curPage, pageSize]);

  // 更新筛选参数并导航
  const updateFilters = useCallback(
    (newFilters: NullablePartial<ItemSearchOptions>) => {
      const search = getNew(newFilters.search, searchOption.search);
      const yearFrom = getNew(newFilters.yearFrom, searchOption.yearFrom);
      const yearTo = getNew(newFilters?.yearTo, searchOption.yearTo);
      const tagIds = getNew(newFilters?.tagIds, searchOption.tagIds);
      const sortBy = getNew(newFilters?.sortBy, searchOption.sortBy);
      const sortOrder = getNew(newFilters?.sortOrder, searchOption.sortOrder);
      if (sortBy) setConfigKey("items.sortBy", sortBy);
      if (sortOrder) setConfigKey("items.sortOrder", sortOrder);
      setSearchOption({ search, yearFrom, yearTo, tagIds, sortBy, sortOrder });
      setCurPage(1); // 重置到第一页
      router.push(Routes.items(toSearchParams({ search, yearFrom, yearTo, tagIds, sortBy, sortOrder })));
    },
    [searchOption, setConfigKey, router, setCurPage]
  );

  // 处理搜索逻辑
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilters({ search: searchOption.search });
    },
    [searchOption.search, updateFilters]
  );

  return (
    <>
      {/* 搜索头部 */}
      <SearchHeader
        title="电影库"
        searchTerm={searchOption.search || ""}
        onSearchChange={(term) => setSearchOption({ ...searchOption, search: term })}
        searchPlaceholder="搜索电影..."
        onSubmit={handleSearch}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* 筛选器 */}
      <ItemsFilter
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        tagOptions={tagOptions}
        searchOption={searchOption}
        onClearFilters={() =>
          updateFilters({ yearFrom: null, yearTo: null, tagIds: [], sortBy: "title", sortOrder: "asc" })
        }
        onFilterChange={updateFilters}
      />

      {/* 内容区域 */}
      <ContentArea
        loading={false}
        isEmpty={paginatedData.items.length === 0}
        emptyMessage={searchOption.search ? `没有找到匹配"${searchOption.search}"的电影` : "没有找到电影"}
        skeletonType="grid"
        skeletonCount={10}
      >
        <Stack spacing={3}>
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
            }}
          >
            {paginatedData.items.map((item) => (
              <MediaCard key={item.id} item={item} activeServer={activeServer} />
            ))}
          </Box>

          {/* 分页组件 */}
          {sortedItems.length > pageSize && (
            <Pagination
              currentPage={paginatedData.pagination.currentPage}
              totalPages={paginatedData.pagination.totalPages}
              onPageChange={(i) => setCurPage(i)}
              showPageSizeSelector={true}
              pageSize={pageSize}
              totalItems={sortedItems.length}
              pageSizeOptions={[10, 20, 30, 50]}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setConfigKey("items.pageSize", newSize);
              }}
            />
          )}
        </Stack>
      </ContentArea>
    </>
  );
}
