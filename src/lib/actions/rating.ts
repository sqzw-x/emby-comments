"use server";

import { ratingService } from "../service/rating";
import { action } from "./utils";

/**
 * 获取项目评分
 */
export const getRatingByItemId = action(
	ratingService.getRatingByItemId.bind(ratingService),
);

/**
 * 设置项目评分
 */
export const setRating = action(ratingService.setRating.bind(ratingService));

/**
 * 删除项目评分
 */
export const deleteRating = action(
	ratingService.deleteRating.bind(ratingService),
);
