export default function<T extends unknown[]>(
  arr: T,
  item: unknown,
  index: number
): T {
  const newArr = arr.reduce((s: unknown[], a, i) => {
    i === index ? s.push(item, a) : s.push(a);
    return s;
  }, []);
  return newArr as T;
}
