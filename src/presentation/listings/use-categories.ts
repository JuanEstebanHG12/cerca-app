import { useQuery } from '@tanstack/react-query';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories';
import { CategoryApiGateway } from '../../infrastructure/api/category-api-gateway';
import { listingKeys } from './listing-keys';

const listCategories = new ListCategoriesUseCase(new CategoryApiGateway());

// Long staleTime deliberately: the category catalog barely changes, so there's no reason to
// refetch it every time the search screen remounts.
export function useCategories() {
  return useQuery({
    queryKey: listingKeys.categories(),
    queryFn: () => listCategories.execute(),
    staleTime: 5 * 60_000,
  });
}
