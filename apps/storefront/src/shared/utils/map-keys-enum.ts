export default function (enumVal: object) {
  return Object.keys(enumVal).filter((v) => {
    return isNaN(Number(v));
  });
}
