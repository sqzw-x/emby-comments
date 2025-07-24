"use client";

import type { EmbyServer } from "@prisma/client";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useLocalStorage } from "usehooks-ts";

import { updateServer } from "../actions/server";

type ServerContextType = {
	activeServer: EmbyServer | null;
	setActiveServer: (server: EmbyServer | null) => Promise<void>;
	isLoading: boolean;
};

// 创建上下文
const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({
	children,
	initialActiveServer,
}: {
	children: React.ReactNode;
	initialActiveServer: EmbyServer | null;
}) {
	const [isLoading, setIsLoading] = useState(false);
	// 使用 localStorage 存储最后一个已知的激活服务器
	const [activeServer, setActiveServerState] =
		useLocalStorage<EmbyServer | null>("activeServer", initialActiveServer);

	// 如果服务端提供的初始服务器与本地存储不同，则更新本地存储
	useEffect(() => {
		if (
			initialActiveServer &&
			(!activeServer || initialActiveServer.id !== activeServer.id)
		) {
			setActiveServerState(initialActiveServer);
		}
	}, [initialActiveServer, activeServer, setActiveServerState]);

	// 更新激活服务器的方法
	const setActiveServer = useCallback(
		async (server: EmbyServer | null) => {
			setIsLoading(true);

			if (!server) {
				setActiveServerState(null);
				setIsLoading(false);
				return;
			}

			// 调用服务端Action激活服务器
			const result = await updateServer(server.id, { isActive: true });

			if (result.success) {
				// 更新本地状态
				setActiveServerState(result.value.server);
			} else {
				console.error("更新激活服务器失败:", result.message);
				throw new Error(result.message);
			}
			setIsLoading(false);
		},
		[setActiveServerState],
	);

	return (
		<ServerContext.Provider
			value={{ activeServer, setActiveServer, isLoading }}
		>
			{children}
		</ServerContext.Provider>
	);
}

// 自定义Hook方便使用上下文
export function useServerContext() {
	const context = useContext(ServerContext);
	if (context === undefined) {
		throw new Error("useServerContext必须在ServerProvider内部使用");
	}
	return context;
}
