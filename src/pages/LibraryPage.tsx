import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Book, BookStatus } from "../types/book";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";
import { Badge } from "../components/Badge";
import { Toast, ToastMessage } from "../components/Toast";

const STATUS_OPTIONS: BookStatus[] = [
  "Want to Read",
  "Reading",
  "Finished",
  "Abandoned",
];

const PAGE_SIZE = 25;

export const LibraryPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [noteFilter, setNoteFilter] = useState("");
  const [completedStart, setCompletedStart] = useState("");
  const [completedEnd, setCompletedEnd] = useState("");
  const [createdStart, setCreatedStart] = useState("");
  const [createdEnd, setCreatedEnd] = useState("");
  const [updatedStart, setUpdatedStart] = useState("");
  const [updatedEnd, setUpdatedEnd] = useState("");
  const [sortField, setSortField] = useState("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [editingNote, setEditingNote] = useState<Book | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("books").select("*");
    if (error) {
      setToast({ id: "load", title: error.message, variant: "error" });
    }
    setBooks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchBooks();
  }, []);

  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const authorValue = authorFilter.trim().toLowerCase();
    const noteValue = noteFilter.trim().toLowerCase();
    const inRange = (value: string | null, start: string, end: string) => {
      if (!start && !end) return true;
      if (!value) return false;
      const date = new Date(value);
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;
      if (startDate && date < startDate) return false;
      if (endDate && date > new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1)) {
        return false;
      }
      return true;
    };

    return books
      .filter((book) =>
        searchValue
          ? `${book.title} ${book.author} ${book.note ?? ""}`
              .toLowerCase()
              .includes(searchValue)
          : true
      )
      .filter((book) =>
        authorValue
          ? book.author.toLowerCase().includes(authorValue)
          : true
      )
      .filter((book) =>
        noteValue ? (book.note ?? "").toLowerCase().includes(noteValue) : true
      )
      .filter((book) =>
        statusFilter.length ? statusFilter.includes(book.status) : true
      )
      .filter((book) => {
        if (ratingFilter === "all") return true;
        if (ratingFilter === "rated") return book.rating != null;
        return book.rating?.toString() === ratingFilter;
      })
      .filter((book) =>
        genreFilter
          ? (book.genres ?? []).some((genre) =>
              genre.toLowerCase().includes(genreFilter.toLowerCase())
            )
          : true
      )
      .filter((book) =>
        inRange(book.completed_at, completedStart, completedEnd)
      )
      .filter((book) => inRange(book.created_at, createdStart, createdEnd))
      .filter((book) => inRange(book.updated_at, updatedStart, updatedEnd))
      .sort((a, b) => {
        const rawA = (a as any)[sortField];
        const rawB = (b as any)[sortField];
        const valueA = Array.isArray(rawA) ? rawA.join(", ") : rawA;
        const valueB = Array.isArray(rawB) ? rawB.join(", ") : rawB;
        if (valueA == null) return 1;
        if (valueB == null) return -1;
        if (typeof valueA === "string" && typeof valueB === "string") {
          return sortDir === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        return sortDir === "asc" ? valueA - valueB : valueB - valueA;
      });
  }, [
    books,
    search,
    authorFilter,
    noteFilter,
    statusFilter,
    ratingFilter,
    genreFilter,
    completedStart,
    completedEnd,
    createdStart,
    createdEnd,
    updatedStart,
    updatedEnd,
    sortField,
    sortDir,
  ]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const updateBook = async (id: string, updates: Partial<Book>) => {
    const { error } = await supabase.from("books").update(updates).eq("id", id);
    if (error) {
      setToast({ id: "update", title: error.message, variant: "error" });
      return;
    }
    setToast({ id: "update", title: "Book updated" });
    void fetchBooks();
  };

  const deleteBook = async (id: string) => {
    const confirmed = window.confirm("Delete this book?");
    if (!confirmed) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      setToast({ id: "delete", title: error.message, variant: "error" });
      return;
    }
    setToast({ id: "delete", title: "Book deleted" });
    void fetchBooks();
  };

  const handleStatusToggle = (status: BookStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter((item) => item !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
    setPage(1);
  };

  const openNoteEditor = (book: Book) => {
    setEditingNote(book);
    setNoteValue(book.note ?? "");
  };

  const saveNote = async () => {
    if (!editingNote) return;
    await updateBook(editingNote.id, { note: noteValue });
    setEditingNote(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Library</h2>
          <p className="text-sm text-text-muted">
            Search, filter, and update your entire collection.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/add">
            <Button>Add Book</Button>
          </Link>
          <Button variant="outline" onClick={() => void fetchBooks()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-surface-muted p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search title, author, note"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Input
            placeholder="Filter by genre"
            value={genreFilter}
            onChange={(event) => {
              setGenreFilter(event.target.value);
              setPage(1);
            }}
          />
          <Select
            value={ratingFilter}
            onChange={(event) => {
              setRatingFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All ratings</option>
            <option value="rated">Rated only</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating} stars
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Filter by author"
            value={authorFilter}
            onChange={(event) => {
              setAuthorFilter(event.target.value);
              setPage(1);
            }}
          />
          <Input
            placeholder="Filter by note text"
            value={noteFilter}
            onChange={(event) => {
              setNoteFilter(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <span className="text-xs uppercase text-text-muted">Completed date</span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={completedStart}
                onChange={(event) => {
                  setCompletedStart(event.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={completedEnd}
                onChange={(event) => {
                  setCompletedEnd(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <span className="text-xs uppercase text-text-muted">Created date</span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={createdStart}
                onChange={(event) => {
                  setCreatedStart(event.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={createdEnd}
                onChange={(event) => {
                  setCreatedEnd(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <span className="text-xs uppercase text-text-muted">Updated date</span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={updatedStart}
                onChange={(event) => {
                  setUpdatedStart(event.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={updatedEnd}
                onChange={(event) => {
                  setUpdatedEnd(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status}
            variant={statusFilter.includes(status) ? "primary" : "outline"}
            onClick={() => handleStatusToggle(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="table-scroll overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-surface-muted text-xs uppercase text-text-muted">
              <tr>
                {[
                  { key: "title", label: "Title" },
                  { key: "author", label: "Author" },
                  { key: "status", label: "Status" },
                  { key: "completed_at", label: "Completed" },
                  { key: "rating", label: "Rating" },
                  { key: "genres", label: "Genres" },
                  { key: "note", label: "Note" },
                  { key: "created_at", label: "Created" },
                  { key: "updated_at", label: "Updated" },
                  { key: "identifiers", label: "Identifiers" },
                  { key: "actions", label: "Actions" },
                ].map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-4 py-3"
                  >
                    <button
                      className="flex items-center gap-1"
                      onClick={() => {
                        if (column.key === "actions" || column.key === "identifiers") return;
                        setSortField(column.key);
                        setSortDir(
                          sortField === column.key && sortDir === "asc"
                            ? "desc"
                            : "asc"
                        );
                      }}
                    >
                      {column.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center">
                    Loading library...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-text-muted">
                    No results match these filters.
                  </td>
                </tr>
              ) : (
                paged.map((book) => (
                  <tr key={book.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{book.title}</td>
                    <td className="px-4 py-3 text-text-muted">{book.author}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={book.status}
                        onChange={(event) =>
                          void updateBook(book.id, {
                            status: event.target.value as BookStatus,
                          })
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {book.completed_at
                        ? new Date(book.completed_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={book.rating ?? ""}
                        onChange={(event) =>
                          void updateBook(book.id, {
                            rating: event.target.value
                              ? Number(event.target.value)
                              : null,
                          })
                        }
                      >
                        <option value="">-</option>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(book.genres ?? []).length === 0 ? (
                          <span className="text-xs text-text-muted">-</span>
                        ) : (
                          book.genres.map((genre) => (
                            <Badge key={`${book.id}-${genre}`} label={genre} />
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => openNoteEditor(book)}
                      >
                        {book.note ? "Edit note" : "Add note"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(book.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(book.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      <div className="space-y-1">
                        {book.google_volume_id ? (
                          <div>Google: {book.google_volume_id}</div>
                        ) : null}
                        {book.openlibrary_work_id ? (
                          <div>OL Work: {book.openlibrary_work_id}</div>
                        ) : null}
                        {book.openlibrary_edition_id ? (
                          <div>OL Ed: {book.openlibrary_edition_id}</div>
                        ) : null}
                        {!book.google_volume_id &&
                        !book.openlibrary_work_id &&
                        !book.openlibrary_edition_id
                          ? "-"
                          : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            void updateBook(book.id, { status: "Finished" })
                          }
                        >
                          Mark finished
                        </Button>
                        <Link to={`/edit/${book.id}`}>
                          <Button variant="outline">Edit</Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => void deleteBook(book.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <span className="text-text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {editingNote ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold">Edit note</h3>
            <p className="text-sm text-text-muted">
              {editingNote.title} · {editingNote.author}
            </p>
            <Textarea
              className="mt-4 min-h-[120px]"
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingNote(null)}>
                Cancel
              </Button>
              <Button onClick={() => void saveNote()}>Save note</Button>
            </div>
          </div>
        </div>
      ) : null}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};
