import { feedbackRepository } from "~/repositories/feedbackRepository";
import type {
  Feedback,
  FeedbackInsert,
  FeedbackWithUser,
} from "~/types/feedback";

export const feedbackService = {
  /**
   * Create new feedback
   */
  async createFeedback(feedbackData: FeedbackInsert): Promise<Feedback> {
    if (!feedbackData.title?.trim()) {
      throw new Error("Le titre est requis");
    }

    if (!feedbackData.description?.trim()) {
      throw new Error("La description est requise");
    }

    if (!feedbackData.type) {
      throw new Error("Le type de feedback est requis");
    }

    return await feedbackRepository.create(feedbackData);
  },

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: string): Promise<FeedbackWithUser | null> {
    if (!id?.trim()) {
      throw new Error("Feedback ID is required");
    }

    return await feedbackRepository.findById(id);
  },

  /**
   * Get all feedbacks (admin only)
   */
  async getAllFeedback(): Promise<FeedbackWithUser[]> {
    return await feedbackRepository.findMany();
  },

  /**
   * Get feedbacks for specific user
   */
  async getUserFeedback(userId: string): Promise<Feedback[]> {
    if (!userId?.trim()) {
      throw new Error("User ID is required");
    }

    return await feedbackRepository.findByUserId(userId);
  },

  /**
   * Delete feedback
   */
  async deleteFeedback(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error("Feedback ID is required");
    }

    await feedbackRepository.delete(id);
  },
};
