"use server";

import { commentService } from "../service/comment";
import { action } from "./utils";

/**
 * 获取所有评论
 */
export const getAllComments = action(
	commentService.getAllComments.bind(commentService),
);

/**
 * 获取项目的所有评论
 */
export const getCommentsByItemId = action(
	commentService.getCommentsByItemId.bind(commentService),
);
/**
 * 创建新评论
 */
export const createComment = action(
	commentService.createComment.bind(commentService),
);

export const updateComment = action(
	commentService.updateComment.bind(commentService),
);

/**
 * 删除评论
 */
export const deleteComment = action(
	commentService.deleteComment.bind(commentService),
);
