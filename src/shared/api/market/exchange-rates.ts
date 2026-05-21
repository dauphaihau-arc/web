export type ExchangeRatesResponse = {
  rates: { [key: string]: number }
  time_next_update_unix: number
};
