export class ProductResponseDto {
  data: {
    type: string;
    id: number;
    attributes: {
      name: string;
      price: number;
    };
    links?: {
      self: string;
    };
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export class ProductsCollectionResponseDto {
  data: Array<{
    type: string;
    id: number;
    attributes: {
      name: string;
      price: number;
    };
    links?: {
      self: string;
    };
  }>;
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
  links?: {
    self: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}
