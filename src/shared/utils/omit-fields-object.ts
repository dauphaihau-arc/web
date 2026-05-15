export default function<Data extends object, Keys extends keyof Data>(
  data: Data,
  keys: Keys[]
): Omit<Data, Keys> {
  const result = { ...data };

  for (const key of keys) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete result[key];
  }

  return result;
}
