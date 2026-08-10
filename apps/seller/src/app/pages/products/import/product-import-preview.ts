import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = ['title', 'description', 'category_path', 'price', 'stock'] as const;
const PRODUCTS_SHEET = 'Products';
const METADATA_SHEET = 'Metadata';
const PREVIEW_LIMIT = 10;
const MAX_PRODUCT_ROWS = 1_000;

export type ProductImportPreviewRow = {
  row: number
  title: string
  description: string
  sku: string
  categoryPath: string
  price: string
  stock: string
  issues: ProductImportPreviewIssue[]
};

export type ProductImportPreviewIssue = {
  field: ProductImportPreviewField
  message: string
};

export type ProductImportPreview = {
  invalidPreviewRowCount: number
  rows: ProductImportPreviewRow[]
  totalRows: number
};

type ProductImportPreviewField = 'title' | 'description' | 'categoryPath' | 'price' | 'stock';

export async function buildProductImportPreview(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellFormula: true,
  });
  const metadataSheet = workbook.Sheets[METADATA_SHEET];
  const productsSheet = workbook.Sheets[PRODUCTS_SHEET];

  if (!metadataSheet) {
    throw new Error('Missing Metadata sheet.');
  }

  if (!productsSheet) {
    throw new Error('Missing Products sheet.');
  }

  const productRange = getSheetRange(productsSheet);
  const totalRows = getProductRowCount(productRange);
  const headers = readSheetRow(productsSheet, 0, productRange.e.c + 1)
    .map(value => String(value).trim().toLowerCase());

  validateHeaders(productsSheet, headers);

  if (totalRows > MAX_PRODUCT_ROWS) {
    throw new Error('The selected file has more than 1,000 product rows.');
  }

  const columnIndex: Record<string, number | undefined> = Object.fromEntries(
    headers.map((header, index) => [header, index]),
  );

  const productRows = Array.from(
    { length: Math.min(totalRows, PREVIEW_LIMIT) },
    (_, index) => {
      const rowNumber = index + 2;

      return buildPreviewRow(
        productsSheet,
        readSheetRow(productsSheet, rowNumber - 1, productRange.e.c + 1),
        rowNumber,
        columnIndex,
      );
    },
  );

  return {
    invalidPreviewRowCount: productRows.filter(row => row.issues.length > 0).length,
    rows: productRows,
    totalRows,
  };
}

function getSheetRange(sheet: XLSX.WorkSheet) {
  return XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
}

function getProductRowCount(range: XLSX.Range) {
  return Math.max(range.e.r, 0);
}

function readSheetRow(sheet: XLSX.WorkSheet, rowIndex: number, columnCount: number) {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
    const cell = sheet[address] as XLSX.CellObject | undefined;

    return cell?.v ?? '';
  });
}

function buildPreviewRow(
  productsSheet: XLSX.WorkSheet,
  row: unknown[],
  rowNumber: number,
  columnIndex: Record<string, number | undefined>,
): ProductImportPreviewRow {
  const previewRow = {
    row: rowNumber,
    title: formatRowCell(row, columnIndex.title),
    description: formatRowCell(row, columnIndex.description),
    sku: formatRowCell(row, columnIndex.sku),
    categoryPath: formatRowCell(row, columnIndex.category_path),
    price: formatRowCell(row, columnIndex.price),
    stock: formatRowCell(row, columnIndex.stock),
  };

  return {
    ...previewRow,
    issues: validatePreviewRow(productsSheet, rowNumber, columnIndex, previewRow),
  };
}

function validatePreviewRow(
  productsSheet: XLSX.WorkSheet,
  rowNumber: number,
  columnIndex: Record<string, number | undefined>,
  row: Omit<ProductImportPreviewRow, 'issues'>,
) {
  const issues: ProductImportPreviewIssue[] = [];

  addRequiredIssue(issues, 'title', row.title, 'Title is required.');
  addRequiredIssue(issues, 'description', row.description, 'Description is required.');
  addRequiredIssue(issues, 'categoryPath', row.categoryPath, 'Category is required.');

  if (!row.price) {
    issues.push({ field: 'price', message: 'Price is required.' });
  }
  else if (!isPositiveNumber(row.price)) {
    issues.push({ field: 'price', message: 'Price must be a positive number.' });
  }

  if (!row.stock) {
    issues.push({ field: 'stock', message: 'Stock is required.' });
  }
  else if (!isNonNegativeInteger(row.stock)) {
    issues.push({ field: 'stock', message: 'Stock must be a whole number 0 or greater.' });
  }

  addFormulaIssues(issues, productsSheet, rowNumber, columnIndex);

  return issues;
}

function addRequiredIssue(
  issues: ProductImportPreviewIssue[],
  field: ProductImportPreviewField,
  value: string,
  message: string,
) {
  if (!value) {
    issues.push({ field, message });
  }
}

function addFormulaIssues(
  issues: ProductImportPreviewIssue[],
  sheet: XLSX.WorkSheet,
  rowNumber: number,
  columnIndex: Record<string, number | undefined>,
) {
  const fields = [
    { field: 'title', column: columnIndex.title },
    { field: 'description', column: columnIndex.description },
    { field: 'categoryPath', column: columnIndex.category_path },
    { field: 'price', column: columnIndex.price },
    { field: 'stock', column: columnIndex.stock },
  ] as const;

  for (const { field, column } of fields) {
    if (column === undefined) {
      continue;
    }

    const address = XLSX.utils.encode_cell({ r: rowNumber - 1, c: column });
    const cell = sheet[address] as XLSX.CellObject | undefined;

    if (cell?.f) {
      issues.push({ field, message: `${getFieldLabel(field)} cannot use a formula.` });
    }
  }
}

function getFieldLabel(field: ProductImportPreviewField) {
  const labels: Record<ProductImportPreviewField, string> = {
    title: 'Title',
    description: 'Description',
    categoryPath: 'Category',
    price: 'Price',
    stock: 'Stock',
  };

  return labels[field];
}

function isPositiveNumber(value: string) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0;
}

function isNonNegativeInteger(value: string) {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue >= 0;
}

function validateHeaders(productsSheet: XLSX.WorkSheet, headers: string[]) {
  const missingHeaders = REQUIRED_COLUMNS.filter(column => !headers.includes(column));

  const duplicateHeaders = headers.filter((header, index) =>
    header && headers.indexOf(header) !== index,
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}.`);
  }

  if (duplicateHeaders.length > 0) {
    throw new Error(`Duplicate columns: ${[...new Set(duplicateHeaders)].join(', ')}.`);
  }

  if (hasFormulaHeader(productsSheet, headers.length)) {
    throw new Error('Formula cells are not supported in headers.');
  }
}

function hasFormulaHeader(sheet: XLSX.WorkSheet, headerLength: number) {
  for (let columnIndex = 0; columnIndex < headerLength; columnIndex += 1) {
    const address = XLSX.utils.encode_cell({ r: 0, c: columnIndex });
    const cell = sheet[address] as XLSX.CellObject | undefined;

    if (cell?.f) {
      return true;
    }
  }

  return false;
}

function formatCell(value: unknown) {
  return String(value ?? '').trim();
}

function formatRowCell(row: unknown[], columnIndex: number | undefined) {
  if (columnIndex === undefined) {
    return '';
  }

  return formatCell(row[columnIndex]);
}
