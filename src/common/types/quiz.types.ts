export interface QuizFilter {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isPublished?: boolean;
  courseId?: string;
}
