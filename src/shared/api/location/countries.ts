export type GetCountriesResponse = {
  data: {
    name: string
    Iso2?: string
  }[]
};

export type GetStatesByCountryRequest = {
  country?: string
};

export type GetStatesByCountryResponse = {
  data: {
    states: {
      name: string
    }[]
  }
};
