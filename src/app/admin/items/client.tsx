"use client";

import MainLayout from "@/components/layouts/main-layout";
import { useCallback, useMemo, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { LocalItem, Tag, Rating } from "@prisma/client";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import { Delete, Plus, Minus, ExternalLink } from "lucide-react";
import { batchDeleteLocalItems, batchAddTagsToItems, batchRemoveTagsFromItems } from "@/lib/actions/item";
import { useToast } from "@/lib/context/toast-context";
import { useConfirm } from "@/lib/context/confirm-context";
import Link from "next/link";
import Routes from "@/lib/routes";
import { useRouter } from "next/navigation";

type LocalItemWithRelations = LocalItem & {
  tags: Tag[];
  rating: Rating | null;
  _count: { embyItems: number };
};

const itemColumns: GridColDef<LocalItemWithRelations>[] = [
  { field: "title", headerName: "标题", width: 200 },
  { field: "year", headerName: "年份", width: 100 },
  { field: "type", headerName: "类型", width: 120 },
  {
    field: "overview",
    headerName: "简介",
    width: 300,
    renderCell: (params) => (
      <div title={params.value} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {params.value}
      </div>
    ),
  },
  {
    field: "tags",
    headerName: "标签",
    width: 200,
    valueGetter: (_, row) => row.tags.map((tag) => tag.name).join(", ") || "无",
  },
  {
    field: "rating",
    headerName: "评分",
    width: 100,
    valueGetter: (_, row) => row.rating?.score || null,
    renderCell: (params) => (params.value ? `${params.value}/10` : "-"),
  },
  {
    field: "embyItems",
    headerName: "Emby项目",
    width: 120,
    valueGetter: (_, row) => row._count.embyItems,
    renderCell: (params) => `${params.value} 个`,
  },
  {
    field: "createdAt",
    headerName: "创建时间",
    width: 180,
    valueFormatter: (_, row) => row.createdAt.toLocaleString(),
  },
  {
    field: "detail",
    headerName: "转到详情",
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Link href={Routes.itemDetail({ id: params.row.id.toString() })} target="_blank">
        <IconButton size="small" title="查看详情">
          <ExternalLink size={16} />
        </IconButton>
      </Link>
    ),
  },
];

interface ItemsAdminProps {
  localItems: LocalItemWithRelations[];
  allTags: Tag[];
}

export function ItemsAdmin({ localItems, allTags }: ItemsAdminProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const [data] = useState<LocalItemWithRelations[]>(localItems);

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const disabled = useMemo(() => selectedRows.size === 0, [selectedRows.size]);

  // tag 选择对话框状态
  const [tagDialogState, setTagDialogState] = useState({ open: false, adding: true });
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // actions
  const handleDeleteItems = useCallback(async () => {
    const confirmed = await confirm({
      title: "删除项目",
      message: "确定要删除选定的项目吗？此操作无法撤销。",
      confirmText: "删除",
    });
    if (!confirmed) return;
    const res = await batchDeleteLocalItems(Array.from(selectedRows));
    setSelectedRows(new Set());
    if (res.success) {
      showSuccess("成功删除选定项目");
    } else {
      showError(`删除失败: ${res.message}`);
    }
    router.refresh();
  }, [selectedRows, confirm, showSuccess, showError, router]);

  const handleAddTags = useCallback(async () => {
    if (tagDialogState.adding) {
      const res = await batchAddTagsToItems(
        selectedRows,
        selectedTags.map((tag) => tag.id)
      );
      if (res.success) {
        showSuccess("成功为选定项目添加标签");
      } else {
        showError(`添加标签失败: ${res.message}`);
      }
    } else {
      const res = await batchRemoveTagsFromItems(
        selectedRows,
        selectedTags.map((tag) => tag.id)
      );
      if (res.success) {
        showSuccess("成功从选定项目移除标签");
      } else {
        showError(`移除标签失败: ${res.message}`);
      }
    }
    setTagDialogState({ open: false, adding: true });
    setSelectedTags([]);
    setSelectedRows(new Set());
    router.refresh();
  }, [selectedRows, selectedTags, tagDialogState, showSuccess, showError, router]);

  return (
    <MainLayout>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          项目管理
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ alignSelf: "center" }}>
            已选择 {selectedRows.size} 个项目
          </Typography>
          <Button
            disabled={disabled}
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={() => setTagDialogState({ open: true, adding: true })}
          >
            添加标签
          </Button>
          <Button
            disabled={disabled}
            variant="outlined"
            startIcon={<Minus size={16} />}
            onClick={() => setTagDialogState({ open: true, adding: false })}
          >
            移除标签
          </Button>
          <Button
            disabled={disabled}
            variant="outlined"
            color="error"
            startIcon={<Delete size={16} />}
            onClick={handleDeleteItems}
          >
            删除项目
          </Button>
        </Stack>
      </Box>

      <DataGrid
        columns={itemColumns}
        rows={data}
        getRowId={(row) => row.id}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 20 },
          },
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        checkboxSelection
        onRowSelectionModelChange={(newSelection) => {
          setSelectedRows(newSelection.ids as Set<number>);
        }}
      />

      {/* 标签选择对话框 */}
      <Dialog
        disableScrollLock
        open={tagDialogState.open}
        onClose={() => setTagDialogState({ open: false, adding: true })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{tagDialogState.adding ? "添加标签到选定项目" : "从选定项目移除标签"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              已选择 {selectedRows.size} 个项目
            </Typography>
            <Autocomplete
              multiple
              options={allTags}
              getOptionLabel={(t) => t.name}
              value={selectedTags}
              onChange={(_, newTags) => setSelectedTags(newTags)}
              renderInput={(params) => <TextField {...params} label="选择标签" placeholder="搜索标签..." />}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTagDialogState({ open: false, adding: true });
              setSelectedTags([]);
            }}
          >
            取消
          </Button>
          <Button onClick={handleAddTags} variant="contained" disabled={selectedTags.length === 0}>
            {tagDialogState.adding ? "添加标签" : "移除标签"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
