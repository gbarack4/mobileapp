export type SchoolReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
};

export type School = {
  id: string;
  locationId: string;
  name: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  about: string | null;
  address: string | null;
  suburb: string | null;
  postcode: string | null;
  longitude: number | null;
  latitude: number | null;
  distance: number | null;
  rating: number;
  reviewCount: number;
  joinStatus: "none" | "pending" | "accepted" | "rejected" | "blocked";
};

export type SchoolDetail = School & {
  phone: string | null;
  email: string | null;
  website: string | null;
  reviews: SchoolReview[];
};
