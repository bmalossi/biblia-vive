import fs from "node:fs";
import path from "node:path";
import { biblicalPlaces } from "../data/biblicalPlaces";
import booksData from "../data/books.json" with { type: "json" };

const allBooks = [...booksData.old_testament, ...booksData.new_testament];
const booksSet = new Set(allBooks.map((b) => b.slug));

let hasErrors = false;
let errorCount = 0;
let warningCount = 0;

console.log("----------------------------------------");
console.log("Starting Biblical Places Data Validation");
console.log("----------------------------------------");

// 1. Validate ID Uniqueness and Field Presence
const seenIds = new Set<string>();
const seenCoords = new Map<string, string>();

biblicalPlaces.forEach((place, index) => {
  const label = place.id || `Index ${index}`;

  // Check unique IDs
  if (!place.id) {
    console.error(`[ERROR] Missing ID at index ${index}`);
    errorCount++;
    hasErrors = true;
  } else if (seenIds.has(place.id)) {
    console.error(`[ERROR] Duplicate ID found: "${place.id}"`);
    errorCount++;
    hasErrors = true;
  } else {
    seenIds.add(place.id);
  }

  // Check Name presence
  if (!place.name || !place.name.trim()) {
    console.error(`[ERROR] "${label}" is missing "name"`);
    errorCount++;
    hasErrors = true;
  }

  // Check English Name presence
  if (!place.nameEn || !place.nameEn.trim()) {
    console.error(`[ERROR] "${label}" is missing "nameEn"`);
    errorCount++;
    hasErrors = true;
  }

  // Check Lat/Lng validity
  if (typeof place.lat !== "number" || isNaN(place.lat)) {
    console.error(`[ERROR] "${label}" has an invalid latitude: ${place.lat}`);
    errorCount++;
    hasErrors = true;
  }
  if (typeof place.lng !== "number" || isNaN(place.lng)) {
    console.error(`[ERROR] "${label}" has an invalid longitude: ${place.lng}`);
    errorCount++;
    hasErrors = true;
  }

  // Check duplicate coordinates (Warning, not Error)
  const coordKey = `${place.lat.toFixed(5)},${place.lng.toFixed(5)}`;
  if (seenCoords.has(coordKey)) {
    const existingName = seenCoords.get(coordKey);
    console.log(`[WARNING] Duplicate coordinates (${coordKey}) for "${place.name}" ("${place.id}") and "${existingName}"`);
    warningCount++;
  } else {
    seenCoords.set(coordKey, place.name);
  }

  // Check Description
  if (!place.description || !place.description.trim()) {
    console.error(`[ERROR] "${label}" is missing "description"`);
    errorCount++;
    hasErrors = true;
  }

  // Check References
  if (!place.references || !Array.isArray(place.references) || place.references.length === 0) {
    console.error(`[ERROR] "${label}" must have at least 1 reference`);
    errorCount++;
    hasErrors = true;
  } else {
    const seenRefs = new Set<string>();
    place.references.forEach((ref) => {
      // Check format
      const parts = ref.split("/");
      if (parts.length !== 2) {
        console.error(`[ERROR] "${label}" has an invalid reference format: "${ref}"`);
        errorCount++;
        hasErrors = true;
        return;
      }

      const [slug, chapStr] = parts;

      // Check duplicate references
      if (seenRefs.has(ref)) {
        console.error(`[ERROR] "${label}" has a duplicate reference: "${ref}"`);
        errorCount++;
        hasErrors = true;
      } else {
        seenRefs.add(ref);
      }

      // Check official book slug
      if (!booksSet.has(slug)) {
        console.error(`[ERROR] "${label}" reference "${ref}" uses an unrecognized book slug: "${slug}"`);
        errorCount++;
        hasErrors = true;
      }

      // Check chapter validity
      const book = allBooks.find((b) => b.slug === slug);
      if (book) {
        const chap = parseInt(chapStr, 10);
        if (isNaN(chap) || chap < 1 || chap > book.chapters) {
          console.error(`[ERROR] "${label}" reference "${ref}" has an invalid chapter (Book "${book.name}" has ${book.chapters} chapters)`);
          errorCount++;
          hasErrors = true;
        }
      }
    });
  }
});

console.log("----------------------------------------");
console.log(`Validation Finished: ${errorCount} error(s), ${warningCount} warning(s).`);
console.log("----------------------------------------");

if (hasErrors) {
  process.exit(1);
} else {
  console.log("SUCCESS: Biblical places data is valid!");
  process.exit(0);
}
