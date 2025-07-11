"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
} from "@mui/material";
import { Edit, Trash2, Plus, GripVertical, ExternalLink } from "lucide-react";
import { useToast } from "@/lib/context/toast-context";
import { useConfirm } from "@/lib/context/confirm-context";
import {
  createExternalLinkProvider,
  updateExternalLinkProvider,
  deleteExternalLinkProvider,
} from "@/lib/actions/external-link-provider";
import { ExternalLinkProvider } from "@prisma/client";

interface ExternalLinkSettingProps {
  providers: ExternalLinkProvider[];
  onProvidersChange: () => void;
}

export default function ExternalLinkSetting({ providers, onProvidersChange }: ExternalLinkSettingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ExternalLinkProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", key: "", template: "", isEnabled: true, order: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { showSuccess, showError } = useToast();
  const { confirm, setLoading: setConfirmLoading } = useConfirm();

  // 重置表单
  const resetForm = () => {
    setFormData({ name: "", key: "", template: "", isEnabled: true, order: providers.length });
    setFormErrors({});
    setEditingProvider(null);
  };

  // 打开添加对话框
  const handleAddClick = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEditClick = (provider: ExternalLinkProvider) => {
    setFormData(provider);
    setEditingProvider(provider);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  // 关闭对话框
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "名称不能为空";
    }

    if (!formData.key.trim()) {
      errors.key = "键不能为空";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.key)) {
      errors.key = "键只能包含字母、数字、下划线和连字符";
    } else {
      // 检查键是否已存在（排除当前编辑的项目）
      const existingProvider = providers.find(
        (p) => p.key === formData.key.toLowerCase() && p.id !== editingProvider?.id
      );
      if (existingProvider) {
        errors.key = "此键已存在";
      }
    }

    if (!formData.template.trim()) {
      errors.template = "URL模板不能为空";
    } else if (!formData.template.includes("{value}")) {
      errors.template = "URL模板必须包含 {value} 占位符";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    if (editingProvider) {
      // 更新
      const result = await updateExternalLinkProvider(editingProvider.id, formData);
      if (result.success) {
        showSuccess("外部链接提供商更新成功");
        handleDialogClose();
        onProvidersChange();
      } else {
        showError(`更新失败: ${result.message}`);
      }
    } else {
      // 创建
      const result = await createExternalLinkProvider(formData);
      if (result.success) {
        showSuccess("外部链接提供商创建成功");
        handleDialogClose();
        onProvidersChange();
      } else {
        showError(`创建失败: ${result.message}`);
      }
    }
    setIsLoading(false);
  };

  // 删除提供商
  const handleDelete = async (provider: ExternalLinkProvider) => {
    const confirmed = await confirm({
      title: "删除外部链接提供商",
      message: `确定要删除 "${provider.name}" 吗？此操作无法撤销。`,
      confirmText: "删除",
    });

    if (!confirmed) return;

    setIsLoading(true);
    setConfirmLoading(true);
    const result = await deleteExternalLinkProvider(provider.id);
    if (result.success) {
      showSuccess("外部链接提供商删除成功");
      onProvidersChange();
    } else {
      showError(`删除失败: ${result.message}`);
    }
    setIsLoading(false);
    setConfirmLoading(false);
  };

  // 切换启用状态
  const handleToggleEnabled = async (provider: ExternalLinkProvider) => {
    setIsLoading(true);
    const result = await updateExternalLinkProvider(provider.id, {
      isEnabled: !provider.isEnabled,
    });
    if (result.success) {
      showSuccess(`${provider.name} ${provider.isEnabled ? "已禁用" : "已启用"}`);
      onProvidersChange();
    } else {
      showError(`操作失败: ${result.message}`);
    }
    setIsLoading(false);
  };

  // 测试URL模板
  const testTemplate = (template: string) => {
    if (!template.includes("{value}")) return null;
    return template.replace("{value}", "tt0111161"); // 使用《肖申克的救赎》的IMDB ID作为示例
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: "bold" }}>
          外部链接设置
        </Typography>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleAddClick}>
          添加提供商
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        外部链接提供商用于生成项目详情页中的外部链接。URL模板中使用 {"{value}"} 作为外部ID的占位符。
      </Alert>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>排序</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>键</TableCell>
              <TableCell>URL模板</TableCell>
              <TableCell>状态</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">暂无外部链接提供商</Typography>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <GripVertical size={16} color="disabled" />
                    {provider.order}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {provider.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {provider.key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {provider.template}
                      </Typography>
                      {testTemplate(provider.template) && (
                        <IconButton
                          size="small"
                          href={testTemplate(provider.template)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="测试链接"
                        >
                          <ExternalLink size={14} />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={provider.isEnabled}
                      onChange={() => handleToggleEnabled(provider)}
                      disabled={isLoading}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(provider)}
                        disabled={isLoading}
                        title="编辑"
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(provider)}
                        disabled={isLoading}
                        color="error"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth disableScrollLock>
        <DialogTitle>{editingProvider ? "编辑外部链接提供商" : "添加外部链接提供商"}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name || "显示名称，如 IMDB"}
              fullWidth
              disabled={isLoading}
            />

            <TextField
              label="键"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              error={!!formErrors.key}
              helperText={formErrors.key || "唯一标识符，只能包含字母、数字、下划线和连字符，如 imdb"}
              fullWidth
              disabled={isLoading}
            />

            <TextField
              label="URL模板"
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              error={!!formErrors.template}
              helperText={
                formErrors.template || "URL模板，使用 {value} 作为外部ID占位符，如 https://www.imdb.com/title/{value}"
              }
              fullWidth
              multiline
              rows={2}
              disabled={isLoading}
            />

            {formData.template && testTemplate(formData.template) && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  预览链接（使用示例ID tt0111161）:
                </Typography>
                <Typography
                  variant="body2"
                  component="a"
                  href={testTemplate(formData.template)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  {testTemplate(formData.template)}
                </Typography>
              </Box>
            )}

            <TextField
              label="显示顺序"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              helperText="数字越小越靠前显示"
              fullWidth
              disabled={isLoading}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  disabled={isLoading}
                />
              }
              label="启用此提供商"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
            {editingProvider ? "更新" : "创建"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
