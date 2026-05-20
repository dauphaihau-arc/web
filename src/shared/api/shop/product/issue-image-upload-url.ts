import type { Product } from '~/shared/models/product';

export type IssueProductImageUploadUrlRequest = {
  productId: Product['id']
  content_type: string
  asset_type?: 'original'
};

export type IssueProductImageUploadUrlResponse = {
  key: string
  presigned_url: string
  method?: 'PUT'
};
