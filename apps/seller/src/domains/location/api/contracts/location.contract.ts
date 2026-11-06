/**
 * Wire shapes of the Arc location reference endpoints. They are plain public
 * JSON arrays (no auth envelope) and are hand-written here until the endpoint
 * publishes a generated client.
 */
export type Country = {
  code: string
  name: string
  has_administrative_areas: boolean
  postal_code_required: boolean
};

export type GetCountriesResponse = Country[];
