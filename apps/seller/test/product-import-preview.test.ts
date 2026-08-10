import {
  describe, expect, it,
} from 'vitest';
import * as XLSX from 'xlsx';
import { buildProductImportPreview } from '../src/app/pages/products/import/product-import-preview';

describe('buildProductImportPreview', () => {
  it('returns preview rows without issues for basic valid rows', async () => {
    const preview = await buildProductImportPreview(createImportFile([
      ['Valid title', 'Valid description', 'Category', '12.50', '3'],
    ]));

    expect(preview.totalRows).toBe(1);
    expect(preview.invalidPreviewRowCount).toBe(0);
    expect(preview.rows[0]).toMatchObject({
      row: 2,
      title: 'Valid title',
      description: 'Valid description',
      categoryPath: 'Category',
      price: '12.50',
      stock: '3',
      issues: [],
    });
  });

  it('adds row issues for obvious invalid values', async () => {
    const preview = await buildProductImportPreview(createImportFile([
      ['', '', '', 'ABC', '1.5'],
    ]));

    expect(preview.rows[0]?.issues).toEqual([
      { field: 'title', message: 'Title is required.' },
      { field: 'description', message: 'Description is required.' },
      { field: 'categoryPath', message: 'Category is required.' },
      { field: 'price', message: 'Price must be a positive number.' },
      { field: 'stock', message: 'Stock must be a whole number 0 or greater.' },
    ]);
    expect(preview.invalidPreviewRowCount).toBe(1);
  });

  it('does not validate invalid rows outside the visible preview limit', async () => {
    const validRows = Array.from({ length: 10 }, (_, index) => [
      `Valid title ${index}`,
      'Valid description',
      'Category',
      '12.50',
      '3',
    ]);

    const preview = await buildProductImportPreview(createImportFile([
      ...validRows,
      ['', 'Valid description', 'Category', '12.50', '3'],
    ]));

    expect(preview.rows).toHaveLength(10);
    expect(preview.invalidPreviewRowCount).toBe(0);
    expect(preview.totalRows).toBe(11);
  });
});

function createImportFile(productRows: unknown[][]) {
  const workbook = XLSX.utils.book_new();
  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ['template_version', 'product-import-v1'],
  ]);
  const productsSheet = XLSX.utils.aoa_to_sheet([
    ['title', 'description', 'category_path', 'price', 'stock'],
    ...productRows,
  ]);

  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  return new File([buffer], 'products.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
