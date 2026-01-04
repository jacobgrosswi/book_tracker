import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Book, LookupResult } from "../types/book";
import { Button } from "../components/Button";
import { Link } from "react-router-dom";
import { Toast, ToastMessage } from "../components/Toast";
import { lookupBooks } from "../lib/lookup";
import { Input } from "../components/Input";

const formatDate = (value: Date) => value.toISOString().split("T")[0];

const getMonthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getYearStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), 0, 1);
};

export const DashboardPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<LookupResult[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

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

  const stats = useMemo(() => {
    const total = books.length;
    const byStatus = books.reduce(
      (acc, book) => ({
        ...acc,
        [book.status]: (acc[book.status] ?? 0) + 1,
      }),
      {} as Record<string, number>
    );
    const finished = books.filter((book) => book.status === "Finished");
    const finishedMonth = finished.filter((book) =>
      book.completed_at
        ? new Date(book.completed_at) >= getMonthStart()
        : false
    );
    const finishedYear = finished.filter((book) =>
      book.completed_at ? new Date(book.completed_at) >= getYearStart() : false
    );
    const ratings = books.filter((book) => book.rating);
    const avgRating = ratings.length
      ? ratings.reduce((sum, book) => sum + (book.rating ?? 0), 0) /
        ratings.length
      : 0;
    const genreCounts = books.flatMap((book) => book.genres ?? []).reduce(
      (acc, genre) => ({
        ...acc,
        [genre]: (acc[genre] ?? 0) + 1,
      }),
      {} as Record<string, number>
    );
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      byStatus,
      finishedMonth: finishedMonth.length,
      finishedYear: finishedYear.length,
      avgRating: avgRating ? avgRating.toFixed(1) : "-",
      topGenres,
    };
  }, [books]);

  const handleLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    const results = await lookupBooks(lookupQuery.trim());
    setLookupResults(results);
    setLookupLoading(false);
  };

  const handleQuickAdd = async (result: LookupResult) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setToast({ id: "auth", title: "Session expired.", variant: "error" });
      return;
    }
    const { data, error } = await supabase
      .from("books")
      .insert({
        owner_id: userData.user.id,
        title: result.title,
        author: result.author,
        status: "Want to Read",
        genres: [],
        google_volume_id: result.googleVolumeId ?? null,
        openlibrary_work_id: result.openLibraryWorkId ?? null,
        openlibrary_edition_id: result.openLibraryEditionId ?? null,
      })
      .select()
      .single();

    if (error) {
      setToast({ id: "add", title: error.message, variant: "error" });
      return;
    }

    setToast({ id: "add", title: `Added ${data.title}` });
    setLookupResults([]);
    setLookupQuery("");
    void fetchBooks();
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <p className="text-sm text-text-muted">
              Track what you are reading and stay on top of progress.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => void fetchBooks()}>
              Refresh
            </Button>
            <Link to="/add">
              <Button>Add a book</Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs uppercase text-text-muted">Total books</p>
            <p className="text-3xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs uppercase text-text-muted">Finished 30 days</p>
            <p className="text-3xl font-semibold">{stats.finishedMonth}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs uppercase text-text-muted">Finished YTD</p>
            <p className="text-3xl font-semibold">{stats.finishedYear}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs uppercase text-text-muted">Status counts</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {[
                "Want to Read",
                "Reading",
                "Finished",
                "Abandoned",
              ].map((status) => (
                <div key={status} className="flex items-center justify-between">
                  <span>{status}</span>
                  <span className="font-semibold">
                    {stats.byStatus[status] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs uppercase text-text-muted">Average rating</p>
            <p className="text-3xl font-semibold">{stats.avgRating}</p>
            <p className="mt-4 text-xs uppercase text-text-muted">Top genres</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stats.topGenres.length === 0 ? (
                <span className="text-sm text-text-muted">No genres yet.</span>
              ) : (
                stats.topGenres.map(([genre, count]) => (
                  <span
                    key={genre}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs"
                  >
                    {genre} · {count}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-muted p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Quick Add</h3>
            <p className="text-sm text-text-muted">
              Search Google Books or Open Library to create a record fast.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="Search by title or author"
            value={lookupQuery}
            onChange={(event) => setLookupQuery(event.target.value)}
          />
          <Button onClick={() => void handleLookup()} disabled={lookupLoading}>
            {lookupLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {lookupResults.length === 0 ? (
            <p className="text-sm text-text-muted">
              {lookupQuery ? "No results yet." : "Run a lookup to get started."}
            </p>
          ) : (
            lookupResults.map((result) => (
              <div
                key={`${result.source}-${result.title}-${result.author}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div>
                  <p className="text-sm font-medium">{result.title}</p>
                  <p className="text-xs text-text-muted">
                    {result.author} · {result.publishedYear ?? "Year unknown"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void handleQuickAdd(result)}
                >
                  Quick add
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-muted p-6">
        <h3 className="text-lg font-semibold">Recent activity</h3>
        {loading ? (
          <p className="mt-3 text-sm text-text-muted">Loading books...</p>
        ) : books.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">
            No books yet. Add your first book.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {books.slice(0, 5).map((book) => (
              <div
                key={book.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div>
                  <p className="text-sm font-medium">{book.title}</p>
                  <p className="text-xs text-text-muted">
                    {book.author} · {book.status}
                  </p>
                </div>
                <div className="text-xs text-text-muted">
                  Updated {formatDate(new Date(book.updated_at))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};
