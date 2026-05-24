export default function parseJson<T>(value: string | null): T | undefined {
  try {
    return JSON.parse(value as string);
  }
  catch {
    return undefined;
  }
}

export const parseJSON = parseJson;
