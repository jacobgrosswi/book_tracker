import { LookupResult } from "../types/book";

const normalize = (value: string) => value.trim();

export const lookupBooks = async (query: string): Promise<LookupResult[]> => {
  const encoded = encodeURIComponent(query);
  const [google, openLibrary] = await Promise.all([
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${encoded}`)
      .then((res) => res.json())
      .then((data) =>
        (data.items ?? []).map((item: any) => ({
          source: "google" as const,
          title: normalize(item.volumeInfo?.title ?? ""),
          author: normalize((item.volumeInfo?.authors ?? []).join(", ")),
          publishedYear: item.volumeInfo?.publishedDate?.split("-")?.[0],
          googleVolumeId: item.id,
        }))
      )
      .catch(() => []),
    fetch(`https://openlibrary.org/search.json?q=${encoded}`)
      .then((res) => res.json())
      .then((data) =>
        (data.docs ?? []).slice(0, 10).map((doc: any) => ({
          source: "openlibrary" as const,
          title: normalize(doc.title ?? ""),
          author: normalize((doc.author_name ?? []).join(", ")),
          publishedYear: doc.first_publish_year?.toString(),
          openLibraryWorkId: doc.key?.replace("/works/", ""),
          openLibraryEditionId: doc.cover_edition_key,
        }))
      )
      .catch(() => []),
  ]);

  return [...google, ...openLibrary].filter(
    (result) => result.title && result.author
  );
};
