import { useState } from "react";
import { Check, X, HelpCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeatureStatus {
  type: "check" | "cross" | "text";
  text: string;
}

interface FeatureItem {
  name: string;
  gratuito: FeatureStatus;
  pro: FeatureStatus;
  templo: FeatureStatus;
}

interface CategoryGroup {
  name: string;
  features: FeatureItem[];
}

export default function PricingComparison() {
  const [activeMobileTab, setActiveMobileTab] = useState<"gratuito" | "pro" | "templo">("pro");

  const categories: CategoryGroup[] = [
    {
      name: "Leitura Bíblica",
      features: [
        {
          name: "Acesso a todos os livros e versículos",
          gratuito: { type: "check", text: "Sim" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Múltiplas versões de tradução",
          gratuito: { type: "text", text: "8 Versões (ACF, NVI, etc.)" },
          pro: { type: "text", text: "Todas + Originais (He/Gr)" },
          templo: { type: "text", text: "Todas + Originais (He/Gr)" },
        },
        {
          name: "Busca por palavra e referência",
          gratuito: { type: "check", text: "Sim" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
      ],
    },
    {
      name: "Conta Necessária (Login)",
      features: [
        {
          name: "Salvar progresso de leitura",
          gratuito: { type: "text", text: "Requer conta grátis" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Caderno de estudo pessoal",
          gratuito: { type: "text", text: "Requer conta grátis" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Planos de leitura personalizados",
          gratuito: { type: "text", text: "Requer conta grátis" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Histórico de leitura",
          gratuito: { type: "text", text: "Requer conta grátis" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Sincronização multi-dispositivo",
          gratuito: { type: "text", text: "Requer conta grátis" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
      ],
    },
    {
      name: "Exclusivo PRO",
      features: [
        {
          name: "Anotações em versículos",
          gratuito: { type: "check", text: "Sim (Local ou Nuvem)" },
          pro: { type: "text", text: "Ilimitado (Salvas após cancelamento)" },
          templo: { type: "text", text: "Ilimitado (Salvas após cancelamento)" },
        },
        {
          name: "Destaques coloridos",
          gratuito: { type: "check", text: "Sim" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Exportação em PDF",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "text", text: "Ilimitada" },
          templo: { type: "text", text: "Ilimitada" },
        },
        {
          name: "Acervo Teológico / Comentários por versículo",
          gratuito: { type: "text", text: "1 comentário grátis" },
          pro: { type: "text", text: "Até 10 comentários por hora" },
          templo: { type: "text", text: "Até 10 comentários por hora" },
        },
        {
          name: "Comentários por capítulo completo",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "check", text: "Sim (Ilimitados)" },
          templo: { type: "check", text: "Sim (Ilimitados)" },
        },
        {
          name: "Narrações de áudio realista",
          gratuito: { type: "check", text: "Sim" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Selo de apoiador no perfil",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "text", text: "Selo PRO" },
          templo: { type: "text", text: "Selo Templo" },
        },
      ],
    },
    {
      name: "Exclusivo Templo",
      features: [
        {
          name: "Modo Igreja / Ferramentas de projeção",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "cross", text: "Não disponível" },
          templo: { type: "text", text: "Sim (Aba de projeção externa)" },
        },
        {
          name: "Visuais adaptados para alto contraste",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "cross", text: "Não disponível" },
          templo: { type: "check", text: "Sim" },
        },
      ],
    },
  ];

  const renderStatus = (status: FeatureStatus) => {
    if (status.type === "check") {
      return (
        <div className="flex items-center gap-1.5 justify-center md:justify-start">
          <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />
          <span className="text-xs text-app-text font-medium">{status.text}</span>
        </div>
      );
    }
    if (status.type === "cross") {
      return (
        <div className="flex items-center gap-1.5 justify-center md:justify-start opacity-40">
          <X className="h-4 w-4 text-app-text-muted" />
          <span className="text-xs text-app-text-muted">{status.text}</span>
        </div>
      );
    }
    return (
      <span className="text-xs font-medium text-app-text">{status.text}</span>
    );
  };

  return (
    <div className="w-full mt-8 mb-16">
      {/* Posicionamento e Headline */}
      <div className="bg-app-surface border border-border/80 rounded-3xl p-6 md:p-10 mb-12 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 w-48 h-48 bg-gold/5 rounded-full blur-[80px] pointer-events-none -mr-24 -mt-24" />
        
        <h2 className="text-xl md:text-2xl font-serif text-app-text mb-4 text-center md:text-left leading-relaxed">
          A leitura da Bíblia é sempre gratuita. O <span className="text-gold font-bold">PRO</span> apoia a missão e desbloqueia ferramentas avançadas de estudo pessoal.
        </h2>
        <p className="text-sm text-app-text-muted text-center md:text-left">
          Sem barreiras para ler a Palavra. Compare os planos abaixo para ver como as ferramentas avançadas auxiliam seu crescimento e apoiam a propagação do evangelho.
        </p>

        {/* Desktop View Table */}
        <div className="hidden md:block mt-8 overflow-hidden rounded-2xl border border-border/60 bg-app-bg/50">
          <Table>
            <TableHeader className="bg-app-raised/40">
              <TableRow className="border-b border-border/60">
                <TableHead className="w-[40%] text-app-text font-serif text-base py-4 pl-6">Recursos</TableHead>
                <TableHead className="w-[20%] text-center text-app-text font-serif text-base py-4">Gratuito</TableHead>
                <TableHead className="w-[20%] text-center text-gold font-serif text-base py-4 bg-gold/5 border-x border-border/40">PRO</TableHead>
                <TableHead className="w-[20%] text-center text-violet-600 dark:text-violet-400 font-serif text-base py-4">Templo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <optgroup key={cat.name} label={cat.name} className="contents">
                  <TableRow className="bg-app-raised/10 hover:bg-app-raised/10 border-b border-border/40">
                    <TableCell colSpan={4} className="font-sans font-bold text-xs uppercase tracking-wider text-gold/80 py-3 pl-6">
                      {cat.name}
                    </TableCell>
                  </TableRow>
                  {cat.features.map((feature) => (
                    <TableRow key={feature.name} className="hover:bg-app-raised/20 border-b border-border/40 transition-colors">
                      <TableCell className="font-medium text-app-text text-sm py-4 pl-8">{feature.name}</TableCell>
                      <TableCell className="text-center py-4">{renderStatus(feature.gratuito)}</TableCell>
                      <TableCell className="text-center py-4 bg-gold/5 border-x border-border/40">{renderStatus(feature.pro)}</TableCell>
                      <TableCell className="text-center py-4">{renderStatus(feature.templo)}</TableCell>
                    </TableRow>
                  ))}
                </optgroup>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View with Tabs */}
        <div className="md:hidden mt-6">
          <Tabs
            value={activeMobileTab}
            onValueChange={(val) => setActiveMobileTab(val as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-app-raised border border-border/60 rounded-xl p-1 mb-6">
              <TabsTrigger value="gratuito" className="rounded-lg text-xs py-2 data-[state=active]:bg-app-bg data-[state=active]:text-app-text data-[state=active]:shadow-sm">
                Gratuito
              </TabsTrigger>
              <TabsTrigger value="pro" className="rounded-lg text-xs py-2 data-[state=active]:bg-gold data-[state=active]:text-white data-[state=active]:shadow-sm font-semibold">
                PRO
              </TabsTrigger>
              <TabsTrigger value="templo" className="rounded-lg text-xs py-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-semibold">
                Templo
              </TabsTrigger>
            </TabsList>

            {/* Content per Tab */}
            {(["gratuito", "pro", "templo"] as const).map((plan) => (
              <TabsContent key={plan} value={plan} className="space-y-6 outline-none">
                <div className="border border-border/50 rounded-2xl bg-app-bg/40 p-4 space-y-6">
                  {categories.map((cat) => (
                    <div key={cat.name} className="space-y-3">
                      <h4 className="font-bold text-[0.7rem] uppercase tracking-widest text-gold pb-1.5 border-b border-border/30">
                        {cat.name}
                      </h4>
                      <ul className="space-y-3">
                        {cat.features.map((feature) => (
                          <li key={feature.name} className="flex justify-between items-center py-1 gap-4">
                            <span className="text-xs font-medium text-app-text leading-tight">{feature.name}</span>
                            <div className="flex-shrink-0 text-right">
                              {renderStatus(feature[plan])}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="w-full max-w-4xl mx-auto border-t border-border/50 pt-12">
        <div className="text-center mb-8">
          <h3 className="font-serif text-2xl text-app-text flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 text-gold" />
            Perguntas Frequentes
          </h3>
          <p className="text-app-text-muted text-sm mt-1">Dúvidas comuns sobre os planos e recursos</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="faq-1" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              Minhas anotações são mantidas se eu cancelar o PRO?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              Sim. Suas anotações são salvas na nuvem e continuam vinculadas à sua conta. Se você cancelar o PRO, elas continuarão disponíveis para visualização e edição, mas você perderá o acesso à exportação em PDF e outros recursos exclusivos do PRO.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              As exportações em PDF têm limite?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              Não. A geração e exportação das suas anotações e destaques em formato PDF elegante é totalmente ilimitada para assinantes PRO e Templo.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              O PRO financia a missão do Bíblia Vive?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              Sim. O Bíblia Vive PRO é o que viabiliza financeiramente o projeto, permitindo cobrir os custos de servidores, APIs e banco de dados, mantendo o acesso à leitura bíblica totalmente gratuito para milhares de pessoas ao redor do mundo.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              Quais funcionalidades estão planejadas para o futuro?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              Nosso roadmap inclui inteligência artificial para resumos devocionais personalizados, planos de leitura em grupo com compartilhamento de progresso e mais opções de customização visual para o leitor. Assinantes PRO terão acesso imediato a todas as novidades.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
