import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Book, BookStatus, LookupResult } from "../types/book";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { lookupBooks } from "../lib/lookup";
import { Toast, ToastMessage } from "../components/Toast";

const STATUS_OPTIONS: BookStatus[] = [
  "Want to Read",
  "Reading",
  "Finished",
  "Abandoned",
];

const normalizeTag = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);

export const AddEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<LookupResult[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [form, setForm] = useState({
    title: "",
    author: "",
    status: "Want to Read" as BookStatus,
    rating: "",
    note: "",
    genres: "",
    google_volume_id: "",
    openlibrary_work_id: "",
    openlibrary_edition_id: "",
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        setToast({ id: "load", title: error.message, variant: "error" });
        setLoading(false);
        return;
      }
      setForm({
        title: data.title,
        author: data.author,
        status: data.status,
        rating: data.rating?.toString() ?? "",
        note: data.note ?? "",
        genres: (data.genres ?? []).join(", "),
        google_volume_id: data.google_volume_id ?? "",
        openlibrary_work_id: data.openlibrary_work_id ?? "",
        openlibrary_edition_id: data.openlibrary_edition_id ?? "",
      });
      setLoading(false);
    };
    void load();
  }, [id]);

  const handleLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    const results = await lookupBooks(lookupQuery.trim());
    setLookupResults(results);
    setLookupLoading(false);
  };

  const applyLookup = (result: LookupResult) => {
    setForm((prev) => ({
      ...prev,
      title: result.title,
      author: result.author,
      status: "Want to Read",
      google_volume_id: result.googleVolumeId ?? "",
      openlibrary_work_id: result.openLibraryWorkId ?? "",
      openlibrary_edition_id: result.openLibraryEditionId ?? "",
    }));
  };

  const dedupeCheck = async (payload: Partial<Book>) => {
    const baseQuery = supabase.from("books").select("id,title,author");
    if (payload.google_volume_id) {
      const { data } = await baseQuery.eq(
        "google_volume_id",
        payload.google_volume_id
      );
      return data?.[0];
    }
    if (payload.openlibrary_work_id) {
      const { data } = await baseQuery.eq(
        "openlibrary_work_id",
        payload.openlibrary_work_id
      );
      return data?.[0];
    }
    const { data } = await baseQuery
      .ilike("title", payload.title ?? "")
      .ilike("author", payload.author ?? "");
    return data?.[0];
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setToast({ id: "validation", title: "Title and author are required.", variant: "error" });
      return;
    }

    const genres = normalizeTag(form.genres);

    const payload: Partial<Book> = {
      title: form.title.trim(),
      author: form.author.trim(),
      status: form.status,
      rating: form.rating ? Number(form.rating) : null,
      note: form.note.trim() || null,
      genres,
      google_volume_id: form.google_volume_id || null,
      openlibrary_work_id: form.openlibrary_work_id || null,
      openlibrary_edition_id: form.openlibrary_edition_id || null,
    };

    if (!id) {
      const match = await dedupeCheck(payload);
      if (match) {
        navigate(`/edit/${match.id}`);
        return;
      }
    }

    setLoading(true);
    if (id) {
      const { error } = await supabase.from("books").update(payload).eq("id", id);
      if (error) {
        setToast({ id: "save", title: error.message, variant: "error" });
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate("/library");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setToast({ id: "auth", title: "Session expired.", variant: "error" });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("books")
      .insert({ ...payload, owner_id: userData.user.id });
    if (error) {
      setToast({ id: "save", title: error.message, variant: "error" });
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate("/library");
  };

  const pageTitle = useMemo(() => (id ? "Edit Book" : "Add Book"), [id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{pageTitle}</h2>
        <p className="text-sm text-text-muted">
          {id
            ? "Update the fields below. Completion date is managed automatically."
            : "Fill in the details or use lookup to autofill."}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface-muted p-6">
        <h3 className="text-lg font-semibold">Lookup</h3>
        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="Search Google Books or Open Library"
            value={lookupQuery}
            onChange={(event) => setLookupQuery(event.target.value)}
          />
          <Button onClick={() => void handleLookup()} disabled={lookupLoading}>
            {lookupLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {lookupResults.length === 0 ? (
            <p className="text-sm text-text-muted">No lookup results yet.</p>
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
                  onClick={() => applyLookup(result)}
                >
                  Use details
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
          <label className="space-y-2 text-sm text-text-muted">
            Title
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              required
            />
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            Author
            <Input
              value={form.author}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, author: event.target.value }))
              }
              required
            />
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            Status
            <Select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as BookStatus,
                }))
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            Rating
            <Select
              value={form.rating}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, rating: event.target.value }))
              }
            >
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm text-text-muted md:col-span-2">
            Genres (comma separated)
            <Input
              value={form.genres}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, genres: event.target.value }))
              }
            />
            <div className="flex flex-wrap gap-2">
              {normalizeTag(form.genres).map((genre) => (
                <Badge key={genre} label={genre} />
              ))}
            </div>
          </label>
          <label className="space-y-2 text-sm text-text-muted md:col-span-2">
            Note
            <Textarea
              value={form.note}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, note: event.target.value }))
              }
              placeholder="Single freeform note"
              className="min-h-[120px]"
            />
          </label>
        </section>

        <section className="grid gap-4 rounded-2xl border border-border bg-surface-muted p-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-text">Identifiers</h3>
            <p className="text-xs text-text-muted">
              Stored for de-duplication across providers.
            </p>
          </div>
          <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm text-text-muted">
              Google Volume ID
              <Input
                value={form.google_volume_id}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    google_volume_id: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted">
              Open Library Work ID
              <Input
                value={form.openlibrary_work_id}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    openlibrary_work_id: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted">
              Open Library Edition ID
              <Input
                value={form.openlibrary_edition_id}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    openlibrary_edition_id: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : id ? "Save changes" : "Add book"}
          </Button>
        </div>
      </form>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};
