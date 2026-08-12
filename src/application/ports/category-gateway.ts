import { Category } from '../../domain/models/category';

export interface CategoryGateway {
  list(): Promise<Category[]>;
}
