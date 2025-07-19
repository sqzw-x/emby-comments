"use client";

import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Delete, ExternalLink, Merge, Tag } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { batchDeleteTags, batchSetTagGroup, mergeTags } from "@/lib/actions/tag";
import { useConfirm } from "@/lib/context/confirm-context";
import { useToast } from "@/lib/context/toast-context";
import Routes from "@/lib/routes";
import { TagWithCount } from "@/lib/service/tag";

const tagColumns: GridColDef<TagWithCount>[] = [
  { field: "name", headerName: "名称", width: 200 },
  { field: "count", headerName: "项目数", width: 150, valueGetter: (_, row) => row._count.items },
  { field: "group", headerName: "分组", width: 200 },
  { field: "description", headerName: "描述", width: 300 },
  {
    field: "createdAt",
    headerName: "创建时间",
    width: 200,
    valueFormatter: (_, row) => row.createdAt.toLocaleString(),
  },
  {
    field: "detail",
    headerName: "转到详情",
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Link href={Routes.tagDetail({ id: params.row.id.toString() })} target="_blank">
        <IconButton size="small" title="查看详情">
          <ExternalLink size={16} />
        </IconButton>
      </Link>
    ),
  },
];

interface TagsAdminProps {
  initData: TagWithCount[];
  groups: Set<string>;
}

export function TagsAdmin({ initData, groups }: TagsAdminProps) {
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const [data] = useState<TagWithCount[]>(initData);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [setGroupDialogOpen, setSetGroupDialogOpen] = useState(false);
  const [groupValue, setGroupValue] = useState<string>("");

  const disabled = useMemo(() => selectedRows.size === 0, [selectedRows.size]);
  const mergeDisabled = useMemo(() => selectedRows.size < 2, [selectedRows.size]);

  // 设置分组
  const groupOptions = useMemo(() => Array.from(groups).sort(), [groups]);
  const handleConfirmSetGroup = useCallback(async () => {
    const res = await batchSetTagGroup(Array.from(selectedRows), groupValue);
    setSetGroupDialogOpen(false);
    setGroupValue("");
    setSelectedRows(new Set());
    if (res.success) {
      showSuccess(`成功设置 ${selectedRows.size} 个标签的分组为 "${groupValue}"`);
    } else {
      showError(`设置分组失败: ${res.message}`);
    }
    location.reload();
  }, [selectedRows, groupValue, showSuccess, showError]);

  const handleCancelSetGroup = useCallback(() => {
    setSetGroupDialogOpen(false);
    setGroupValue("");
  }, []);

  // 删除标签
  const handleDeleteTags = useCallback(async () => {
    const confirmed = await confirm({
      title: "删除标签",
      message: `确定要删除选定的 ${selectedRows.size} 个标签吗？此操作无法撤销。`,
      confirmText: "删除",
    });
    if (!confirmed) return;

    const res = await batchDeleteTags(Array.from(selectedRows));
    setSelectedRows(new Set());
    if (res.success) {
      showSuccess(`成功删除标签`);
    } else {
      showError(`删除失败: ${res.message}`);
    }
    location.reload();
  }, [selectedRows, confirm, showSuccess, showError]);

  // 合并标签
  const handleMergeTags = useCallback(async () => {
    const confirmed = await confirm({
      title: "合并标签",
      message: `确定要合并 ${selectedRows.size} 个标签吗？源标签将被删除。`,
      confirmText: "合并",
    });
    if (!confirmed) return;
    const tags = data
      .filter((tag) => selectedRows.has(tag.id))
      .sort((a, b) => b._count.items - a._count.items)
      .map((tag) => tag.id);

    const res = await mergeTags(tags.slice(1), tags[0]);
    if (res.success) {
      showSuccess(`成功合并标签`);
      setSelectedRows(new Set());
    } else {
      showError(`合并失败: ${res.message}`);
    }
    location.reload();
  }, [selectedRows, data, confirm, showSuccess, showError]);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          标签管理
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ alignSelf: "center" }}>
            已选择 {selectedRows.size} 个标签
          </Typography>
          <Button
            disabled={disabled}
            variant="outlined"
            startIcon={<Tag size={16} />}
            onClick={() => setSetGroupDialogOpen(true)}
          >
            设置分组
          </Button>
          <Button disabled={mergeDisabled} variant="outlined" startIcon={<Merge size={16} />} onClick={handleMergeTags}>
            合并标签
          </Button>
          <Button
            disabled={disabled}
            variant="outlined"
            color="error"
            startIcon={<Delete size={16} />}
            onClick={handleDeleteTags}
          >
            删除标签
          </Button>
        </Stack>
      </Box>
      <DataGrid
        columns={tagColumns}
        rows={data}
        getRowId={(row) => row.id}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 20 } } }}
        pageSizeOptions={[10, 20, 50, 100]}
        checkboxSelection
        onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection.ids as Set<number>)} // safe
      />

      {/* 设置分组对话框 */}
      <Dialog open={setGroupDialogOpen} onClose={handleCancelSetGroup} maxWidth="sm" fullWidth>
        <DialogTitle>设置标签分组</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            为选中的 {selectedRows.size} 个标签设置分组
          </Typography>
          <Autocomplete
            freeSolo
            options={groupOptions}
            value={groupValue}
            onInputChange={(_, newValue) => setGroupValue(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="分组名称"
                placeholder="输入新分组名称或选择现有分组"
                variant="outlined"
                fullWidth
                autoFocus
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSetGroup}>取消</Button>
          <Button onClick={handleConfirmSetGroup} variant="contained">
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
