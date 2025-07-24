import type { ExternalLinkProvider, PrismaClient } from "@prisma/client";

import { dbClient } from "@/lib/db/prisma";

export type CreateExternalLinkProviderData = {
	name: string;
	key: string;
	template: string;
	isEnabled?: boolean;
	order?: number;
};

export type UpdateExternalLinkProviderData = {
	name?: string;
	key?: string;
	template?: string;
	isEnabled?: boolean;
	order?: number;
};

class ExternalLinkProviderService {
	private prisma: PrismaClient;

	constructor(prismaClient: PrismaClient) {
		this.prisma = prismaClient;
	}

	// 获取所有外部链接提供商
	async getAllProviders(): Promise<ExternalLinkProvider[]> {
		return await this.prisma.externalLinkProvider.findMany({
			orderBy: [{ order: "asc" }, { createdAt: "asc" }],
		});
	}

	// 创建外部链接提供商
	async createProvider(
		data: CreateExternalLinkProviderData,
	): Promise<ExternalLinkProvider> {
		// 检查 key 是否已存在
		const existing = await this.prisma.externalLinkProvider.findUnique({
			where: { key: data.key },
		});
		if (existing) {
			throw new Error(`外部链接提供商键 "${data.key}" 已存在`);
		}

		return await this.prisma.externalLinkProvider.create({
			data: {
				name: data.name,
				key: data.key,
				template: data.template,
				isEnabled: data.isEnabled ?? true,
				order: data.order ?? 0,
			},
		});
	}

	// 更新外部链接提供商
	async updateProvider(
		id: number,
		data: UpdateExternalLinkProviderData,
	): Promise<ExternalLinkProvider> {
		const provider = await this.prisma.externalLinkProvider.findUnique({
			where: { id },
		});
		if (!provider) {
			throw new Error("外部链接提供商不存在");
		}

		// 如果要更新 key，检查是否已存在
		if (data.key && data.key !== provider.key) {
			const existing = await this.prisma.externalLinkProvider.findUnique({
				where: { key: data.key },
			});
			if (existing) {
				throw new Error(`外部链接提供商键 "${data.key}" 已存在`);
			}
		}

		return await this.prisma.externalLinkProvider.update({
			where: { id },
			data,
		});
	}

	// 删除外部链接提供商
	async deleteProvider(id: number): Promise<void> {
		const provider = await this.prisma.externalLinkProvider.findUnique({
			where: { id },
		});
		if (!provider) {
			throw new Error("外部链接提供商不存在");
		}

		await this.prisma.externalLinkProvider.delete({
			where: { id },
		});
	}

	// 批量更新显示顺序
	async updateProvidersOrder(
		updates: { id: number; order: number }[],
	): Promise<void> {
		await this.prisma.$transaction(
			updates.map((update) =>
				this.prisma.externalLinkProvider.update({
					where: { id: update.id },
					data: { order: update.order },
				}),
			),
		);
	}

	// 初始化默认的外部链接提供商
	async initDefaultProviders(): Promise<void> {
		const defaultProviders = [
			{
				name: "IMDB",
				key: "imdb",
				template: "https://www.imdb.com/title/{value}",
				order: 1,
			},
			{
				name: "TMDB",
				key: "tmdb",
				template: "https://www.themoviedb.org/movie/{value}",
				order: 2,
			},
			{
				name: "TVDB",
				key: "tvdb",
				template: "https://thetvdb.com/series/{value}",
				order: 3,
			},
			{
				name: "Trakt",
				key: "trakt",
				template: "https://trakt.tv/movies/{value}",
				order: 4,
			},
		];

		for (const provider of defaultProviders) {
			const existing = await this.prisma.externalLinkProvider.findUnique({
				where: { key: provider.key },
			});
			if (!existing) {
				await this.prisma.externalLinkProvider.create({
					data: { ...provider, isEnabled: false },
				});
			}
		}
	}
}

// 创建全局实例
export const externalLinkProviderService = new ExternalLinkProviderService(
	dbClient,
);
