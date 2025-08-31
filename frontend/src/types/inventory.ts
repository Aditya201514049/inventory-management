export interface CustomIdPart {
  type: 'FIXED' | 'RANDOM20' | 'RANDOM32' | 'RANDOM6' | 'RANDOM9' | 'GUID' | 'DATE' | 'SEQUENCE';
  format?: string | null;
  order: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Inventory {
  id: string;
  title: string;
  description?: string;
  categoryId?: string | null;
  imageUrl?: string | null;
  tags: string[];
  isPublic: boolean;
  customIdParts: CustomIdPart[];
  version: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateInventoryInput = Omit<Inventory, 'id' | 'version' | 'ownerId' | 'createdAt' | 'updatedAt'>;
export type UpdateInventoryInput = Partial<CreateInventoryInput> & { version: number };