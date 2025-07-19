"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { EmbyServer } from "@prisma/client";
import { Check, Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { createServer, deleteServer, testServerConnection, updateServer } from "@/lib/actions/server";
import { useConfirm } from "@/lib/context/confirm-context";
import { useServerContext } from "@/lib/context/server-context";
import { useToast } from "@/lib/context/toast-context";

import ServerSync from "./sync";

interface EmbyServerSettingProps {
  servers: EmbyServer[];
  onServersChange: () => void;
}

interface ServerFormData {
  name: string;
  url: string;
  apiKey: string;
  isActive: boolean;
}

// 内部的服务器表单组件
function ServerFormDialog({
  open,
  onClose,
  editingServer,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  editingServer: EmbyServer | null;
  onSubmit: (formData: ServerFormData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<ServerFormData>({
    name: editingServer?.name || "",
    url: editingServer?.url || "",
    apiKey: editingServer?.apiKey || "",
    isActive: editingServer?.isActive || false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: editingServer?.name || "",
      url: editingServer?.url || "",
      apiKey: editingServer?.apiKey || "",
      isActive: editingServer?.isActive || false,
    });
    setFormErrors({});
    setTestResult(null);
  };

  // 当编辑服务器变化时重置表单
  React.useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingServer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "服务器名称不能为空";
    }

    if (!formData.url.trim()) {
      errors.url = "服务器URL不能为空";
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      errors.url = "URL格式不正确，必须以 http:// 或 https:// 开头";
    }

    if (!formData.apiKey.trim()) {
      errors.apiKey = "API密钥不能为空";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 测试连接
  const handleTest = async () => {
    if (!formData.url || !formData.apiKey) return;

    setTestResult(null);
    const result = await testServerConnection(formData.url, formData.apiKey);
    setTestResult({
      success: result.success,
      message: result.success ? "连接成功！" : `连接失败: ${result.message}`,
    });
  };

  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableScrollLock>
      <DialogTitle>{editingServer ? "编辑服务器" : "添加新服务器"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="服务器名称"
            name="name"
            placeholder="例如: 家庭媒体服务器"
            value={formData.name}
            onChange={handleChange}
            error={!!formErrors.name}
            helperText={formErrors.name || "给服务器起个容易识别的名称"}
            fullWidth
            disabled={isLoading}
          />

          <TextField
            label="服务器URL"
            name="url"
            placeholder="例如: http://192.168.1.100:8096"
            value={formData.url}
            onChange={handleChange}
            error={!!formErrors.url}
            helperText={formErrors.url || "完整URL地址，包括http://或https://和端口号"}
            fullWidth
            disabled={isLoading}
          />

          <TextField
            label="API密钥"
            name="apiKey"
            placeholder="Emby API密钥"
            value={formData.apiKey}
            onChange={handleChange}
            error={!!formErrors.apiKey}
            helperText={formErrors.apiKey || "在Emby服务器中生成的API密钥，用于授权访问"}
            fullWidth
            disabled={isLoading}
          />

          <FormControlLabel
            control={
              <Checkbox name="isActive" checked={formData.isActive} onChange={handleChange} disabled={isLoading} />
            }
            label="设为活动服务器"
          />

          {testResult && <Alert severity={testResult.success ? "success" : "error"}>{testResult.message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          取消
        </Button>
        <Button onClick={handleTest} disabled={isLoading || !formData.url || !formData.apiKey} variant="outlined">
          {isLoading ? "测试中..." : "测试连接"}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
          {editingServer ? "更新" : "创建"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function EmbyServerSetting({ servers, onServersChange }: EmbyServerSettingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<EmbyServer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // 当前正在同步的服务器
  const [syncingServer, setSyncingServer] = useState<EmbyServer | null>(null);

  const { showSuccess, showError } = useToast();
  const { confirm, setLoading: setConfirmLoading } = useConfirm();
  const { activeServer, setActiveServer, isLoading: isServerLoading } = useServerContext();

  // 打开添加对话框
  const handleAddClick = () => {
    setEditingServer(null);
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEditClick = (server: EmbyServer) => {
    setEditingServer(server);
    setIsDialogOpen(true);
  };

  // 关闭对话框
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingServer(null);
  };

  // 提交服务器表单
  const handleSubmitServer = async (formData: ServerFormData) => {
    setIsLoading(true);
    if (editingServer) {
      // 更新服务器
      const result = await updateServer(editingServer.id, {
        name: formData.name,
        url: formData.url,
        apiKey: formData.apiKey,
        isActive: formData.isActive,
      });
      if (result.success) {
        // 如果更新后的服务器是活动的，更新Context
        if (formData.isActive && result.value.server) {
          await setActiveServer(result.value.server);
        } else if (!formData.isActive && editingServer.isActive) {
          // 如果之前是活动的，现在不是，将activeServer设为null
          await setActiveServer(null);
        }
        showSuccess("服务器更新成功");
      } else {
        showError(`更新失败: ${result.message}`);
        setIsLoading(false);
        return;
      }
    } else {
      // 创建新服务器
      const result = await createServer({
        name: formData.name,
        url: formData.url,
        apiKey: formData.apiKey,
        isActive: formData.isActive,
      });
      if (result.success) {
        // 如果新服务器是活动的，更新Context
        if (formData.isActive) {
          await setActiveServer(result.value);
        }
        showSuccess("服务器添加成功");
      } else {
        showError(`添加失败: ${result.message}`);
        setIsLoading(false);
        return;
      }
    }
    handleDialogClose();
    onServersChange();
    setIsLoading(false);
  };

  // 删除服务器
  const handleDeleteServer = async (server: EmbyServer) => {
    const confirmed = await confirm({
      title: "删除服务器",
      message: `确定要删除 "${server.name}" 吗？相关的数据映射将会丢失。`,
      confirmText: "删除",
    });

    if (!confirmed) return;

    setIsLoading(true);
    setConfirmLoading(true);
    const result = await deleteServer(server.id);
    if (result.success) {
      // 如果删除的是当前激活的服务器，更新Context
      if (activeServer && activeServer.id === server.id) {
        await setActiveServer(null);
      }
      showSuccess("服务器删除成功");
      onServersChange();
    } else {
      showError(`删除失败: ${result.message}`);
    }
    setIsLoading(false);
    setConfirmLoading(false);
  };

  // 设置为活动服务器
  const handleSetActive = async (server: EmbyServer) => {
    setIsLoading(true);
    await setActiveServer(server);
    showSuccess("服务器已激活");
    onServersChange();
    setIsLoading(false);
  };

  // 处理同步按钮点击，如果已经有活动的同步服务器则关闭它，否则设置要同步的服务器ID
  const handleSyncClick = (server: EmbyServer) => {
    if (syncingServer?.id === server.id) {
      setSyncingServer(null);
    } else {
      setSyncingServer(server);
      // 滚动到同步部分
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: "bold" }}>
          Emby 服务器设置
        </Typography>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleAddClick}>
          添加服务器
        </Button>
      </Box>

      {servers.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: "center" }}>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            您尚未添加任何Emby服务器
          </Typography>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleAddClick}>
            添加服务器
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>服务器名称</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servers.map((server) => (
                <TableRow
                  key={server.id}
                  sx={{ backgroundColor: server.isActive ? "action.selected" : "background.paper" }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {server.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {server.url}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {server.isActive ? (
                      <Chip label="活动" color="success" size="small" />
                    ) : (
                      <Chip label="未激活" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {!server.isActive && (
                        <IconButton
                          onClick={() => handleSetActive(server)}
                          size="small"
                          title="设为活动服务器"
                          disabled={isLoading || isServerLoading}
                        >
                          <Check size={16} />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => handleSyncClick(server)}
                        size="small"
                        title={syncingServer?.id === server.id ? "关闭同步面板" : "同步服务器数据"}
                        disabled={isLoading}
                        color={syncingServer?.id === server.id ? "primary" : "default"}
                      >
                        <RefreshCw size={16} />
                      </IconButton>
                      <IconButton
                        onClick={() => handleEditClick(server)}
                        size="small"
                        title="编辑服务器"
                        disabled={isLoading}
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteServer(server)}
                        size="small"
                        title="删除服务器"
                        disabled={isLoading}
                        color="error"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 添加/编辑对话框 */}
      <ServerFormDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        editingServer={editingServer}
        onSubmit={handleSubmitServer}
        isLoading={isLoading}
      />

      {/* 渲染同步组件 */}
      {syncingServer && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: "bold" }}>
            服务器同步
          </Typography>
          <ServerSync server={syncingServer} onClose={() => setSyncingServer(null)} />
        </Box>
      )}
    </Box>
  );
}
