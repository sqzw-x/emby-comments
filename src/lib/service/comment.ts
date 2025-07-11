import { dbClient } from "../db/prisma";

class CommentService {
  /**
   * 根据本地项目ID获取所有评论
   */
  async getCommentsByItemId(localItemId: number) {
    return dbClient.comment.findMany({
      where: {
        localItemId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * 获取单个评论
   */
  async getCommentById(id: number) {
    return dbClient.comment.findUnique({
      where: { id },
    });
  }

  /**
   * 创建新评论
   */
  async createComment(localItemId: number, content: string) {
    return dbClient.comment.create({
      data: {
        localItemId: localItemId,
        content: content,
      },
    });
  }

  /**
   * 更新评论
   */
  async updateComment(id: number, content: string) {
    return dbClient.comment.update({
      where: { id },
      data: { content },
    });
  }

  /**
   * 删除评论
   */
  async deleteComment(id: number) {
    return dbClient.comment.delete({
      where: { id },
    });
  }

  /**
   * 获取所有评论
   */
  async getAllComments() {
    return dbClient.comment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        localItem: {
          include: {
            embyItems: true,
          },
        },
      },
    });
  }
}

export const commentService = new CommentService();
