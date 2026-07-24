import React, { useState } from "react";
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
      name: "Recursos de Estudo",
      features: [
        {
          name: "Anotações em versículos",
          gratuito: { type: "check", text: "Sim (Local ou Nuvem)" },
          pro: { type: "text", text: "Ilimitadas (Preservadas)" },
          templo: { type: "text", text: "Ilimitadas (Preservadas)" },
        },
        {
          name: "Destaques coloridos",
          gratuito: { type: "check", text: "Sim" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Preservação em PDF",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "text", text: "Ilimitada" },
          templo: { type: "text", text: "Ilimitada" },
        },
        {
          name: "Comentários Teológicos por versículo",
          gratuito: { type: "text", text: "1 consulta experimental" },
          pro: { type: "text", text: "Até 10 consultas por hora" },
          templo: { type: "text", text: "Até 10 consultas por hora" },
        },
        {
          name: "Comentários por capítulo completo",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "check", text: "Sim" },
          templo: { type: "check", text: "Sim" },
        },
        {
          name: "Narrações em áudio",
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
      name: "Recursos para Igrejas",
      features: [
        {
          name: "Ferramentas de projeção",
          gratuito: { type: "cross", text: "Não disponível" },
          pro: { type: "cross", text: "Não disponível" },
          templo: { type: "text", text: "Sim (Modo Projeção)" },
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
          A essência da Bíblia Vive está disponível gratuitamente para todos.
        </h2>
        <p className="text-sm text-app-text-muted text-center md:text-left leading-relaxed">
          Os planos abaixo apresentam apenas recursos adicionais que auxiliam o aprofundamento dos estudos e sustentam o desenvolvimento contínuo da plataforma.
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
                <React.Fragment key={cat.name}>
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
                </React.Fragment>
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
          <p className="text-app-text-muted text-sm mt-1">Dúvidas sobre o apoio e os recursos de estudo</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="faq-1" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              Minhas anotações são mantidas se eu interromper o apoio ao PRO?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              Sim. Suas anotações continuam vinculadas à sua conta. A leitura bíblica e todas as suas anotações pessoais permanecem permanentemente acessíveis.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              Como funciona a preservação em PDF?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              A preservação de suas anotações e reflexões pessoais em formato PDF estruturado está disponível sem limitações para apoiadores dos planos PRO e Templo.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              O Plano PRO apoia a missão da Bíblia Vive?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              Sim. O apoio voluntário viabiliza a manutenção da plataforma, o desenvolvimento de novas ferramentas de estudo e a permanência do acesso gratuito às Escrituras para milhares de leitores.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4" className="border border-border/50 rounded-xl bg-app-surface px-4 py-1">
            <AccordionTrigger className="text-sm font-medium text-app-text hover:no-underline text-left">
              Como novas ferramentas são desenvolvidas?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-app-text-muted leading-relaxed pt-1 pb-3">
              Trabalhamos continuamente em recursos para auxiliar a permanência nas Escrituras, mantendo a leitura simples e o estudo aprofundado.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
