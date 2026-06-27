const storefrontPrefix = 'apps/storefront/';
const sellerPrefix = 'apps/seller/';

function toRelativeFiles(files, prefix) {
  return files
    .filter((file) => file.startsWith(prefix))
    .map((file) => file.slice(prefix.length));
}

function quoteFiles(files) {
  return files.map((file) => JSON.stringify(file)).join(' ');
}

function createEslintCommand({ cwd, files }) {
  if (files.length === 0) {
    return [];
  }

  return [
    `pnpm --dir ${cwd} exec eslint --fix --no-warn-ignored ${quoteFiles(files)}`,
  ];
}

export default {
  'apps/storefront/**/*.{js,ts,vue}': (files) =>
    createEslintCommand({
      cwd: 'apps/storefront',
      files: toRelativeFiles(files, storefrontPrefix),
    }),
  'apps/seller/**/*.{js,ts,vue}': (files) =>
    createEslintCommand({
      cwd: 'apps/seller',
      files: toRelativeFiles(files, sellerPrefix),
    }),
  'packages/**/*.{js,ts,vue}': ['pnpm lint:packages:fix'],
};
