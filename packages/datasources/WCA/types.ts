export type ApiCompetition = {
  id: string;
  name: string;
  city: string;
  competitor_limit: number;
  country_iso2: string;
  start_date: string;
  end_date: string;
  cancelled_at: string | null;
  event_ids: string[];
};

export type ApiResult = {
  id: number;
  pos: number;
  best: number;
  average: number;
  name: string;
  country_iso2: string;
  competition_id: string;
  event_id: string;
  round_type_id: string;
  format_id: string;
  wca_id: string;
  attempts: [number, number, number, number, number];
  best_index: number;
  worst_index: number;
  regional_single_record: string;
  regional_average_record: string;
};

export type APIPerson = {
  id: string;
  created_at: string | null;
  updated_at: string;
  name: string;
  wca_id: string;
  gender: string;
  country_iso2: string;
  country: CountryMetadata;
  delegate_status: string | null;
  class: string;
  avatar: Avatar;
};

export type Avatar = {
  id: null;
  status: string;
  thumbnail_crop_x: number;
  thumbnail_crop_y: number;
  thumbnail_crop_w: number;
  thumbnail_crop_h: number;
  url: string;
  thumb_url: string;
  is_default: boolean;
  can_edit_thumbnail: boolean;
};

export type SimpleApiUser = {
  /**
   * WCA User ID
   */
  id: number;
  name: string;
  /**
   * User ID
   */
  wca_id: string;
  gender: string;
  country_iso2: string;
  country: CountryMetadata;
};

export type CountryMetadata = {
  id: string;
  name: string;
  continentId: string;
  iso2: string;
};
