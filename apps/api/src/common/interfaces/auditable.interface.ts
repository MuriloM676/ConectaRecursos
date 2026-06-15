/**
 * Interface for entities that support soft deletion and audit tracking.
 */
export interface Auditable {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}
