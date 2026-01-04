export type BookStatus = "Want to Read" | "Reading" | "Finished" | "Abandoned";

export interface Book {
  id: string;
  owner_id: string;
  title: string;
  author: string;
  status: BookStatus;
  completed_at: string | null;
  rating: number | null;
  note: string | null;
  genres: string[];
  google_volume_id: string | null;
  openlibrary_work_id: string | null;
  openlibrary_edition_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LookupResult {
  source: "google" | "openlibrary";
  title: string;
  author: string;
  publishedYear?: string;
  googleVolumeId?: string;
  openLibraryWorkId?: string;
  openLibraryEditionId?: string;
}
