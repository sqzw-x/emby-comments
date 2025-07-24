export class CacheManager<T> {
	private cachedData: T | null = null;
	private lastFetchTime = 0;
	private readonly cacheDuration: number;

	constructor(cacheDuration = 60 * 1000) {
		// 默认缓存时间1分钟
		this.cacheDuration = cacheDuration;
	}

	// 获取缓存数据，如果缓存有效则返回，否则使用 fetcher 函数获取新数据
	async get(fetcher: () => Promise<T | null>): Promise<T | null> {
		const currentTime = Date.now();

		// 如果缓存有效且未过期，直接返回缓存
		if (
			this.cachedData &&
			currentTime - this.lastFetchTime < this.cacheDuration
		) {
			return this.cachedData;
		}

		try {
			// 获取新数据并更新缓存
			const newData = await fetcher();
			this.set(newData);
			return newData;
		} catch (error) {
			console.error("缓存获取数据失败:", error);
			return null;
		}
	}

	// 手动设置缓存
	set(data: T | null): void {
		this.cachedData = data;
		this.lastFetchTime = Date.now();
	}

	// 清除缓存
	clear(): void {
		this.cachedData = null;
		this.lastFetchTime = 0;
	}
}
