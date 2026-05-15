export default function<T> (value: string | null): T | undefined {
  try {
    return JSON.parse(value as string);
  }
  catch {
    return undefined;
  }
}
