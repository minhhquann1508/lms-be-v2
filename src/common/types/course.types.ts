export interface CourseFilter {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  authorId?: string;
  categoryId?: string;
  sortBy?: 'createdAt' | 'rating' | 'price';
  sortOrder?: 'ASC' | 'DESC';
}
