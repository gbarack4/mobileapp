export type SchoolReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
};

export type School = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  bannerColorStart: string;
  bannerColorEnd: string;
  rating: number;
  reviewCount: number;
  serviceTypes: string;
  address: string;
  suburb: string;
  postcode: string;
  distanceMiles: number;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website: string;
  about: string;
  isOpen: boolean;
  verified: boolean;
  reviews: SchoolReview[];
};
