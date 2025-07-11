"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MediaCard, ItemForCard } from "@/components/media/media-card";
import { PageLayout, SearchHeader, ContentArea, Pagination, paginateArray } from "@/components/common";
import { ItemsFilter } from "@/components/items/items-filter";
import { Box, Stack } from "@mui/material";
import { EmbyServer } from "@prisma/client";
import { TagWithCount } from "@/lib/service/tag";
import Routes from "@/lib/routes";
import { ItemSearchOptions } from "@/lib/service/item";
import { toSearchParams } from "@/lib/utils/params";
import { getNew, NullablePartial } from "@/lib/utils/types";

interface MoviesClientProps {
  items: ItemForCard[];
  searchOptions: ItemSearchOptions;
  tagOptions: TagWithCount[];
  activeServer: EmbyServer;
  curPage: number;
  curPageSize: number;
}

export default function Items({
  items,
  searchOptions,
  tagOptions,
  activeServer,
  curPage,
  curPageSize,
}: MoviesClientProps) {
  const router = useRouter();
  const [searchOption, setSearchOption] = useState(searchOptions);
  const [showFilters, setShowFilters] = useState(false);

  // 分页数据
  const paginatedData = useMemo(() => {
    return paginateArray(items, curPage, curPageSize);
  }, [items, curPage, curPageSize]);

  // 处理搜索逻辑
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchOption.search });
  };

  // 更新筛选参数并导航
  const updateFilters = (newFilters: NullablePartial<ItemSearchOptions & { page?: number; pageSize?: number }>) => {
    const search = getNew(newFilters.search, searchOption.search);
    const yearFrom = getNew(newFilters.yearFrom, searchOption.yearFrom);
    const yearTo = getNew(newFilters?.yearTo, searchOption.yearTo);
    const tagIds = getNew(newFilters?.tagIds, searchOption.tagIds);
    const sortBy = getNew(newFilters?.sortBy, searchOption.sortBy);
    const sortOrder = getNew(newFilters?.sortOrder, searchOption.sortOrder);
    const page = getNew(newFilters?.page, curPage);
    const pageSize = getNew(newFilters?.pageSize, curPageSize);

    setSearchOption({ search, yearFrom, yearTo, tagIds, sortBy, sortOrder });
    router.push(Routes.items(toSearchParams({ search, yearFrom, yearTo, tagIds, sortBy, sortOrder, page, pageSize })));
  };

  return (
    <PageLayout>
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
          {items.length > curPageSize && (
            <Pagination
              currentPage={paginatedData.pagination.currentPage}
              totalPages={paginatedData.pagination.totalPages}
              onPageChange={(i) => updateFilters({ page: i, pageSize: curPageSize })}
              showPageSizeSelector={true}
              pageSize={curPageSize}
              totalItems={items.length}
              pageSizeOptions={[10, 20, 30, 50]}
              onPageSizeChange={(newSize) => updateFilters({ page: 1, pageSize: newSize })}
            />
          )}
        </Stack>
      </ContentArea>
    </PageLayout>
  );
}
