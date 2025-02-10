import { config } from '../config';
import { NewPost, Post } from '../types/Post';
import api from '../utils/axiosConfig';
import { CommentService } from './CommentService';
import { getUserId } from './UserService';

export const PostService = {
  uploadPost: async (post: NewPost, image: File, userToken: string | null): Promise<Post> => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('plantType', post.plantType);
    formData.append('content', post.content);
    formData.append('owner', post.ownerId);

    const response = await api.post(`${config.API_BASE_URL}/posts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userToken}`,
      },
    });

    return response.data;
  },

  getPosts: async (userId?: string, page: number = 1, limit: number = 4): Promise<Post[]> => {
    const response = await api.get(`${config.API_BASE_URL}/posts`, {
      params: { owner: userId, page, limit },
    });

    const posts = response.data;
    const postsWithCommentsCount = await Promise.all(
      posts.map(async (post: Post) => {
        const comments = await CommentService.getCommentsByPost(post.id);
        return { ...post, commentsCount: comments.length };
      })
    );

    console.log(postsWithCommentsCount);

    return postsWithCommentsCount;
  },

  getPostById: async (postId: string): Promise<Post> => {
    const response = await api.get(`${config.API_BASE_URL}/posts/${postId}`);
    return response.data;
  },

  updatePost: async (postId: string, updatedPost: Partial<Post>, image?: File): Promise<Post> => {
    const formData = new FormData();
    formData.append('userId', getUserId());
    if (image) formData.append('image', image);
    if (updatedPost.plantType) formData.append('plantType', updatedPost.plantType);
    if (updatedPost.content) formData.append('content', updatedPost.content);

    const response = await api.put(`${config.API_BASE_URL}/posts/${postId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`${config.API_BASE_URL}/posts/${postId}`, {
      data: { userId: getUserId() },
    });
  },

  hasLiked: async (postId: string): Promise<{ hasLiked: boolean }> => {
    const response = await api.get(`${config.API_BASE_URL}/posts/${postId}/hasLiked/${getUserId()}`);
    return response.data;
  },

  toggleLike: async (postId: string): Promise<{ hasLiked: boolean; message: string; likedBy: string[] }> => {
    const response = await api.post(`${config.API_BASE_URL}/posts/${postId}/toggleLike/${getUserId()}`);
    return response.data;
  },

  generateAiDescription: async (plantType: string): Promise<{ description: string }> => {
    const response = await api.get(`${config.API_BASE_URL}/ai/flower-description`, { params: { plantType } });
    return response.data;
  },
};
