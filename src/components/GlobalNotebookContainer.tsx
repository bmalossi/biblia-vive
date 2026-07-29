import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { useReadingPreferences } from "@/hooks/useReadingPreferences";
import { useNotebookContext } from "@/contexts/NotebookContext";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import MemorialFAB from "@/components/MemorialFAB";
import MemorialEntryModal from "@/components/MemorialEntryModal";
import NotebookWorkspace from "@/components/NotebookWorkspace";
import NotebookSheet from "@/components/NotebookSheet";
import AuthModal from "@/components/AuthModal";
import { findBookGlobally } from "@/lib/books";
import { createNoteStore, type MemorialCategory, type MemorialEntry } from "@/lib/noteStore";

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

    // Estado do Modal de Registro do Memorial
    const [entryModalOpen, setEntryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<MemorialCategory>('reflection');

    // Ocultar em rotas específicas (como widgets ou exibição em igreja)
    const isWidget = location.pathname.startsWith("/widget");
    const isChurchDisplay = location.pathname.startsWith("/church-display");

    // O FAB deve ser exibido se tivermos um livro e capítulo ativos
    const showNotebook = !isWidget && !isChurchDisplay && bookId && chapter && version && bookName;

    if (!showNotebook) return null;

    const handleSelectCategory = (cat: MemorialCategory) => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        setSelectedCategory(cat);
        setEntryModalOpen(true);
    };

    const handleOpenMemorialList = () => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        setIsOpen(!isOpen);
    };

    const handleSaveMemorialEntry = async (entryData: Omit<MemorialEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
        const store = createNoteStore(user?.id || null);
        await store.save(entryData);
        // Atualizar lista se workspace estiver aberto
        await saveNotebook(entryData.content);
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
            {/* FAB expansível do Meu Memorial */}
            <MemorialFAB
                entriesCount={notebooks.length}
                onSelectCategory={handleSelectCategory}
                onOpenMemorialList={handleOpenMemorialList}
                isFocusMode={preferences.focusMode}
            />

            {/* Modal de Registro por Categoria */}
            <MemorialEntryModal
                isOpen={entryModalOpen}
                onClose={() => setEntryModalOpen(false)}
                category={selectedCategory}
                bookId={bookId}
                bookName={bookName}
                chapter={chapter}
                version={version}
                onSave={handleSaveMemorialEntry}
            />

            {/* Modal de Autenticação */}
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                hint="Entre para salvar e preservar os registros da sua caminhada no Meu Memorial."
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
