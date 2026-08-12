import { z } from 'zod';
import { CategoryGateway } from '../../application/ports/category-gateway';
import { Category, categorySchema } from '../../domain/models/category';
import { httpClient } from './http-client';

const categoryListSchema = z.array(categorySchema);

export class CategoryApiGateway implements CategoryGateway {
  async list(): Promise<Category[]> {
    const raw = await httpClient.get<unknown>('/categories');
    return categoryListSchema.parse(raw);
  }
}
