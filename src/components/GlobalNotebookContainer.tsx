import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { useReadingPreferences } from "@/hooks/useReadingPreferences";
import { useNotebookContext } from "@/contexts/NotebookContext";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import NotebookFloatingButton from "@/components/NotebookFloatingButton";
import NotebookWorkspace from "@/components/NotebookWorkspace";
import NotebookSheet from "@/components/NotebookSheet";
import AuthModal from "@/components/AuthModal";
import { findBookGlobally } from "@/lib/books";

export default function GlobalNotebookContainer() {
    const {
        isOpen,
        setIsOpen,
        bookId,
        chapter,
        version,
        bookName,
        notebooks,
        allNotebooks,
        saveStatus,
        syncError,
        saveNotebook,
        deleteNotebook,
        getLocalDraft,
        getNewLocalDraft,
        activeNotebook,
        setActiveNotebook,
        isCreatingNew,
        setIsCreatingNew,
    } = useNotebookContext();

    const isMobile = useIsMobile();
    const location = useLocation();
    const navigate = useNavigate();
    const { preferences } = useReadingPreferences();
    const { user } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    // Ocultar em rotas específicas (como widgets ou exibição em igreja)
    const isWidget = location.pathname.startsWith("/widget");
    const isChurchDisplay = location.pathname.startsWith("/church-display");
    
    // O botão flutuante deve ser exibido se tivermos um livro e capítulo ativos e não estivermos em páginas especiais
    const showNotebook = !isWidget && !isChurchDisplay && bookId && chapter && version && bookName;

    if (!showNotebook) return null;

    const handleOpenNotebook = () => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        setIsOpen(!isOpen);
    };

    const handleNavigateToChapter = (bkId: string, ch: number, ver: string) => {
        const bk = findBookGlobally(bkId);
        if (bk) {
            navigate(`/${ver}/${bk.slug}/${ch}`);
        }
        setIsOpen(false);
    };

    return (
        <>
            {/* Botão flutuante */}
            <NotebookFloatingButton
                notebooksCount={notebooks.length}
                onClick={handleOpenNotebook}
                isOpen={isOpen}
                isFocusMode={preferences.focusMode}
            />

            {/* Modal de Autenticação */}
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                hint="Entre para acessar e salvar seus estudos no caderno."
            />

            {/* Painel lateral no Desktop */}
            {isOpen && !isMobile && (
                <NotebookWorkspace
                    notebooks={notebooks}
                    allNotebooks={allNotebooks}
                    bookId={bookId}
                    chapter={chapter}
                    version={version}
                    bookName={bookName}
                    saveStatus={saveStatus}
                    syncError={syncError}
                    onSave={saveNotebook}
                    onDelete={deleteNotebook}
                    onClose={() => setIsOpen(false)}
                    onNavigateToChapter={handleNavigateToChapter}
                    getLocalDraft={getLocalDraft}
                    getNewLocalDraft={getNewLocalDraft}
                    selectedNotebook={activeNotebook}
                    setSelectedNotebook={setActiveNotebook}
                    isCreatingNew={isCreatingNew}
                    setIsCreatingNew={setIsCreatingNew}
                />
            )}

            {/* Gaveta no Mobile */}
            {isMobile && (
                <NotebookSheet
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    notebooks={notebooks}
                    allNotebooks={allNotebooks}
                    bookId={bookId}
                    chapter={chapter}
                    version={version}
                    bookName={bookName}
                    saveStatus={saveStatus}
                    syncError={syncError}
                    onSave={saveNotebook}
                    onDelete={deleteNotebook}
                    onNavigateToChapter={handleNavigateToChapter}
                    getLocalDraft={getLocalDraft}
                    getNewLocalDraft={getNewLocalDraft}
                    selectedNotebook={activeNotebook}
                    setSelectedNotebook={setActiveNotebook}
                    isCreatingNew={isCreatingNew}
                    setIsCreatingNew={setIsCreatingNew}
                />
            )}
        </>
    );
}
