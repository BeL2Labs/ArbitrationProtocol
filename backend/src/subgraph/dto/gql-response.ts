export type SubgraphGQLResponse<T> = {
  data: T;
  errors?: Array<{ message: string }>;
}