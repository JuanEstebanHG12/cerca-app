import { Category } from '../../domain/models/category';
import { CategoryGateway } from '../ports/category-gateway';

export class ListCategoriesUseCase {
  constructor(private readonly categoryGateway: CategoryGateway) {}

  execute(): Promise<Category[]> {
    return this.categoryGateway.list();
  }
}
