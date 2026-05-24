export enum EnrollmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
}

export interface EnrollmentFilter {
  search?: string;
  page?: number;
  limit?: number;
  courseId?: string;
  status?: EnrollmentStatus;
}
