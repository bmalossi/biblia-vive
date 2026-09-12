import { describe, it, expect } from "vitest";

export function computePublishedAt(
  editingArticle: { id: string; status: string; published_at: string | null } | null,
  publish: boolean,
  currentDateIso: string = new Date().toISOString()
): string | null {
  if (publish) {
    return editingArticle?.published_at || currentDateIso;
  }
  if (editingArticle) {
    return editingArticle.status === "publicado" ? null : (editingArticle.published_at || null);
  }
  return null;
}

describe("Article publishing schema & published_at preservation", () => {
  it("preserves original published_at when an already-published article is edited and saved", () => {
    const originalDate = "2026-07-19T02:49:07.527Z";
    const editingArticle = {
      id: "art-123",
      status: "publicado",
      published_at: originalDate,
    };

    const newDate = "2026-09-12T12:00:00.000Z";
    const result = computePublishedAt(editingArticle, true, newDate);

    expect(result).toBe(originalDate);
    expect(result).not.toBe(newDate);
  });

  it("sets new published_at timestamp when a draft is published for the first time", () => {
    const draftArticle = {
      id: "art-456",
      status: "rascunho",
      published_at: null,
    };

    const newDate = "2026-09-12T12:00:00.000Z";
    const result = computePublishedAt(draftArticle, true, newDate);

    expect(result).toBe(newDate);
  });

  it("sets published_at when creating a brand new article directly as publicado", () => {
    const newDate = "2026-09-12T12:00:00.000Z";
    const result = computePublishedAt(null, true, newDate);

    expect(result).toBe(newDate);
  });

  it("clears published_at to null when a published article is un-published to draft", () => {
    const publishedArticle = {
      id: "art-789",
      status: "publicado",
      published_at: "2026-07-19T02:49:07.527Z",
    };

    const result = computePublishedAt(publishedArticle, false);
    expect(result).toBeNull();
  });
});
