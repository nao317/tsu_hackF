export type UUID = string;

export type ApiErrorResponse = {
  error: string;
  code?: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type User = {
  id: UUID;
  email: string;
  display_name: string;
  created_at?: string;
  updated_at?: string;
};

export type SignupInput = {
  email: string;
  password: string;
  display_name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RefreshTokenInput = {
  refresh_token: string;
};

export type LogoutInput = {
  refresh_token: string;
};

export type LocationType = "shared" | "user";

export type Location = {
  id: UUID;
  name: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius_m?: number;
  is_default?: boolean;
  type?: LocationType;
  distance_m?: number;
  cards_count?: number;
};

export type NearbyLocationsParams = {
  lat: number;
  lng: number;
  radius_m?: number;
};

export type CreateUserLocationInput = {
  name: string;
  latitude: number;
  longitude: number;
  radius_m?: number;
};

export type UpdateUserLocationInput = Partial<CreateUserLocationInput>;

export type Card = {
  id: UUID;
  label: string;
  image_url?: string | null;
  emoji?: string | null;
  category?: string | null;
  is_daily?: boolean;
  created_by?: UUID | null;
  sort_order?: number;
};

export type AddCardToUserLocationInput = {
  card_id: UUID;
  sort_order?: number;
};

export type ReorderUserLocationCardsInput = {
  cards: Array<{
    card_id: UUID;
    sort_order: number;
  }>;
};

export type AiRecommendInput = {
  words: string[];
  location_name?: string;
};

export type AiRecommendResponse = {
  suggestions: string[];
  latency_ms: number;
};
