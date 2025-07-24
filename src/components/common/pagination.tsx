"use client";

import {
	Box,
	FormControl,
	InputLabel,
	MenuItem,
	Pagination as MuiPagination,
	Select,
	type SelectProps,
	Stack,
	Typography,
} from "@mui/material";
import type React from "react";

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
	maxVisiblePages?: number;
	// 页面大小配置
	pageSize?: number;
	onPageSizeChange?: (pageSize: number) => void;
	pageSizeOptions?: number[];
	showPageSizeSelector?: boolean;
	totalItems?: number;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	className = "",
	pageSize = 10,
	onPageSizeChange,
	pageSizeOptions = [5, 10, 20, 50],
	showPageSizeSelector = false,
	totalItems,
}: PaginationProps) {
	// 如果只有一页或没有页面，不显示分页
	if (totalPages <= 1) {
		return null;
	}

	const handlePageChange = (
		_event: React.ChangeEvent<unknown>,
		page: number,
	) => {
		onPageChange(page);
	};

	const handlePageSizeChange: SelectProps<number>["onChange"] = (event) => {
		const newPageSize = event.target.value;
		onPageSizeChange?.(newPageSize);
	};

	return (
		<Box className={className} sx={{ mt: 3 }}>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={2}
				alignItems="center"
				justifyContent="space-between"
			>
				{/* 分页信息 */}
				{totalItems !== undefined && (
					<Typography variant="body2" color="text.secondary">
						显示第 {Math.min((currentPage - 1) * pageSize + 1, totalItems)} -{" "}
						{Math.min(currentPage * pageSize, totalItems)} 项，共 {totalItems}{" "}
						项
					</Typography>
				)}

				{/* 分页控件 */}
				<Stack direction="row" spacing={2} alignItems="center">
					{/* 页面大小选择器 */}
					{showPageSizeSelector && onPageSizeChange && (
						<FormControl size="small" sx={{ minWidth: 120 }}>
							<InputLabel>每页显示</InputLabel>
							<Select
								value={pageSize}
								label="每页显示"
								onChange={handlePageSizeChange}
								MenuProps={{ disableScrollLock: true }}
							>
								{pageSizeOptions.map((option) => (
									<MenuItem key={option} value={option}>
										{option} 项
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}

					{/* MUI 分页组件 */}
					<MuiPagination
						count={totalPages}
						page={currentPage}
						onChange={handlePageChange}
						variant="outlined"
						shape="rounded"
						size="medium"
						showFirstButton
						showLastButton
					/>
				</Stack>
			</Stack>
		</Box>
	);
}

// 计算分页信息的工具函数
export interface PaginationInfo {
	currentPage: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	startIndex: number;
	endIndex: number;
}

export function calculatePagination(
	currentPage: number,
	pageSize: number,
	totalItems: number,
): PaginationInfo {
	const totalPages = Math.ceil(totalItems / pageSize);
	const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
	const startIndex = (validCurrentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

	return {
		currentPage: validCurrentPage,
		pageSize,
		totalItems,
		totalPages,
		startIndex,
		endIndex,
	};
}

// 分页数据的类型
export interface PaginatedData<T> {
	items: T[];
	pagination: PaginationInfo;
}

// 对数组进行分页的工具函数
export function paginateArray<T>(
	items: T[],
	currentPage: number,
	pageSize: number,
): PaginatedData<T> {
	const pagination = calculatePagination(currentPage, pageSize, items.length);
	const paginatedItems = items.slice(
		pagination.startIndex,
		pagination.endIndex + 1,
	);

	return {
		items: paginatedItems,
		pagination,
	};
}
