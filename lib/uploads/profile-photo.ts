export const PROFILE_PHOTO_MAX_SIZE = 2 * 1024 * 1024;
export const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isValidProfilePhoto(value: FormDataEntryValue | null): value is File {
  return value instanceof File
    && value.size > 0
    && value.size <= PROFILE_PHOTO_MAX_SIZE
    && PROFILE_PHOTO_TYPES.includes(value.type as (typeof PROFILE_PHOTO_TYPES)[number]);
}

export function profilePhotoPath(userId: string, file: File) {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  return `${userId}/perfil-${Date.now()}.${extension}`;
}
