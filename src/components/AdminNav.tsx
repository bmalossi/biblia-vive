// ─────────────────────────────────────────────────────────────────────────────
// AdminNav.tsx — Reusable Admin Navigation Bar
// ─────────────────────────────────────────────────────────────────────────────

import { NavLink } from "react-router-dom";
import { BarChart3, FileText, BookOpen, Users, User, Sparkles } from "lucide-react";

export default function AdminNav() {
    const linkCls = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isActive
                ? "bg-gold/10 text-gold"
                : "text-app-text-muted hover:bg-app-surface hover:text-app-text"
        }`;

    return (
        <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
            <NavLink to="/admin" end className={linkCls}>
                <BarChart3 className="h-4 w-4" />
                Métricas
            </NavLink>
            <NavLink to="/admin/capitulos" className={linkCls}>
                <Sparkles className="h-4 w-4" />
                Capítulo de Hoje
            </NavLink>
            <NavLink to="/admin/artigos" className={linkCls}>
                <FileText className="h-4 w-4" />
                Artigos
            </NavLink>
            <NavLink to="/admin/autores" className={linkCls}>
                <User className="h-4 w-4" />
                Autores
            </NavLink>
            <NavLink to="/admin/comentarios" className={linkCls}>
                <BookOpen className="h-4 w-4" />
                Comentários
            </NavLink>
            <NavLink to="/admin/usuarios" className={linkCls}>
                <Users className="h-4 w-4" />
                Usuários
            </NavLink>
        </nav>
    );
}
