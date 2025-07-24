import { dbClient } from "../db/prisma";
import { EmbyClient, type EmbyConfig } from "../sdk/emby";

export type ServerCreateData = EmbyConfig;

export class ServerService {
	/**
	 * 获取所有服务器
	 */
	async getAllServers() {
		return dbClient.embyServer.findMany({
			orderBy: {
				name: "asc",
			},
		});
	}

	/**
	 * 获取单个服务器
	 */
	async getServerById(id: number) {
		return dbClient.embyServer.findUnique({
			where: { id },
		});
	}

	/**
	 * 创建新服务器
	 */
	async createServer(data: ServerCreateData) {
		// 尝试连接服务器，验证API密钥
		const tempClient = new EmbyClient({
			url: data.url,
			apiKey: data.apiKey,
			name: data.name,
			isActive: true,
		});

		const { success, error, serverId } = await tempClient.testConnection();
		if (!success) {
			throw new Error(`无法连接到服务器或API密钥无效: ${error}`);
		}

		if (!serverId) {
			throw new Error("服务器连接成功但未返回服务器ID");
		}

		return dbClient.embyServer.create({
			data: {
				remoteId: serverId,
				name: data.name,
				url: data.url,
				apiKey: data.apiKey,
				isActive: data.isActive ?? true,
			},
		});
	}

	/**
	 * 更新服务器
	 */
	async updateServer(id: number, data: Partial<ServerCreateData>) {
		// 如果更新API密钥或URL，验证连接
		if (data.apiKey || data.url) {
			const server = await dbClient.embyServer.findUnique({
				where: { id },
			});

			if (!server) {
				throw new Error("服务器不存在");
			}

			const tempClient = new EmbyClient({
				url: data.url || server.url,
				apiKey: data.apiKey || server.apiKey,
				name: data.name || server.name,
				isActive: server.isActive,
			});

			const { success } = await tempClient.testConnection();
			if (!success) {
				throw new Error("无法连接到服务器或API密钥无效");
			}
		}

		return dbClient.embyServer.update({
			where: { id },
			data: {
				name: data.name,
				url: data.url,
				apiKey: data.apiKey,
				isActive: data.isActive,
			},
		});
	}

	/**
	 * 删除服务器. 将同时删除与该服务器相关的所有数据项.
	 */
	async deleteServer(id: number) {
		// 检查服务器是否存在
		const server = await dbClient.embyServer.findUnique({
			where: { id },
		});
		if (!server) {
			throw new Error("服务器不存在");
		}
		// 删除与该服务器相关的所有数据项
		await dbClient.embyItem.deleteMany({
			where: { embyServerId: id },
		});
		return dbClient.embyServer.delete({
			where: { id },
		});
	}
}

export const serverService = new ServerService();
