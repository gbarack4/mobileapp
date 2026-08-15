export type SchoolInvite = {
  id: string;
  schoolName: string;
  schoolInitials: string;
  schoolAvatarColor: string;
  schoolLogoUrl?: string | null;
  schoolCoverUrl?: string | null;
  bannerColorStart?: string;
  bannerColorEnd?: string;
  schoolSuburb: string;
  schoolAddress: string;
  invitedByName: string;
  invitedByRole: string;
  message?: string;
  expiresAtLabel?: string;
};
