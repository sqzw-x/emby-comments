import { dbClient } from "../db/prisma";

export class RatingService {
	/**
	 * 获取项目的评分
	 */
	async getRatingByItemId(localItemId: number) {
		return dbClient.rating.findFirst({
			where: {
				localItemId,
			},
		});
	}

	/**
	 * 设置项目的评分
	 */
	async setRating(localItemId: number, score: number) {
		return dbClient.rating.upsert({
			where: {
				localItemId,
			},
			update: {
				score,
			},
			create: {
				localItemId,
				score,
			},
		});
	}

	/**
	 * 删除项目的评分
	 */
	async deleteRating(localItemId: number) {
		// 查找评分记录
		const rating = await dbClient.rating.findFirst({
			where: {
				localItemId,
			},
		});

		if (!rating) {
			throw new Error("评分不存在");
		}

		return dbClient.rating.delete({
			where: {
				id: rating.id,
			},
		});
	}

	/**
	 * 计算项目的平均评分
	 * 如果启用了外部集成，可以结合社区评分等
	 */
	async calculateAverageRating(localItemId: number) {
		// 获取项目的关联Emby条目
		const embyItem = await dbClient.embyItem.findFirst({
			where: {
				localItemId,
			},
		});

		if (!embyItem) {
			// 如果没有关联的Emby条目，仅返回用户评分
			const rating = await this.getRatingByItemId(localItemId);
			return rating ? rating.score : null;
		}

		// 获取Emby条目的社区评分
		const communityRating = embyItem.communityRating;

		// 获取用户自己的评分
		const userRating = await this.getRatingByItemId(localItemId);

		if (!communityRating && !userRating) {
			return null;
		}

		// 如果只有其中一种评分，直接返回
		if (!communityRating) return userRating?.score;
		if (!userRating) return communityRating;

		// 综合评分：用户评分权重更高
		return userRating.score * 0.7 + communityRating * 0.3;
	}

	/**
	 * 获取评分统计
	 */
	async getRatingStats() {
		const ratings = await dbClient.rating.findMany({
			select: {
				score: true,
			},
		});

		if (ratings.length === 0) {
			return {
				average: 0,
				count: 0,
				distribution: {} as Record<number, number>,
			};
		}

		// 计算平均分
		const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
		const average = sum / ratings.length;

		// 计算评分分布
		const distribution: Record<number, number> = {};
		for (let i = 1; i <= 10; i++) {
			distribution[i] = 0;
		}

		ratings.forEach((rating) => {
			distribution[rating.score]++;
		});

		return {
			average,
			count: ratings.length,
			distribution,
		};
	}
}

export const ratingService = new RatingService();
