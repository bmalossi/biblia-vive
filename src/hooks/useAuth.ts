// ─────────────────────────────────────────────────────────────────────────────
// useAuth.ts — Bíblia Vive
// Thin consumer of the global AuthContext.
// All Supabase auth state is managed centrally in AuthProvider (AuthContext.tsx)
// so the whole app shares ONE listener instead of creating N independent ones.
// ─────────────────────────────────────────────────────────────────────────────

export { useAuthContext as useAuth } from '@/contexts/AuthContext';
