export type Result<T> =
	| { success: true; value: T }
	| { success: false; message: string };

export function action<A extends unknown[], R>(
	f: (...args: A) => Promise<R>,
): (...args: A) => Promise<Result<Awaited<R>>> {
	return async (...args: A): Promise<Result<Awaited<R>>> => {
		try {
			const value = await f(...args);
			return { success: true, value };
		} catch (error) {
			console.error(`Error in function ${f.name}:`, error);
			return {
				success: false,
				message: error instanceof Error ? error.message : String(error),
			};
		}
	};
}
