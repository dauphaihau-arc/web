import { meProductReviewApi } from '~/shared/api/me/product-review/me-product-review.api';

export async function uploadReviewImage(input: {
  orderItemId: string
  file: File
  apiBaseURL: string
}) {
  const upload = await meProductReviewApi.issueImageUploadUrl(input.orderItemId, {
    content_type: input.file.type,
    size_bytes: input.file.size,
  });

  const headers = new Headers({
    'Content-Type': input.file.type,
  });
  const uploadTarget = new URL(upload.presigned_url, window.location.origin);
  const apiOrigin = new URL(input.apiBaseURL).origin;

  const response = await fetch(uploadTarget.toString(), {
    method: upload.method,
    headers,
    body: input.file,
    credentials: uploadTarget.origin === apiOrigin ? 'include' : 'omit',
  });

  if (!response.ok) {
    throw new Error('Unable to upload review image');
  }

  return {
    key: upload.key,
  };
}
