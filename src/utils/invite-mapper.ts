import type { SchoolInvite } from "../types/school-invite";
import {
  getSchoolInitials,
  getSchoolAvatarColor,
  getSchoolBannerColors,
} from "./school-ui";

export type RawSchoolInviteResponse = {
  id: string;
  status: string;
  createdAt: string | null;
  school: {
    id: string;
    name: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    slug?: string;
  };
  owner: {
    firstName: string | null;
    lastName: string | null;
  };
  location: {
    addressLine1: string | null;
    suburb: string | null;
  } | null;
};

export function mapRawInviteToUI(
  rawData: RawSchoolInviteResponse,
): SchoolInvite {
  const school = rawData.school || {};
  const schoolName = school.name || "Unknown School";
  const hashId = school.id || rawData.id;
  const ownerName =
    [rawData.owner?.firstName, rawData.owner?.lastName]
      .filter(Boolean)
      .join(" ") || "School Admin";

  const bannerColors = getSchoolBannerColors(hashId);

  return {
    id: rawData.id,
    schoolName: schoolName,
    schoolInitials: getSchoolInitials(schoolName),
    schoolAvatarColor: getSchoolAvatarColor(hashId),
    schoolLogoUrl: school.logoUrl || null,
    schoolCoverUrl: school.coverImageUrl || null,
    bannerColorStart: bannerColors.start,
    bannerColorEnd: bannerColors.end,
    schoolSuburb: rawData.location?.suburb || "City",
    schoolAddress: rawData.location?.addressLine1 || "Address not provided",
    invitedByName: ownerName,
    invitedByRole: "Owner",
    message: undefined,
    expiresAtLabel: "Expires in 7 days",
  };
}
