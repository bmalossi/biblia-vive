import type { Locale, TranslationDict } from "../index";

const es: TranslationDict = {
    // General
    "app.name": "Biblia Viva",
    "app.tagline": "Lee la Biblia en Línea",

    // Navigation
    "nav.home": "Inicio",
    "nav.search": "Buscar",
    "nav.settings": "Configuración",
    "nav.language": "Idioma",
    "nav.planos": "Jornadas de Lectura",

    // Home Page
    "home.title": "Biblia Viva — Lee la Biblia en Línea | Mejor Experiencia de Lectura",
    "home.description": "Lee la Biblia en línea con la mejor experiencia de lectura. Más de 8 versiones, búsqueda inteligente, modo enfocado, texto a voz y más. Gratis.",
    "home.oldTestament": "Antiguo Testamento",
    "home.newTestament": "Nuevo Testamento",
    "home.continueReading": "Continuar lectura",
    "home.continue": "Continuar →",
    "home.dismiss": "Ocultar",
    "home.chapter": "Capítulo",
    "home.verseOfDay": "VERSÍCULO DE HOY",
    "home.verseOfDayText": "“Ponlos en temor, oh Jehová; conozcan las naciones que no son sino hombres.”",
    "home.verseOfDayRef": "— Salmos 9:20",

    // Reading Page
    "reading.title": "Lectura",
    "reading.invalidReference": "Referencia inválida.",
    "reading.selectChapter": "Seleccionar capítulo",
    "reading.chooseChapterBook": "Elige un capítulo de {book}.",
    "reading.chooseChapter": "Elige un capítulo.",
    "reading.book": "Libro",
    "reading.compare": "Comparar",
    "reading.toggleFocusMode": "Alternar modo enfocado",
    "reading.exitFocus": "Salir del enfoque",
    "reading.openSettings": "Abrir configuración de lectura",
    "reading.preferencesRestored": "Preferencias restauradas",
    "reading.loadErrorTitle": "No se pudo cargar este capítulo.",
    "reading.loadErrorDesc": "Inténtalo de nuevo.",
    "reading.retry": "Intentar de nuevo",
    "reading.loadingChapter": "Cargando capítulo...",
    "reading.compareUnavailable": "Comparación no disponible",
    "reading.prevChapter": "← Capítulo Anterior",
    "reading.nextChapter": "Próximo Capítulo →",
    "reading.chaptersCount": "{count} capítulos",
    "reading.currentlyAt": "Estás en {book} {chapter}",
    "reading.verse": "Versículo",
    "reading.continueTo": "Continuar a {reference}",
    "reading.backTo": "Volver a {reference}",

    // Search Page
    "search.title": "Búsqueda Bíblica",
    "search.subtitle": "Encuentra términos, temas y referencias con rapidez.",
    "search.placeholder": "Ej: amor, fe, Juan 3:16",
    "search.inputPlaceholder": "Buscar versículo, tema o referencia...",
    "search.helpText": "Ingresa un versículo como Jn 3:16 o busca por palabras",
    "search.textTab": "Texto",
    "search.referenceTab": "Referencia",
    "search.goTo": "Ir a {reference}",
    "search.didYouMean": "¿Quisiste decir:",
    "search.instantSuggestions": "Sugerencias instantáneas",
    "search.viewChapters": "Ver capítulos",
    "search.chooseChapter": "Elige un capítulo para comenzar a leer.",
    "search.noResults": 'No se encontraron versículos para "{query}"',
    "search.noResultsHint": 'Prueba con palabras diferentes o busca una referencia como "Jn 3:16"',
    "search.errorTitle": "Error en la búsqueda",
    "search.errorDescription": "No fue posible realizar la búsqueda ahora. Verifique su conexión e intente nuevamente.",
    "search.resultCount": "1 resultado encontrado",
    "search.resultsCount": "{count} resultados encontrados",
    "search.verseNotFound": "Versículo {verse} no encontrado en {book} {chapter}. Ir a {chapterRef}",
    "search.popularToday": "Versículos más buscados hoy:",
    "search.selectedVersion": "Versión seleccionada",
    "search.searchDescription": "Busca versículos en toda la Biblia por palabras o referencias como Juan 3:16. Resultados instantáneos en más de 8 versiones.",
    "search.noRecentHistory": "Sin historial reciente.",
    "search.closeSearch": "Cerrar búsqueda",

    // Verse Actions
    "verse.copy": "Copiar",
    "verse.copied": "¡Copiado!",
    "verse.share": "Compartir",
    "verse.shared": "¡Compartido!",
    "verse.linkCopied": "¡Enlace copiado!",
    "verse.verseCopied": "✓ Versículo copiado",
    "verse.linkCopiedToast": "✓ Enlace copiado",

    // Settings
    "settings.title": "Preferencias de Lectura",
    "settings.description": "Ajuste la fuente, el enfoque y la lectura en voz alta.",
    "settings.font": "Fuente",
    "settings.fontLoraBadge": "Recomendado",
    "settings.fontLoraDesc": "Serifa · Ideal para lectura larga",
    "settings.fontDmSansDesc": "Moderna · Lectura más rápida",
    "settings.fontDyslexicBadge": "Accesibilidad",
    "settings.fontDyslexicDesc": "Facilita la leitura para la dislexia",
    "settings.fontPreview": "En el principio era el Verbo",
    "settings.fontSize": "Tamaño del Texto",
    "settings.fontSizeLabel": "Tamaño del texto: {size}px",
    "settings.fontSizePixels": "{size} píxeles",
    "settings.fontSizeNames": "Pequeña · Normal · Grande · Enorme",
    "settings.verseSpacing": "Espaciado entre Versículos",
    "settings.verseSpacingDesc": "Compacto ←→ Espaciado",
    "settings.columnWidth": "Ancho de Columna",
    "settings.columnNarrow": "Estrecha",
    "settings.columnNormal": "Normal",
    "settings.columnWide": "Ancha",
    "settings.theme": "Tema",
    "settings.tts": "Lectura en Voz Alta",
    "settings.ttsNoVoice": "Voz en español no encontrada en este dispositivo. Usando voz predeterminada.",
    "settings.focusMode": "Modo Enfocado",
    "settings.previewVerse": "Porque de tal manera amó Dios al mundo — Juan 3:16",
    "settings.reset": "Restablecer padrões",
    "settings.close": "Cerrar",
    "settings.panelAriaLabel": "Panel de preferencias de lectura",

    // TTS
    "tts.listen": "Escuchar capítulo",
    "tts.resume": "Reanudar",
    "tts.pause": "Pausar",
    "tts.stop": "Parar",
    "tts.resumeAria": "Reanudar narración",
    "tts.pauseAria": "Pausar narración",

    // Toolbar
    "toolbar.highlight": "Destacar",
    "toolbar.note": "Anotar",
    "toolbar.soon": "Próximamente — disponible después de crear su cuenta",
    "toolbar.ariaCopy": "Copiar versículo {ref}",
    "toolbar.ariaShare": "Compartir versículo {ref}",
    "toolbar.ariaHighlight": "Destacar versículo {ref}",
    "toolbar.ariaNote": "Anotar versículo {ref}",
    "toolbar.ariaToolbar": "Acciones para {ref}",

    // Install Prompt
    "install.title": "Instalar Biblia Viva",
    "install.description": "Agrega a la pantalla de inicio para acceso rápido y lectura sin conexión.",
    "install.button": "Instalar",
    "install.dismiss": "Ahora no",

    // Not Found
    "notFound.title": "Página no encontrada",
    "notFound.description": "La página que buscas no existe.",
    "notFound.goHome": "Volver al inicio",

    // Misc
    "misc.goToContent": "Ir al contenido",
    "misc.version": "Versión",

    // Study Panel (Sprint 6 & 18)
    "study.tabContext": "Contexto",
    "study.tabRefs": "Referencias",
    "study.tabLanguage": "Idioma",
    "study.tabCommentary": "Comentarios",
    "study.panelTitle": "Panel de Estudio",
    "study.panelLabel": "Panel de estudio bíblico",
    "study.closePanel": "Cerrar panel de estudio",
    "study.sectionTheme": "Tema Central",
    "study.sectionHistory": "Contexto Histórico",
    "study.author": "Autor",
    "study.period": "Período",
    "study.noContext": "Contexto histórico no disponible para este libro.",
    "study.refsIntro": "Versículos relacionados que profundizan este texto:",
    "study.noRefs": "No hay referencias cruzadas disponibles para este versículo.",
    "study.noRefsHint": "Selecciona versículos clave como Jn 3:16 o Ro 8:28 para ver referencias.",
    "study.languageIntro": "Palabras clave en el idioma original (hebreo/griego) con sus significados:",
    "study.noStrongs": "Análisis del idioma original no disponible para este versículo.",
    "study.noStrongsHint": "Selecciona versículos clave como Jn 3:16 para ver el análisis",
    "study.strongsSource": "Fuente: Strong's Expanded Lexicon",
    "study.getCommentary": "Buscar Comentarios",
    "study.commentarySource": "Fuente: Comentaristas Teólogos (Análisis Teológico)",
    "study.commentaryLoading": "Consultando comentaristas...",
    "study.commentaryIntro": "Análisis profundo de este versículo basado en contextos históricos y teológicos.",
    "toolbar.study": "Estudiar",
    "toolbar.ariaStudy": "Estudiar versículo {ref}",

    // Auth (Sprint 7)
    "auth.signIn": "Iniciar sesión",
    "auth.signOut": "Cerrar sesión",
    "auth.createAccount": "Crear cuenta",
    "auth.email": "Correo electrónico",
    "auth.password": "Contraseña",
    "auth.noAccount": "¿No tienes cuenta?",
    "auth.hasAccount": "¿Ya tienes cuenta?",
    "auth.checkEmail": "Revisa tu correo para confirmar tu cuenta.",
    "auth.genericError": "Ocurrió un error. Inténtalo de nuevo.",
    "auth.syncHint": "Inicia sesión para sincronizar tus notas en todos tus dispositivos.",

    // Notes & Highlights (Sprint 7)
    "notes.title": "Mis Notas",
    "notes.empty": "Aún no tienes notas.",
    "notes.filterByBook": "Filtrar por libro",
    "notes.sortByDate": "Ordenar por fecha",
    "notes.export": "Exportar",
    "notes.exportPDF": "Exportar PDF",
    "notes.exportTXT": "Exportar TXT",
    "notes.edit": "Editar",
    "notes.delete": "Eliminar",
    "notes.save": "Guardar",
    "notes.placeholder": "Escribe tu reflexión sobre este versículo...",
    "notes.myNotes": "Mis Notas",

    // Highlight colors
    "highlight.yellow": "Amarillo",
    "highlight.blue": "Azul",
    "highlight.green": "Verde",
    "highlight.pink": "Rosa",
    "highlight.purple": "Morado",
    "highlight.remove": "Eliminar resaltado",

    // Study meaning key (Sprint 6 bugfix)
    "study.meaning": "Significado",

    // Terms Page
    "terms.title": "Términos de Uso — Bíblia Vive",
    "terms.desc": "Términos de uso de Bíblia Vive — plataforma de estudio bíblico digital",

    // About Page
    "about.title": "Sobre Bíblia Vive — Misión y Propósito | Bíblia Vive",
    "about.desc": "Entenda a missão do Bíblia Vive: fornecer estudos e leituras bíblicas com as melhores traduções mantendo altíssima fidedignidade aos textos sagrados clássicos.",

    // My Study Panel (Sprint 14)
    "myStudy.title": "Mi Estudio",
    "myStudy.tabNotes": "Notas",
    "myStudy.tabHighlights": "Resaltados",
    "myStudy.tabNotebooks": "Cuadernos",
    "myStudy.emptyHighlights": "No hay resaltados todavía.",
    "myStudy.goToVerse": "Ir al versículo",
    "myStudy.removeHighlight": "Eliminar",

    // Notebook (Sprint 19)
    "notebook.title": "Cuaderno del Capítulo",
    "notebook.empty": "No hay cuadernos creados en este capítulo.",
    "notebook.placeholder": "Escribe tus reflexiones y estudios sobre este capítulo...",
};

export default es;
