import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Flame,
  Sparkles,
  Lock,
  Unlock,
  Target,
  CheckCircle2,
  Save,
  ShieldAlert,
  ScrollText,
  Plus,
  Trash2,
  Edit2,
  Check,
  Info,
  Layers,
  Search,
  X,
  Compass,
} from "lucide-react";
import {
  getSermon,
  saveSermon,
  listPreachingLogs,
  type Sermon,
  type DesfechoTipo,
  type HomileticTopic,
  type HomileticTopicStep,
  type PreachingLog,
} from "@/lib/homileticClient";
import { fetchChapter, type Chapter } from "@/lib/bibleApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  auditSermonOrthodoxy,
  type HomileticAuditResult,
} from "@/lib/jevHomileticService";

const DESFECHO_CONFIG: Record<
  DesfechoTipo,
  { label: string; desc: string; icon: string; classes: string }
> = {
  consolacao: {
    label: "Consolação",
    desc: "Bálsamo, cura e paz pela certeza da Graça",
    icon: "🏺",
    classes: "border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/10",
  },
  confronto: {
    label: "Confronto",
    desc: "Arrependimento, renúncia e santidade de vida",
    icon: "⚡",
    classes: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  conversao: {
    label: "Conversão",
    desc: "Entrega total a Cristo e salvação",
    icon: "✝️",
    classes: "border-gold/40 text-gold bg-gold/10",
  },
  oracao: {
    label: "Oração",
    desc: "Clamor, consagração e busca da presença",
    icon: "🙏",
    classes: "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10",
  },
};

// Renderizador com realce de marcadores de dinâmica vocal e retórica
function renderWithDynamicMarkers(text: string | undefined): React.ReactNode {
  if (!text) return null;

  const parts = text.split(
    /(\[(?:Ilustração|Pausa Silenciosa|Pausa|Tom de Voz \/ Apelo|Tom\/Apelo)\])/gi
  );

  return parts.map((part, index) => {
    const lower = part.toLowerCase();
    if (lower === "[ilustração]") {
      return (
        <span
          key={index}
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/35 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
        >
          💡 Ilustração
        </span>
      );
    }
    if (lower === "[pausa silenciosa]" || lower === "[pausa]") {
      return (
        <span
          key={index}
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/35 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
        >
          🤫 Pausa
        </span>
      );
    }
    if (lower === "[tom de voz / apelo]" || lower === "[tom/apelo]") {
      return (
        <span
          key={index}
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/35 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
        >
          ⚡ Tom
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

// Barra de pílulas de inserção de Marcadores de Tom de Voz
function VoiceTonePills({ onInsert }: { onInsert: (marker: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 pt-1 text-[0.68rem] font-mono select-none">
      <span className="text-app-text-muted text-[0.68rem]">Tom de voz:</span>
      <button
        type="button"
        onClick={() => onInsert("[Ilustração]")}
        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/35 transition-colors cursor-pointer font-medium shadow-xs"
        title="Inserir marcador de Ilustração"
      >
        💡 Ilustração
      </button>
      <button
        type="button"
        onClick={() => onInsert("[Pausa]")}
        className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/35 transition-colors cursor-pointer font-medium shadow-xs"
        title="Inserir pausa silenciosa"
      >
        🤫 Pausa
      </button>
      <button
        type="button"
        onClick={() => onInsert("[Tom/Apelo]")}
        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/35 transition-colors cursor-pointer font-medium shadow-xs"
        title="Inserir inflexão de tom ou apelo"
      >
        ⚡ Tom
      </button>
    </div>
  );
}

function createDefaultTopic(index: number): HomileticTopic {
  return {
    id: `topic-${Date.now()}-${index}`,
    title: `Tópico ${index}`,
    steps: {
      stepA_fato: "",
      stepB_porque: "",
      stepC_contraste: "",
      stepD_tensao: "",
    },
  };
}

function getDefaultTopics(): HomileticTopic[] {
  return [
    createDefaultTopic(1),
    createDefaultTopic(2),
    createDefaultTopic(3),
  ];
}

export default function SermonStudioPage() {
  const { sermonId } = useParams<{ sermonId: string }>();
  const navigate = useNavigate();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  // Modo de Visualização do Estúdio (Construção vs Visão Consolidada)
  const [studioViewMode, setStudioViewMode] = useState<"construcao" | "consolidada">("construcao");

  // Título do Sermão no Cabeçalho
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // Passagem Bíblica Base no Cabeçalho
  const [isEditingPassage, setIsEditingPassage] = useState(false);
  const [passageBookInput, setPassageBookInput] = useState("");
  const [passageChapterInput, setPassageChapterInput] = useState<string>("");
  const [passageVerseInput, setPassageVerseInput] = useState<string>("");

  // Auto-save no Cabeçalho
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  // Estados do Método da Marcha-Ré (Desfecho)
  const [desfechoTipo, setDesfechoTipo] = useState<DesfechoTipo | null>(null);
  const [desfechoTexto, setDesfechoTexto] = useState("");
  const [isSavingDesfecho, setIsSavingDesfecho] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Estados dos blocos homiléticos
  const [bloco1Exegese, setBloco1Exegese] = useState("");
  const [bloco1IntencaoOriginal, setBloco1IntencaoOriginal] = useState("");
  const [isSavingBloco1, setIsSavingBloco1] = useState(false);

  // Bloco 2: Tópicos e Degraus
  const [topicos, setTopicos] = useState<HomileticTopic[]>(getDefaultTopics());
  const [isSavingTopicos, setIsSavingTopicos] = useState(false);
  // Abas Mobile para os 4 Degraus (por tópico)
  const [mobileStepByTopic, setMobileStepByTopic] = useState<Record<number, "A" | "B" | "C" | "D">>({});

  // Bloco 3 e Introdução
  const [bloco3Aplicacao, setBloco3Aplicacao] = useState("");
  const [isSavingBloco3, setIsSavingBloco3] = useState(false);
  const [introducao, setIntroducao] = useState("");
  const [isSavingIntroducao, setIsSavingIntroducao] = useState(false);

  // Histórico de Ministração (Prevenção de Repetição)
  const [preachingLogs, setPreachingLogs] = useState<PreachingLog[]>([]);

  // Guardião do Evangelho / Gálatas 1:8
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<HomileticAuditResult | null>(null);

  // Card Flutuante de Texto Bíblico
  const [isScriptureOpen, setIsScriptureOpen] = useState(false);
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [loadingScripture, setLoadingScripture] = useState(false);

  const isBloco2Unlocked =
    isUnlocked &&
    Boolean(
      (sermon?.bloco1IntencaoOriginal || bloco1IntencaoOriginal) &&
        (sermon?.bloco1IntencaoOriginal || bloco1IntencaoOriginal).trim().length >= 5
    );

  const isBloco3Unlocked =
    isBloco2Unlocked &&
    Boolean(
      (sermon?.bloco2Topicos || topicos) &&
        (sermon?.bloco2Topicos || topicos).length >= 1
    );

  // Helpers para inserção de Marcadores de Tom de Voz
  const insertMarkerToState = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    marker: string
  ) => {
    setter((prev) => (prev ? `${prev.trim()} ${marker} ` : `${marker} `));
  };

  const insertTopicStepMarker = (
    topicIndex: number,
    stepKey: keyof HomileticTopicStep,
    marker: string
  ) => {
    setTopicos((prev) =>
      prev.map((t, idx) =>
        idx === topicIndex
          ? {
              ...t,
              steps: {
                ...t.steps,
                [stepKey]: t.steps[stepKey]
                  ? `${t.steps[stepKey].trim()} ${marker} `
                  : `${marker} `,
              },
            }
          : t
      )
    );
  };

  // Carregar texto bíblico canônico no drawer
  const handleOpenScripture = async () => {
    setIsScriptureOpen(true);
    if (chapterData || !sermon?.bookName || !sermon?.chapter) return;

    setLoadingScripture(true);
    try {
      const data = await fetchChapter(
        sermon.version || "acf",
        sermon.bookId || "rom",
        String(sermon.chapter)
      );
      setChapterData(data);
    } catch (err) {
      console.error("[Estudio] Erro ao buscar passagem bíblica:", err);
    } finally {
      setLoadingScripture(false);
    }
  };

  // 1. Carregar Sermão do D1
  useEffect(() => {
    if (!sermonId) return;

    let isMounted = true;
    setLoading(true);

    getSermon(sermonId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setSermon(data);
          setTitleInput(data.title || "");
          setPassageBookInput(data.bookName || "");
          setPassageChapterInput(data.chapter ? String(data.chapter) : "");
          setPassageVerseInput(data.verse ? String(data.verse) : "");

          if (data.desfechoTipo) setDesfechoTipo(data.desfechoTipo);
          if (data.desfechoTexto) setDesfechoTexto(data.desfechoTexto);
          if (data.desfechoTipo && data.desfechoTexto) setIsUnlocked(true);

          if (data.bloco1Exegese) setBloco1Exegese(data.bloco1Exegese);
          if (data.bloco1IntencaoOriginal) {
            setBloco1IntencaoOriginal(data.bloco1IntencaoOriginal);
          }

          if (data.bloco2Topicos && data.bloco2Topicos.length > 0) {
            setTopicos(data.bloco2Topicos);
          }

          if (data.bloco3Aplicacao) setBloco3Aplicacao(data.bloco3Aplicacao);
          if (data.introducao) setIntroducao(data.introducao);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar sermão:", err);
        if (isMounted) setLoading(false);
      });

    listPreachingLogs(sermonId)
      .then((logs) => {
        if (isMounted) setPreachingLogs(logs);
      })
      .catch((err) => {
        console.warn("[Estudio] Não foi possível verificar histórico de pregações:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [sermonId]);

  // 2. Auto-save automático com debounce de 1500ms
  useEffect(() => {
    if (isInitialLoadRef.current) {
      if (!loading && sermon) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    if (!sermon) return;

    setSaveStatus("saving");

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveSermon({
          id: sermon.id,
          title: titleInput.trim() || sermon.title,
          desfechoTipo: desfechoTipo || undefined,
          desfechoTexto: desfechoTexto.trim() || undefined,
          bloco1Exegese: bloco1Exegese.trim() || undefined,
          bloco1IntencaoOriginal: bloco1IntencaoOriginal.trim() || undefined,
          bloco2Topicos: topicos,
          bloco3Aplicacao: bloco3Aplicacao.trim() || undefined,
          introducao: introducao.trim() || undefined,
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("[AutoSave] Erro ao sincronizar sermão:", err);
        setSaveStatus("error");
      }
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    titleInput,
    desfechoTipo,
    desfechoTexto,
    bloco1Exegese,
    bloco1IntencaoOriginal,
    topicos,
    bloco3Aplicacao,
    introducao,
    loading,
  ]);

  const handleSaveTitle = async () => {
    if (!sermon || !titleInput.trim()) return;
    try {
      setSaveStatus("saving");
      const updated = await saveSermon({
        id: sermon.id,
        title: titleInput.trim(),
      });
      setSermon(updated);
      setIsEditingTitle(false);
      setSaveStatus("saved");
      toast.success("Título do sermão atualizado!");
    } catch {
      toast.error("Erro ao salvar título.");
    }
  };

  const handleSavePassage = async () => {
    if (!sermon) return;
    try {
      setSaveStatus("saving");
      const chap = passageChapterInput ? parseInt(passageChapterInput, 10) : undefined;
      const ver = passageVerseInput ? parseInt(passageVerseInput, 10) : undefined;

      const updated = await saveSermon({
        id: sermon.id,
        bookName: passageBookInput.trim() || sermon.bookName,
        chapter: Number.isNaN(chap) ? undefined : chap,
        verse: Number.isNaN(ver) ? undefined : ver,
      });
      setSermon(updated);
      setIsEditingPassage(false);
      setSaveStatus("saved");
      toast.success("Passagem bíblica base atualizada com sucesso!");
    } catch {
      toast.error("Erro ao salvar passagem bíblica.");
    }
  };

  const handleSaveDesfecho = async () => {
    if (!sermon || !desfechoTipo || !desfechoTexto.trim()) {
      toast.error("Selecione a categoria de desfecho e digite o ponto de chegada.");
      return;
    }

    setIsSavingDesfecho(true);
    try {
      const updated = await saveSermon({
        id: sermon.id,
        desfechoTipo,
        desfechoTexto: desfechoTexto.trim(),
      });
      setSermon(updated);
      setIsUnlocked(true);
      setSaveStatus("saved");
      toast.success("Desfecho fixado com sucesso! Gabinete homilético desbloqueado.");
    } catch (err) {
      console.error("Erro ao salvar desfecho:", err);
      toast.error("Erro ao salvar desfecho.");
    } finally {
      setIsSavingDesfecho(false);
    }
  };

  const handleSaveBloco1 = async () => {
    if (!sermon) return;
    if (!bloco1IntencaoOriginal.trim() || bloco1IntencaoOriginal.trim().length < 5) {
      toast.error(
        "Por favor, responda à pergunta reflexiva obrigatória (mínimo de 1 frase) sobre a intenção do autor sagrado."
      );
      return;
    }

    setIsSavingBloco1(true);
    try {
      const updated = await saveSermon({
        id: sermon.id,
        bloco1Exegese: bloco1Exegese.trim(),
        bloco1IntencaoOriginal: bloco1IntencaoOriginal.trim(),
      });
      setSermon(updated);
      setSaveStatus("saved");
      toast.success("Ancoradouro Histórico fixado com sucesso! Bloco 2 desbloqueado.");
    } catch (err) {
      console.error("Erro ao salvar Bloco 1:", err);
      toast.error("Erro ao salvar Bloco 1.");
    } finally {
      setIsSavingBloco1(false);
    }
  };

  const handleAddTopic = () => {
    if (topicos.length >= 4) {
      toast.error("O limite máximo inegociável é de 4 tópicos para evitar dispersão.");
      return;
    }
    const nextIndex = topicos.length + 1;
    setTopicos((prev) => [...prev, createDefaultTopic(nextIndex)]);
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    if (topicos.length <= 1) {
      toast.error("O sermão deve possuir no mínimo 1 tópico ativo.");
      return;
    }
    setTopicos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateTopicTitle = (index: number, newTitle: string) => {
    setTopicos((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, title: newTitle } : t))
    );
  };

  const handleUpdateStep = (
    topicIndex: number,
    stepKey: keyof HomileticTopicStep,
    value: string
  ) => {
    setTopicos((prev) =>
      prev.map((t, idx) =>
        idx === topicIndex
          ? { ...t, steps: { ...t.steps, [stepKey]: value } }
          : t
      )
    );
  };

  const handleSaveTopicos = async () => {
    if (!sermon) return;
    if (topicos.length === 0) {
      toast.error("Adicione pelo menos 1 tópico ao sermão.");
      return;
    }

    setIsSavingTopicos(true);
    try {
      const updated = await saveSermon({
        id: sermon.id,
        bloco2Topicos: topicos,
      });
      setSermon(updated);
      setSaveStatus("saved");
      toast.success("Tópicos e Degraus salvos com sucesso! Bloco 3 e Introdução liberados.");
    } catch (err) {
      console.error("Erro ao salvar tópicos:", err);
      toast.error("Erro ao salvar tópicos.");
    } finally {
      setIsSavingTopicos(false);
    }
  };

  const handleSaveBloco3 = async () => {
    if (!sermon) return;
    setIsSavingBloco3(true);
    try {
      const updated = await saveSermon({
        id: sermon.id,
        bloco3Aplicacao: bloco3Aplicacao.trim(),
      });
      setSermon(updated);
      setSaveStatus("saved");
      toast.success("Aplicação Prática salva com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar Bloco 3:", err);
      toast.error("Erro ao salvar Aplicação.");
    } finally {
      setIsSavingBloco3(false);
    }
  };

  const handleSaveIntroducao = async () => {
    if (!sermon) return;
    setIsSavingIntroducao(true);
    try {
      const updated = await saveSermon({
        id: sermon.id,
        introducao: introducao.trim(),
      });
      setSermon(updated);
      setSaveStatus("saved");
      toast.success("Introdução da Marcha-Ré salva com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar Introdução:", err);
      toast.error("Erro ao salvar Introdução.");
    } finally {
      setIsSavingIntroducao(false);
    }
  };

  const handleTestOrthodoxy = async () => {
    if (!sermon) return;
    setIsAuditing(true);
    try {
      const result = await auditSermonOrthodoxy({
        ...sermon,
        desfechoTipo: desfechoTipo || sermon.desfechoTipo,
        desfechoTexto: desfechoTexto || sermon.desfechoTexto,
        bloco1Exegese: bloco1Exegese || sermon.bloco1Exegese,
        bloco1IntencaoOriginal: bloco1IntencaoOriginal || sermon.bloco1IntencaoOriginal,
        bloco2Topicos: topicos,
        bloco3Aplicacao: bloco3Aplicacao || sermon.bloco3Aplicacao,
        introducao: introducao || sermon.introducao,
      });
      setAuditResult(result);
      if (result.theological_deviation === "Fiel_Ao_Texto") {
        toast.success("Auditoria JEV: Mensagem fiel e centrada na Graça!");
      } else {
        toast.warning(
          `Alerta Doutrinário: Possível desvio detectado (${result.theological_deviation.replace(/_/g, " ")})`
        );
      }
    } catch (err) {
      console.error("Erro ao auditar ortodoxia:", err);
      toast.error("Não foi possível concluir o teste de ortodoxia com o JEV.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handlePreachNow = async () => {
    if (!sermon) return;

    if (!isUnlocked) {
      toast.error("Defina e salve o Desfecho da mensagem antes de pregar.");
      return;
    }

    if (
      auditResult &&
      auditResult.theological_deviation !== "Fiel_Ao_Texto" &&
      auditResult.confidence >= 0.85
    ) {
      toast.warning("Considere o Alerta de Gálatas 1:8 antes de subir ao altar.");
      return;
    }

    if (!auditResult) {
      setIsAuditing(true);
      try {
        const result = await auditSermonOrthodoxy({
          ...sermon,
          desfechoTipo: desfechoTipo || sermon.desfechoTipo,
          desfechoTexto: desfechoTexto || sermon.desfechoTexto,
          bloco1Exegese: bloco1Exegese || sermon.bloco1Exegese,
          bloco1IntencaoOriginal: bloco1IntencaoOriginal || sermon.bloco1IntencaoOriginal,
          bloco2Topicos: topicos,
          bloco3Aplicacao: bloco3Aplicacao || sermon.bloco3Aplicacao,
          introducao: introducao || sermon.introducao,
        });
        setAuditResult(result);
        if (
          result.theological_deviation !== "Fiel_Ao_Texto" &&
          result.confidence >= 0.85
        ) {
          toast.warning("Alerta de Fidelidade Doutrinária (Gálatas 1:8) detectado.");
          return;
        }
      } catch (err) {
        console.warn("[Estudio] Checagem automática ignorada:", err);
      } finally {
        setIsAuditing(false);
      }
    }

    navigate(`/pulpito/${sermon.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Flame className="w-8 h-8 text-gold animate-pulse" />
          <p className="text-sm font-sans text-app-text-muted">
            Abrindo gabinete de estudos...
          </p>
        </div>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-app-surface p-6 rounded-2xl border border-border">
          <h2 className="text-lg font-serif font-semibold text-app-text">
            Sermão não encontrado
          </h2>
          <p className="text-xs text-app-text-muted">
            O esboço solicitado não existe ou você não possui permissão para acessá-lo.
          </p>
          <Button onClick={() => navigate("/estudio")} variant="outline" className="w-full">
            Voltar ao Estúdio
          </Button>
        </div>
      </div>
    );
  }

  const currentPassageDisplay =
    (sermon.bookName || passageBookInput)
      ? `${sermon.bookName || passageBookInput} ${sermon.chapter || passageChapterInput || 1}${
          (sermon.verse || passageVerseInput) ? `:${sermon.verse || passageVerseInput}` : ""
        }`
      : "Definir Passagem Base";

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col relative pb-28 selection:bg-gold/30 selection:text-gold antialiased">
      {/* Luz ambiente sagrada e suave ao fundo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
        <div className="absolute -top-32 -right-32 w-[620px] h-[620px] bg-[radial-gradient(circle,rgba(229,184,105,0.06)_0%,transparent_70%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(229,184,105,0.03)_0%,transparent_70%)] blur-3xl pointer-events-none" />
      </div>

      {/* ── TOP NAVBAR ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-app-surface/90 dark:bg-[#14110c]/90 backdrop-blur-md border-b border-border/80 dark:border-amber-900/30 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          {/* Lado Esquerdo: Voltar, Título & Passagem Bíblica Base */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/estudio"
              className="p-2 rounded-xl bg-app-raised/50 hover:bg-app-raised border border-border/60 hover:border-gold/40 text-app-text-muted hover:text-gold transition-all shrink-0 cursor-pointer"
              title="Voltar ao Estúdio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Estúdio Homilético 3x4
                </span>

                {/* Indicador de Auto-save no Cabeçalho */}
                <div
                  data-testid="autosave-indicator"
                  className="inline-flex items-center gap-1.5 text-[0.68rem] font-mono text-app-text-muted px-2.5 py-0.5 rounded-full bg-app-raised border border-border select-none"
                >
                  {saveStatus === "saving" ? (
                    <span className="flex items-center gap-1 text-amber-500 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Salvando...
                    </span>
                  ) : saveStatus === "error" ? (
                    <span className="flex items-center gap-1 text-red-500">
                      <ShieldAlert className="w-3 h-3 text-red-500" />
                      Erro ao salvar
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gold font-medium">
                      <CheckCircle2 className="w-3 h-3 text-gold" />
                      Salvo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 📝 Título Editável do Sermão */}
                <div data-testid="sermon-title-editor" className="flex items-center gap-1.5">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-1">
                      <input
                        data-testid="sermon-title-input"
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") {
                            setTitleInput(sermon.title || "");
                            setIsEditingTitle(false);
                          }
                        }}
                        placeholder="Nome da pregação..."
                        autoFocus
                        className="bg-app-surface text-sm sm:text-base font-serif font-bold text-app-text px-2 py-0.5 rounded-lg border border-gold focus:outline-none focus:ring-1 focus:ring-gold min-w-[180px] sm:min-w-[280px]"
                      />
                      <button
                        type="button"
                        data-testid="save-title-btn"
                        onClick={handleSaveTitle}
                        className="p-1 rounded-md bg-gold text-primary-foreground hover:bg-gold/90 cursor-pointer"
                        title="Salvar Título"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="edit-title-btn"
                      onClick={() => {
                        setTitleInput(sermon.title || "");
                        setIsEditingTitle(true);
                      }}
                      className="group flex items-center gap-1.5 text-left cursor-pointer"
                      title="Clique para editar o título deste sermão"
                    >
                      <h1 className="text-sm sm:text-base font-serif font-bold text-app-text group-hover:text-gold transition-colors truncate max-w-xs sm:max-w-md">
                        {sermon.title || "Sem título (Clique para nomear)"}
                      </h1>
                      <Edit2 className="w-3 h-3 text-app-text-muted opacity-50 group-hover:opacity-100 group-hover:text-gold transition-all shrink-0" />
                    </button>
                  )}
                </div>

                {/* 📖 Campo Dedicado: Passagem Bíblica Base */}
                <div
                  data-testid="base-scripture-field"
                  className="inline-flex items-center gap-1.5 text-xs bg-app-raised border border-gold/30 hover:border-gold/60 px-3 py-1 rounded-full transition-colors shadow-xs"
                >
                  <BookOpen className="w-3 h-3 text-gold shrink-0" />
                  {isEditingPassage ? (
                    <div className="flex items-center gap-1">
                      <input
                        data-testid="passage-book-input"
                        type="text"
                        value={passageBookInput}
                        onChange={(e) => setPassageBookInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSavePassage();
                        }}
                        placeholder="Livro (ex: Lucas)"
                        className="w-24 bg-app-surface text-[0.72rem] text-app-text px-1.5 py-0.5 rounded border border-border focus:outline-none focus:border-gold"
                      />
                      <input
                        data-testid="passage-chapter-input"
                        type="number"
                        value={passageChapterInput}
                        onChange={(e) => setPassageChapterInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSavePassage();
                        }}
                        placeholder="Cap"
                        className="w-12 bg-app-surface text-[0.72rem] text-app-text px-1 py-0.5 rounded border border-border focus:outline-none focus:border-gold"
                      />
                      <span className="text-app-text-muted">:</span>
                      <input
                        data-testid="passage-verse-input"
                        type="number"
                        value={passageVerseInput}
                        onChange={(e) => setPassageVerseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSavePassage();
                        }}
                        placeholder="Ver"
                        className="w-12 bg-app-surface text-[0.72rem] text-app-text px-1 py-0.5 rounded border border-border focus:outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        data-testid="save-passage-btn"
                        onClick={handleSavePassage}
                        className="p-1 rounded bg-gold text-primary-foreground hover:bg-gold/90 cursor-pointer"
                        title="Salvar Passagem"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="edit-passage-btn"
                      onClick={() => setIsEditingPassage(true)}
                      className="font-mono text-[0.72rem] text-gold hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
                      title="Editar passagem bíblica base"
                    >
                      <span>{currentPassageDisplay}</span>
                      <Edit2 className="w-2.5 h-2.5 text-app-text-muted opacity-70 hover:opacity-100" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Badge JEV, Testar Ortodoxia & Pregar Agora */}
          <div className="flex items-center gap-2">
            {/* Badge de Status do JEV */}
            {isAuditing ? (
              <span
                data-testid="jev-status-badge"
                className="inline-flex items-center gap-1.5 text-[0.68rem] font-mono px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 animate-pulse select-none font-semibold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                JEV: Auditando...
              </span>
            ) : auditResult ? (
              auditResult.theological_deviation === "Fiel_Ao_Texto" ? (
                <span
                  data-testid="jev-status-badge"
                  className="inline-flex items-center gap-1.5 text-[0.68rem] font-mono px-2.5 py-1 rounded-lg border border-gold/40 bg-gold/10 text-gold font-semibold select-none shadow-xs"
                  title={auditResult.reasoning}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  JEV: Fiel ({Math.round(auditResult.confidence * 100)}%)
                </span>
              ) : (
                <span
                  data-testid="jev-status-badge"
                  className="inline-flex items-center gap-1.5 text-[0.68rem] font-mono px-2.5 py-1 rounded-lg border border-red-500/40 bg-red-500/10 text-red-500 font-semibold select-none shadow-xs"
                  title={auditResult.reasoning}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  JEV: Alerta ⚠️
                </span>
              )
            ) : (
              <span
                data-testid="jev-status-badge"
                className="hidden md:inline-flex items-center gap-1.5 text-[0.68rem] font-mono px-2.5 py-1 rounded-lg border border-border bg-app-raised text-app-text-muted select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-app-text-muted/60" />
                JEV: Pendente
              </span>
            )}

            <Button
              type="button"
              data-testid="test-orthodoxy-btn"
              onClick={handleTestOrthodoxy}
              disabled={isAuditing}
              variant="outline"
              className="border-border/80 dark:border-amber-900/40 bg-app-surface dark:bg-[#1a150e] hover:border-gold/40 text-gold hover:text-gold text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <span>🏛️</span>
              <span>{isAuditing ? "Avaliando..." : "Testar Ortodoxia"}</span>
            </Button>

            <Button
              onClick={handlePreachNow}
              className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pregar Agora</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN STUDIO BODY ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 space-y-6 sm:space-y-7 relative z-10 flex-1">
        {/* Confirmação de Ortodoxia Fiel */}
        {auditResult && auditResult.theological_deviation === "Fiel_Ao_Texto" && (
          <div
            data-testid="orthodoxy-faithful-badge"
            className="rounded-2xl border border-gold/40 bg-gold/5 p-4 flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wide text-gold font-semibold block">
                Fiel ao Texto & Centrado na Graça ({Math.round(auditResult.confidence * 100)}%)
              </span>
              <p className="text-xs text-app-text font-sans leading-relaxed">
                {auditResult.reasoning}
              </p>
              {auditResult.historical_alignment && (
                <p className="text-[0.72rem] text-app-text-muted font-mono italic">
                  🏛️ {auditResult.historical_alignment}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Card Solene de Alerta de Fidelidade Doutrinária (Gálatas 1:8) */}
        {auditResult &&
          auditResult.theological_deviation !== "Fiel_Ao_Texto" &&
          auditResult.confidence >= 0.85 && (
            <div
              data-testid="galatas-alert-card"
              className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-5 space-y-4 shadow-sm animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between gap-3 border-b border-red-500/20 pb-3">
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm font-serif">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  <span>Guardião do Evangelho — Gálatas 1:8</span>
                </div>
                <span className="text-[0.7rem] font-mono text-red-500 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full uppercase font-semibold">
                  Alerta Doutrinário Pastoral
                </span>
              </div>

              <blockquote className="border-l-2 border-red-500/50 pl-3 italic text-xs text-red-600 dark:text-red-300 font-serif">
                "Mas, ainda que nós mesmos ou um anjo do céu vos anuncie outro evangelho além do que já vos tenho anunciado, seja anátema."
                <span className="block not-italic font-mono text-[0.68rem] text-red-500 mt-1">— Gálatas 1:8</span>
              </blockquote>

              <div className="space-y-2 text-xs text-app-text font-sans">
                <div className="inline-flex items-center gap-2 font-mono font-semibold text-red-600 dark:text-red-300 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/30">
                  <span>Desvio Detectado:</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    {auditResult.theological_deviation === "Teologia_Prosperidade" && "Teologia da Prosperidade"}
                    {auditResult.theological_deviation === "Humanismo_SelfHelp" && "Humanismo / Autoajuda"}
                    {auditResult.theological_deviation === "Moralismo_Sem_Graca" && "Moralismo sem Graça"}
                  </span>
                  <span className="text-app-text-muted text-[0.7rem]">
                    (Confiança: {Math.round(auditResult.confidence * 100)}%)
                  </span>
                </div>

                <p className="leading-relaxed text-app-text">
                  {auditResult.reasoning}
                </p>

                {auditResult.historical_alignment && (
                  <p className="text-[0.72rem] text-app-text-muted font-mono italic">
                    🏛️ {auditResult.historical_alignment}
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-red-500/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditResult(null)}
                  className="text-xs border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/10"
                >
                  ✍️ Ajustar Mensagem no Gabinete
                </Button>
                <Button
                  type="button"
                  data-testid="proceed-to-pulpit-anyway"
                  onClick={() => navigate(`/pulpito/${sermon.id}`)}
                  className="bg-app-raised hover:bg-app-surface text-app-text text-xs font-semibold px-4 py-1.5 rounded-xl border border-border cursor-pointer shadow-xs"
                >
                  🕊️ Prosseguir Consciente ao Púlpito
                </Button>
              </div>
            </div>
          )}

        {/* ── CARD 0: ALERTA PREVENTIVO DE MINISTRAÇÃO ANTERIOR ─────────────────── */}
        {preachingLogs.length > 0 && (
          <div
            data-testid="preaching-repetition-alert"
            className="rounded-2xl border border-amber-500/35 dark:border-amber-700/40 bg-amber-500/5 dark:bg-[#19140d]/90 p-5 sm:p-6 space-y-3 shadow-sm transition-all animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-semibold text-xs font-mono uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>ATENÇÃO PASTORAL — MENSAGEM JÁ MINISTRADA NESTA COMUNIDADE</span>
            </div>
            <p className="text-xs text-app-text-muted leading-relaxed font-sans">
              Esta sermão já possui histórico de pregação registrado. Verifique as comunidades para prevenir repetição involuntária da mesma mensagem:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {preachingLogs.map((log) => (
                <div
                  key={log.id}
                  className="inline-flex items-center gap-2 text-xs bg-app-surface dark:bg-[#231b12] border border-amber-500/30 text-app-text px-3.5 py-1.5 rounded-full font-mono shadow-xs"
                >
                  <span className="text-amber-500 dark:text-amber-300 font-semibold">{log.churchName}</span>
                  <span className="text-app-text-muted">({log.city})</span>
                  <span className="text-app-text-muted/70 text-[0.7rem]">· {log.preachedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SELECTOR DE MODO DE VISUALIZAÇÃO (Construção vs Visão Consolidada) ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-2xl bg-black/25 dark:bg-[#120f0b] border border-border/80 dark:border-amber-900/40 shadow-xs">
            <button
              type="button"
              data-testid="view-mode-construcao"
              onClick={() => setStudioViewMode("construcao")}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                studioViewMode === "construcao"
                  ? "bg-gold/15 dark:bg-[#251e14] text-gold border border-gold/40 dark:border-amber-500/50 shadow-xs font-bold"
                  : "text-app-text-muted hover:text-app-text"
              )}
            >
              <span>🔆</span>
              <span>Construção (Marcha-Ré)</span>
            </button>
            <button
              type="button"
              data-testid="view-mode-consolidada"
              onClick={() => setStudioViewMode("consolidada")}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                studioViewMode === "consolidada"
                  ? "bg-gold/15 dark:bg-[#251e14] text-gold border border-gold/40 dark:border-amber-500/50 shadow-xs font-bold"
                  : "text-app-text-muted hover:text-app-text"
              )}
            >
              <span>📖</span>
              <span>Visão Consolidada (Pregação)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-sans text-app-text-muted">
            <span>Método pedagógico reverso para clareza expositiva</span>
            <Info className="w-3.5 h-3.5 text-gold/70" />
          </div>
        </div>

        {/* ── MODO VISÃO CONSOLIDADA (Introdução no Topo para Pregação) ─────────── */}
        {studioViewMode === "consolidada" && (
          <div
            data-testid="consolidated-sermon-view"
            className="space-y-6 bg-app-surface/95 dark:bg-[#16130e]/95 rounded-2xl border border-gold/25 dark:border-amber-900/40 p-6 sm:p-8 shadow-lg animate-in fade-in duration-200"
          >
            {/* 0. Passagem Bíblica & Chama Inicial */}
            <div className="border-l-2 border-gold pl-4 py-1 space-y-1.5">
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-semibold block">
                Passagem Bíblica & Chama Inicial
              </span>
              <h3 className="text-base font-serif font-bold text-app-text">
                {currentPassageDisplay}
              </h3>
              <p className="text-xs font-serif italic text-app-text-muted leading-relaxed">
                "{sermon.sparkText || "Inspiração espiritual capturada em oração."}"
              </p>
            </div>

            {/* 1. Introdução Reordenada para o Topo */}
            <div className="border-l-2 border-gold pl-4 py-2 space-y-2 bg-gold/5 dark:bg-[#1f1911] rounded-r-xl p-3 border-y border-r border-gold/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-gold font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 1. Introdução (Gancho de Entrada)
                </span>
                <span className="text-[0.68rem] font-mono text-app-text-muted">Início da Ministração</span>
              </div>
              <div className="text-xs sm:text-sm font-sans text-app-text leading-relaxed whitespace-pre-line">
                {introducao ? (
                  renderWithDynamicMarkers(introducao)
                ) : (
                  <span className="italic text-app-text-muted">
                    Nenhuma introdução escrita ainda. Complete os tópicos no Modo Construção para redigir o gancho de entrada.
                  </span>
                )}
              </div>
            </div>

            {/* 2. Bloco 1: Explicar o Texto */}
            <div className="border-l-2 border-border pl-4 py-1 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-app-text-muted font-bold block">
                2. Explicar o Texto (Exegese & Contexto)
              </span>

              {bloco1IntencaoOriginal && (
                <div className="bg-gold/5 dark:bg-[#1a150e] border border-gold/25 rounded-xl p-3 text-xs sm:text-sm text-app-text italic font-serif leading-relaxed">
                  <span className="font-mono text-[0.68rem] text-gold font-bold block mb-1 not-italic uppercase tracking-wide">
                    ⚓ Ancoradouro Histórico:
                  </span>
                  "{bloco1IntencaoOriginal}"
                </div>
              )}

              {bloco1Exegese ? (
                <div className="text-xs sm:text-sm font-sans text-app-text leading-relaxed whitespace-pre-line">
                  {renderWithDynamicMarkers(bloco1Exegese)}
                </div>
              ) : (
                <p className="text-xs italic text-app-text-muted">Nenhuma nota exegética registrada.</p>
              )}
            </div>

            {/* 3. Bloco 2: Tópicos e Degraus */}
            <div className="border-l-2 border-border pl-4 py-1 space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-app-text-muted font-bold block">
                3. Pregar a Inspiração (Tópicos da Mensagem)
              </span>

              {topicos.map((top, idx) => (
                <div key={top.id || idx} className="bg-app-raised/60 dark:bg-[#120f0c] p-4 sm:p-5 rounded-xl border border-border/80 dark:border-[#2a2217] space-y-3 shadow-xs">
                  <h4 className="font-serif font-bold text-sm text-gold flex items-center gap-2">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-gold/15 border border-gold/30">
                      Tópico {idx + 1}
                    </span>
                    <span className="text-app-text">{top.title}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-app-text">
                    {top.steps.stepA_fato && (
                      <div className="p-3 rounded-lg bg-app-surface dark:bg-[#18140f] border border-border/70 dark:border-[#2a2217]">
                        <strong className="text-gold font-mono block text-[0.7rem] mb-0.5">A. Fato:</strong>
                        <span>{renderWithDynamicMarkers(top.steps.stepA_fato)}</span>
                      </div>
                    )}
                    {top.steps.stepB_porque && (
                      <div className="p-3 rounded-lg bg-app-surface dark:bg-[#18140f] border border-border/70 dark:border-[#2a2217]">
                        <strong className="text-gold font-mono block text-[0.7rem] mb-0.5">B. Porquê:</strong>
                        <span>{renderWithDynamicMarkers(top.steps.stepB_porque)}</span>
                      </div>
                    )}
                    {top.steps.stepC_contraste && (
                      <div className="p-3 rounded-lg bg-app-surface dark:bg-[#18140f] border border-border/70 dark:border-[#2a2217]">
                        <strong className="text-gold font-mono block text-[0.7rem] mb-0.5">C. Contraste:</strong>
                        <span>{renderWithDynamicMarkers(top.steps.stepC_contraste)}</span>
                      </div>
                    )}
                    {top.steps.stepD_tensao && (
                      <div className="p-3 rounded-lg bg-app-surface dark:bg-[#18140f] border border-border/70 dark:border-[#2a2217]">
                        <strong className="text-gold font-mono block text-[0.7rem] mb-0.5">D. Tensão:</strong>
                        <span>{renderWithDynamicMarkers(top.steps.stepD_tensao)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Bloco 3: Aplicar à Vida Real */}
            <div className="border-l-2 border-border pl-4 py-1 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-app-text-muted font-bold block">
                4. Aplicar à Vida Real (Conexão Prática)
              </span>
              <div className="text-xs sm:text-sm font-sans text-app-text leading-relaxed whitespace-pre-line">
                {bloco3Aplicacao ? (
                  renderWithDynamicMarkers(bloco3Aplicacao)
                ) : (
                  <p className="italic text-app-text-muted">Nenhuma aplicação redigida ainda.</p>
                )}
              </div>
            </div>

            {/* 5. Desfecho Homilético */}
            <div className="border-l-2 border-gold pl-4 py-2 space-y-2 bg-gold/5 dark:bg-[#1f1911] rounded-r-xl p-3 border-y border-r border-gold/20">
              <span className="text-xs font-mono uppercase tracking-wider text-gold font-bold block">
                5. Desfecho Homilético ({desfechoTipo ? DESFECHO_CONFIG[desfechoTipo]?.label : "Ponto de Chegada"})
              </span>
              <p className="text-xs sm:text-sm font-sans text-app-text leading-relaxed font-medium whitespace-pre-line">
                {desfechoTexto ? (
                  renderWithDynamicMarkers(desfechoTexto)
                ) : (
                  <span className="italic text-app-text-muted">Desfecho ainda não fixado.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── MODO CONSTRUÇÃO EM MARCHA-RÉ (Editor Interativo) ─────────────────── */}
        <div className={cn("space-y-6 sm:space-y-7", studioViewMode === "consolidada" ? "hidden" : "block")}>
          {/* ── CARD 1: A CHAMA INICIAL ("EU E DEUS") ─────────────────────────── */}
          <section
            data-testid="eu-e-deus-section"
            className="rounded-2xl border border-gold/25 dark:border-amber-900/40 bg-app-surface/95 dark:bg-[#16130e]/95 p-6 sm:p-7 space-y-4 shadow-lg transition-all"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 text-gold font-sans font-bold text-xs sm:text-sm tracking-wider uppercase">
                <Flame className="w-4 h-4 fill-gold/20 text-gold" />
                <span>EU E DEUS — A CHAMA INICIAL</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPassage(true)}
                className="border border-gold/40 hover:border-gold text-gold hover:bg-gold/10 font-medium text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Definir passagem bíblica base"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{currentPassageDisplay}</span>
              </button>
            </div>

            <div className="bg-black/25 dark:bg-[#0c0a08]/85 border border-border/60 dark:border-[#2a2217] rounded-xl p-4 sm:p-5 shadow-inner">
              <p className="text-sm sm:text-base font-serif italic text-app-text leading-relaxed whitespace-pre-line">
                "{sermon.sparkText || "Inspiração capturada para ministração da Palavra."}"
              </p>
            </div>

            <p className="text-xs text-app-text-muted leading-relaxed">
              Esta mensagem nasceu da sua oração e comunhão com Deus. O Estúdio Homilético ajuda você a organizar esta inspiração sem perder o fogo que a gerou.
            </p>
          </section>

          {/* ── CARD 2: MÉTODO DA MARCHA-RÉ: PONTO DE CHEGADA ──────────────────── */}
          <section
            data-testid="desfecho-section"
            className={cn(
              "rounded-2xl border p-6 sm:p-7 space-y-5 transition-all shadow-lg relative",
              isUnlocked
                ? "border-gold/25 dark:border-amber-900/40 bg-app-surface/95 dark:bg-[#16130e]/95"
                : "border-gold/40 bg-gold/5 dark:bg-[#18130c]/90 ring-1 ring-gold/30"
            )}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-app-text flex items-center gap-2">
                    <span>Método da Marcha-Ré: Ponto de Chegada</span>
                    {isUnlocked && (
                      <span className="inline-flex items-center gap-1 text-[0.7rem] font-mono text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/30 font-semibold">
                        <Unlock className="w-3 h-3" /> Desbloqueado
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-app-text-muted mt-0.5">
                    Defina onde o sermão vai terminar antes de escrever os blocos.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveDesfecho}
                disabled={isSavingDesfecho || !desfechoTipo || !desfechoTexto.trim()}
                className="bg-gold text-primary-foreground hover:bg-gold/90 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDesfecho ? "Salvando..." : "Fixar Desfecho"}</span>
              </Button>
            </div>

            {/* Seletor de Categorias do Desfecho */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {(Object.keys(DESFECHO_CONFIG) as DesfechoTipo[]).map((cat) => {
                const conf = DESFECHO_CONFIG[cat];
                const isSelected = desfechoTipo === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDesfechoTipo(cat)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer group",
                      isSelected
                        ? "border-2 border-gold ring-1 ring-gold/40 bg-gold/15 dark:bg-[#251e14] shadow-md"
                        : "border-border/80 dark:border-[#2a2217] bg-app-surface dark:bg-[#110f0c] hover:border-gold/40 hover:bg-app-raised/40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{conf.icon}</span>
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-bold transition-colors",
                          isSelected
                            ? "text-gold font-bold"
                            : "text-app-text group-hover:text-gold"
                        )}
                      >
                        {conf.label}
                      </span>
                    </div>
                    <p className="text-[0.72rem] text-app-text-muted leading-snug">
                      {conf.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Texto do Desfecho com Marcadores */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-sans text-app-text-muted font-medium">
                  Texto da Conclusão e Apelo Intencional
                </label>
                <VoiceTonePills onInsert={(m) => insertMarkerToState(setDesfechoTexto, m)} />
              </div>
              <div className="relative">
                <textarea
                  value={desfechoTexto}
                  onChange={(e) => setDesfechoTexto(e.target.value)}
                  placeholder="Onde a mensagem vai terminar? Qual é o apelo e impacto espiritual pretendido?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border/80 dark:border-[#2a2217] bg-black/25 dark:bg-[#0c0a08]/85 px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                />
                <div className="flex justify-end pt-1">
                  <span className="text-[0.68rem] font-mono text-app-text-muted">
                    {desfechoTexto.length}/500
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── CARD 3: BLOCO 1: EXPLICAR O TEXTO (EXEGESE & ANCORADOURO) ───────── */}
          <section
            data-testid="bloco-1-container"
            data-locked={!isUnlocked ? "true" : "false"}
            className={cn(
              "rounded-2xl border p-6 sm:p-7 space-y-5 transition-all relative shadow-lg",
              !isUnlocked
                ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
                : "border-gold/25 dark:border-amber-900/40 bg-app-surface/95 dark:bg-[#16130e]/95"
            )}
          >
            {!isUnlocked && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <Lock className="w-7 h-7 text-gold mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Bloqueado pelo Método da Marcha-Ré
                </p>
                <p className="text-xs text-app-text-muted max-w-xs mt-1">
                  Defina e fixe o Desfecho da mensagem acima para liberar o Bloco 1 (Explicar o Texto).
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-border/80 dark:border-amber-900/30 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider block">
                    BLOCO 1
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-app-text">
                    Explicar o Texto (Exegese & Contexto)
                  </h3>
                </div>
              </div>

              <VoiceTonePills onInsert={(m) => insertMarkerToState(setBloco1Exegese, m)} />
            </div>

            {/* Notas Exegéticas */}
            <div className="space-y-2">
              <label className="text-xs font-sans text-app-text-muted font-medium block">
                Notas Exegéticas e Contexto Histórico
              </label>

              {/* Barra de passagem com atalhos de recurso e adicionar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-black/25 dark:bg-[#0c0a08]/85 border border-border/80 dark:border-[#2a2217]">
                <div className="flex items-center gap-2 text-xs text-app-text truncate flex-1 px-1">
                  <BookOpen className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="font-mono text-gold font-medium shrink-0">
                    {currentPassageDisplay}
                  </span>
                  <span className="text-app-text-muted truncate text-[0.78rem]">
                    — Então, iniciando por Moisés e discorrendo sobre todos os profetas...
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={handleOpenScripture}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-border/80 dark:border-amber-900/40 bg-app-surface dark:bg-[#1a150e] hover:border-gold/40 text-app-text flex items-center gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Search className="w-3 h-3 text-gold" />
                    <span>Recurso</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsEditingPassage(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-border/80 dark:border-amber-900/40 bg-app-surface dark:bg-[#1a150e] hover:border-gold/40 text-app-text flex items-center gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-gold" />
                    <span>Adicionar</span>
                  </Button>
                </div>
              </div>

              <textarea
                value={bloco1Exegese}
                onChange={(e) => setBloco1Exegese(e.target.value)}
                placeholder="Pano de fundo histórico, intenção do autor sagrado e significado das palavras no original..."
                rows={4}
                className="w-full resize-none rounded-xl border border-border/80 dark:border-[#2a2217] bg-black/25 dark:bg-[#0c0a08]/85 px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
              />
            </div>

            {/* Fecho Unificado do Bloco 1: Ancoradouro Histórico & Trava Anti-Esegese */}
            <div
              data-testid="ancoradouro-historico-box"
              className={cn(
                "rounded-xl border p-5 space-y-3.5 transition-all shadow-xs",
                isBloco2Unlocked
                  ? "bg-gold/5 dark:bg-[#15110c] border-gold/30"
                  : "bg-app-raised/60 dark:bg-[#110e0b] border-border/80 dark:border-[#2a2217]"
              )}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gold/15 text-gold shrink-0">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-app-text flex items-center gap-2">
                      <span>Ancoradouro Histórico (Trava Anti-Esegese)</span>
                      {isBloco2Unlocked && (
                        <span className="text-[0.68rem] font-mono text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/30 font-semibold">
                          ⚓ Ancorado · Bloco 2 Liberado
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-app-text-muted">
                      Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleSaveBloco1}
                  disabled={isSavingBloco1 || !bloco1IntencaoOriginal.trim()}
                  className="bg-gold text-primary-foreground hover:bg-gold/90 font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingBloco1 ? "Salvando..." : "Fixar Ancoradouro"}</span>
                </Button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.68rem] font-mono text-app-text-muted">
                    Obrigatório (mínimo 1 frase)
                  </span>
                  <VoiceTonePills onInsert={(m) => insertMarkerToState(setBloco1IntencaoOriginal, m)} />
                </div>
                <textarea
                  value={bloco1IntencaoOriginal}
                  onChange={(e) => setBloco1IntencaoOriginal(e.target.value)}
                  placeholder="O que o autor bíblico pretendia comunicar aos seus ouvintes originais? Qual era o problema pastoral ou teológico endereçado?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border/80 dark:border-[#2a2217] bg-black/25 dark:bg-[#0c0a08]/85 px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                />
              </div>

              {/* Header do Ancoradouro Histórico unificado */}
              {(sermon?.bloco1IntencaoOriginal || isBloco2Unlocked) && (
                <div
                  data-testid="ancoradouro-historico-header"
                  className="pt-2.5 border-t border-gold/20 flex items-start gap-2 text-xs font-serif italic text-gold"
                >
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>"{sermon?.bloco1IntencaoOriginal || bloco1IntencaoOriginal}"</span>
                </div>
              )}
            </div>
          </section>

          {/* ── CARD 4: BLOCO 2: PREGAR A INSPIRAÇÃO (EXPOSIÇÃO 3X4) ───────────── */}
          <section
            data-testid="bloco-2-container"
            data-locked={!isBloco2Unlocked ? "true" : "false"}
            className={cn(
              "rounded-2xl border p-6 sm:p-7 space-y-6 transition-all relative shadow-lg",
              !isBloco2Unlocked
                ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
                : "border-gold/25 dark:border-amber-900/40 bg-app-surface/95 dark:bg-[#16130e]/95"
            )}
          >
            {!isUnlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <Lock className="w-7 h-7 text-gold mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Bloqueado pelo Método da Marcha-Ré
                </p>
                <p className="text-xs text-app-text-muted max-w-xs mt-1">
                  Defina e fixe o Desfecho da mensagem acima para iniciar a preparação.
                </p>
              </div>
            ) : !isBloco2Unlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <ShieldAlert className="w-7 h-7 text-amber-500 mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Trava Anti-Esegese Ativa
                </p>
                <p className="text-xs text-app-text-muted max-w-xs mt-1">
                  Responda à pergunta reflexiva obrigatória no Bloco 1 ("Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?") para liberar o desenvolvimento dos tópicos no Bloco 2.
                </p>
              </div>
            ) : null}

            {/* Cabeçalho do Bloco 2 */}
            <div className="flex items-center justify-between border-b border-border/80 dark:border-amber-900/30 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider block">
                    BLOCO 2
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-app-text">
                    Pregar a Inspiração (Exposição 3x4)
                  </h3>
                  <p className="text-xs text-app-text-muted">
                    Desenvolva de 1 a 4 tópicos com os 4 Degraus (A, B, C, D) para avançar a mensagem sem divagar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[0.68rem] font-mono text-app-text-muted bg-black/25 dark:bg-[#120f0b] px-3 py-1.5 rounded-xl border border-border/80 dark:border-amber-900/30">
                  {topicos.length} de 4 Tópicos
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTopic}
                  disabled={topicos.length >= 4}
                  className="text-xs flex items-center gap-1.5 rounded-xl border-border/80 dark:border-amber-900/40 bg-app-surface dark:bg-[#1a150e] hover:border-gold/40 text-app-text cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  <span>+ Adicionar Tópico</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTopicos}
                  disabled={isSavingTopicos || topicos.length === 0}
                  className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingTopicos ? "Salvando..." : "Salvar Tópicos"}</span>
                </Button>
              </div>
            </div>

            {/* Lista de Tópicos Ativos */}
            <div className="space-y-6">
              {topicos.map((topic, index) => {
                const currentMobileTab = mobileStepByTopic[index] || "A";

                return (
                  <div
                    key={topic.id || `topic-${index}`}
                    data-testid={`topic-card-${index}`}
                    className="p-5 sm:p-6 rounded-2xl border border-border/80 dark:border-[#2a2217] bg-app-surface/90 dark:bg-[#120f0c] space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1">
                        <span className="text-xs font-mono font-bold text-gold px-2.5 py-1 rounded-lg bg-gold/15 border border-gold/30">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => handleUpdateTopicTitle(index, e.target.value)}
                          placeholder={`Título do Tópico ${index + 1}`}
                          className="w-full font-serif font-bold text-base bg-transparent border-b border-border/80 dark:border-[#2a2217] pb-1 text-app-text focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Remover Tópico"
                        disabled={topicos.length <= 1}
                        onClick={() => handleRemoveTopic(index)}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl p-2 h-auto flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title={topicos.length <= 1 ? "Mínimo de 1 tópico" : "Remover Tópico"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[0.68rem]">Remover Tópico</span>
                      </Button>
                    </div>

                    {/* Abas Mobile para os 4 Degraus (md:hidden) */}
                    <div className="md:hidden flex items-center gap-1.5 border-b border-border/80 dark:border-amber-900/30 pb-2.5 overflow-x-auto no-scrollbar">
                      {(["A", "B", "C", "D"] as const).map((stepLetter) => {
                        const active = currentMobileTab === stepLetter;
                        const labels = {
                          A: "A. Fato",
                          B: "B. Porquê",
                          C: "C. Contraste",
                          D: "D. Tensão",
                        };
                        return (
                          <button
                            key={stepLetter}
                            type="button"
                            onClick={() =>
                              setMobileStepByTopic((prev) => ({
                                ...prev,
                                [index]: stepLetter,
                              }))
                            }
                            className={cn(
                              "px-3 py-1.5 text-xs font-mono rounded-xl transition-all whitespace-nowrap cursor-pointer",
                              active
                                ? "bg-gold text-primary-foreground font-bold shadow-xs"
                                : "bg-black/25 dark:bg-[#15110c] text-app-text-muted hover:text-app-text"
                            )}
                          >
                            {labels[stepLetter]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Os 4 Degraus no Desktop (2x2) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {/* Degrau A: Fato */}
                      <div
                        className={cn(
                          "space-y-1.5 bg-black/25 dark:bg-[#0c0a08]/85 p-4 rounded-xl border border-border/80 dark:border-[#2a2217]",
                          currentMobileTab !== "A" ? "hidden md:block" : "block"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[0.72rem] font-semibold text-app-text flex items-center gap-1">
                            <span className="text-gold font-mono font-bold">A.</span> Degrau A: Fato (A Afirmação Central)
                          </label>
                          <VoiceTonePills
                            onInsert={(m) => insertTopicStepMarker(index, "stepA_fato", m)}
                          />
                        </div>
                        <textarea
                          value={topic.steps.stepA_fato}
                          onChange={(e) => handleUpdateStep(index, "stepA_fato", e.target.value)}
                          placeholder="O que o texto afirma expressamente..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-border/80 dark:border-[#2a2217] bg-app-surface dark:bg-[#14110c] px-3 py-2 text-xs text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                        />
                      </div>

                      {/* Degrau B: Porquê */}
                      <div
                        className={cn(
                          "space-y-1.5 bg-black/25 dark:bg-[#0c0a08]/85 p-4 rounded-xl border border-border/80 dark:border-[#2a2217]",
                          currentMobileTab !== "B" ? "hidden md:block" : "block"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[0.72rem] font-semibold text-app-text flex items-center gap-1">
                            <span className="text-gold font-mono font-bold">B.</span> Degrau B: Porquê (A Razão Teológica)
                          </label>
                          <VoiceTonePills
                            onInsert={(m) => insertTopicStepMarker(index, "stepB_porque", m)}
                          />
                        </div>
                        <textarea
                          value={topic.steps.stepB_porque}
                          onChange={(e) => handleUpdateStep(index, "stepB_porque", e.target.value)}
                          placeholder="A razão teológica ou a causa espiritual..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-border/80 dark:border-[#2a2217] bg-app-surface dark:bg-[#14110c] px-3 py-2 text-xs text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                        />
                      </div>

                      {/* Degrau C: Contraste */}
                      <div
                        className={cn(
                          "space-y-1.5 bg-black/25 dark:bg-[#0c0a08]/85 p-4 rounded-xl border border-border/80 dark:border-[#2a2217]",
                          currentMobileTab !== "C" ? "hidden md:block" : "block"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[0.72rem] font-semibold text-app-text flex items-center gap-1">
                            <span className="text-gold font-mono font-bold">C.</span> Degrau C: Contraste (O Erro ou Consequência)
                          </label>
                          <VoiceTonePills
                            onInsert={(m) => insertTopicStepMarker(index, "stepC_contraste", m)}
                          />
                        </div>
                        <textarea
                          value={topic.steps.stepC_contraste}
                          onChange={(e) => handleUpdateStep(index, "stepC_contraste", e.target.value)}
                          placeholder="O que acontece sem essa verdade? O engano humano ou o contraste..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-border/80 dark:border-[#2a2217] bg-app-surface dark:bg-[#14110c] px-3 py-2 text-xs text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                        />
                      </div>

                      {/* Degrau D: Tensão / Gancho */}
                      <div
                        className={cn(
                          "space-y-1.5 bg-black/25 dark:bg-[#0c0a08]/85 p-4 rounded-xl border border-border/80 dark:border-[#2a2217]",
                          currentMobileTab !== "D" ? "hidden md:block" : "block"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[0.72rem] font-semibold text-app-text flex items-center gap-1">
                            <span className="text-gold font-mono font-bold">D.</span> Degrau D: Tensão / Gancho (Pergunta Provocativa)
                          </label>
                          <VoiceTonePills
                            onInsert={(m) => insertTopicStepMarker(index, "stepD_tensao", m)}
                          />
                        </div>
                        <textarea
                          value={topic.steps.stepD_tensao}
                          onChange={(e) => handleUpdateStep(index, "stepD_tensao", e.target.value)}
                          placeholder="A pergunta provocativa ou gancho para a consciência dos ouvintes..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-border/80 dark:border-[#2a2217] bg-app-surface dark:bg-[#14110c] px-3 py-2 text-xs text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── CARD 5: BLOCO 3: APLICAR À VIDA REAL ───────────────────────────── */}
          <section
            data-testid="bloco-3-container"
            data-locked={!isBloco3Unlocked ? "true" : "false"}
            className={cn(
              "rounded-2xl border p-6 sm:p-7 space-y-5 transition-all relative shadow-lg",
              !isBloco3Unlocked
                ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
                : "border-gold/25 dark:border-amber-900/40 bg-app-surface/95 dark:bg-[#16130e]/95"
            )}
          >
            {!isUnlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <Lock className="w-7 h-7 text-gold mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Bloqueado pelo Método da Marcha-Ré
                </p>
              </div>
            ) : !isBloco2Unlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <ShieldAlert className="w-7 h-7 text-amber-500 mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Aguardando Conclusão do Bloco 1
                </p>
              </div>
            ) : !isBloco3Unlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <Lock className="w-7 h-7 text-gold mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Aguardando Conclusão do Bloco 2
                </p>
                <p className="text-xs text-app-text-muted max-w-xs mt-1">
                  Salve os tópicos e degraus no Bloco 2 acima para liberar a Aplicação Prática.
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-between border-b border-border/80 dark:border-amber-900/30 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider block">
                    BLOCO 3
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-app-text">
                    Aplicar à Vida Real (Conexão Prática)
                  </h3>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSaveBloco3}
                disabled={isSavingBloco3}
                className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingBloco3 ? "Salvando..." : "Salvar Aplicação"}</span>
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-end">
                <VoiceTonePills onInsert={(m) => insertMarkerToState(setBloco3Aplicacao, m)} />
              </div>
              <textarea
                value={bloco3Aplicacao}
                onChange={(e) => setBloco3Aplicacao(e.target.value)}
                placeholder="Transposição prática para os desafios da igreja na segunda-feira de manhã..."
                rows={3}
                className="w-full resize-none rounded-xl border border-border/80 dark:border-[#2a2217] bg-black/25 dark:bg-[#0c0a08]/85 px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
              />
            </div>
          </section>

          {/* ── CARD 6: INTRODUÇÃO: GANCHO DE ENTRADA (ÚLTIMO PASSO) ───────────── */}
          <section
            data-testid="introducao-container"
            data-locked={!isBloco3Unlocked ? "true" : "false"}
            className={cn(
              "rounded-2xl border p-6 sm:p-7 space-y-5 transition-all relative shadow-lg",
              !isBloco3Unlocked
                ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
                : "border-gold/25 dark:border-amber-900/40 bg-app-surface/95 dark:bg-[#16130e]/95"
            )}
          >
            {!isUnlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <Lock className="w-7 h-7 text-gold mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Bloqueado pelo Método da Marcha-Ré
                </p>
              </div>
            ) : !isBloco2Unlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <ShieldAlert className="w-7 h-7 text-amber-500 mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Aguardando Conclusão do Bloco 1
                </p>
              </div>
            ) : !isBloco3Unlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                <Lock className="w-7 h-7 text-gold mb-2" />
                <p className="text-sm font-semibold text-app-text">
                  Aguardando Conclusão do Bloco 2
                </p>
                <p className="text-xs text-app-text-muted max-w-xs mt-1">
                  A Introdução é o último passo da Marcha-Ré. Conclua os tópicos do Bloco 2 para destravá-la.
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-between border-b border-border/80 dark:border-amber-900/30 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider block">
                    Passo Final da Marcha-Ré
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-app-text">
                    Introdução (Gancho de Entrada)
                  </h3>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSaveIntroducao}
                disabled={isSavingIntroducao}
                className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingIntroducao ? "Salvando..." : "Salvar Introdução"}</span>
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-end">
                <VoiceTonePills onInsert={(m) => insertMarkerToState(setIntroducao, m)} />
              </div>
              <textarea
                value={introducao}
                onChange={(e) => setIntroducao(e.target.value)}
                placeholder="Gancho inicial para capturar a atenção da igreja sabendo exatamente onde você vai chegar..."
                rows={3}
                className="w-full resize-none rounded-xl border border-border/80 dark:border-[#2a2217] bg-black/25 dark:bg-[#0c0a08]/85 px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
              />
            </div>
          </section>
        </div>
      </main>

      {/* ── BOTÃO FLUTUANTE DE LEITURA BÍBLICA ─────────────────────────────────── */}
      <button
        type="button"
        onClick={handleOpenScripture}
        aria-label="Consultar Texto Bíblico no Estúdio"
        className="fixed bottom-6 right-6 z-30 flex items-center justify-center w-12 h-12 rounded-2xl bg-app-surface dark:bg-[#1a150e] border border-gold/40 text-gold hover:text-gold shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Consultar Texto Bíblico no Estúdio"
      >
        <BookOpen className="w-5 h-5" />
      </button>

      {/* ── DRAWER FLUTUANTE DE TEXTO BÍBLICO CANÔNICO ─────────────────────────── */}
      {isScriptureOpen && (
        <div
          data-testid="biblical-text-floating-card"
          className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-app-surface/95 dark:bg-[#16130e]/95 backdrop-blur-md border-l border-gold/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-center justify-between border-b border-border/80 dark:border-amber-900/30 p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              <h3 className="font-serif font-bold text-sm text-app-text">
                {currentPassageDisplay}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsScriptureOpen(false)}
              className="text-app-text-muted hover:text-app-text p-1 h-auto cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-serif text-sm leading-relaxed text-app-text">
            {loadingScripture ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-app-text-muted">
                <Flame className="w-6 h-6 text-gold animate-pulse" />
                <span className="text-xs">Buscando Escrituras no Cânon...</span>
              </div>
            ) : chapterData ? (
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-wider text-gold font-semibold pb-1 border-b border-border/50">
                  {chapterData.book.name} · Capítulo {chapterData.chapter.number} ({sermon.version?.toUpperCase() || "ACF"})
                </p>
                {chapterData.verses.map((v) => (
                  <p
                    key={v.number}
                    className={cn(
                      "transition-colors",
                      sermon.verse === v.number
                        ? "bg-gold/10 text-gold font-semibold p-2 rounded-lg border border-gold/30"
                        : "text-app-text"
                    )}
                  >
                    <sup className="text-[0.65rem] font-mono text-gold font-bold mr-1.5 select-none">
                      {v.number}
                    </sup>
                    {v.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-app-text-muted text-xs space-y-2">
                <p>Nenhuma passagem bíblica base carregada.</p>
                <Button
                  onClick={() => setIsEditingPassage(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs border-gold/40 text-gold"
                >
                  Definir Passagem Base
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
