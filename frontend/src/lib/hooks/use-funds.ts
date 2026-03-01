import { useQuery } from "@tanstack/react-query";
import { searchFunds } from "@/lib/api/funds";
import { useDebounce } from "./use-debounce";

export function useFundSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["funds-search", debouncedQuery],
    queryFn: () => searchFunds(debouncedQuery, 20),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });
}
