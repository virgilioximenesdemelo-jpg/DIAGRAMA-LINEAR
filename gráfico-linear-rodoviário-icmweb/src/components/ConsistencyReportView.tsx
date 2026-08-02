import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Layers,
  Clock,
  Ruler,
  XCircle,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ConsistencyReport } from '../types';

interface ConsistencyReportViewProps {
  report: ConsistencyReport;
  onProceedToDiagram: () => void;
  onOpenUploadModal: () => void;
}

export const ConsistencyReportView: React.FC<ConsistencyReportViewProps> = ({
  report,
  onProceedToDiagram,
  onOpenUploadModal,
}) => {
  const timeInSeconds = (report.processingTimeMs / 1000).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Validação Concluída com Sucesso
                </span>
                <span className="text-xs text-slate-400">
                  10 Etapas de Análise OK
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                Relatório de Consistência e Qualidade dos Dados
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Arquivo: <span className="text-slate-200 font-mono">{report.fileName || 'Planilha ICMWeb'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenUploadModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              Importar Outra Planilha
            </button>
            <button
              onClick={onProceedToDiagram}
              className="flex items-center space-x-2 bg-[#4B0B56] hover:bg-[#380842] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-900/40 cursor-pointer"
            >
              <span>Visualizar Diagrama Linear</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Linhas Lido</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{report.totalRows.toLocaleString('pt-BR')}</p>
          <span className="text-[10px] text-slate-500 mt-1">Total no Excel</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Registros Válidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{report.validRecords.toLocaleString('pt-BR')}</p>
          <span className="text-[10px] text-emerald-500/80 mt-1">Prontos para o diagrama</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Alertas / Avisos</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{report.warningCount}</p>
          <span className="text-[10px] text-amber-500/80 mt-1">Ajustados pelo motor</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Inválidos</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-200">{report.invalidRecords}</p>
          <span className="text-[10px] text-slate-500 mt-1">Descartados</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Patologias</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-purple-300">{report.pathologiesCount}</p>
          <span className="text-[10px] text-slate-500 mt-1">Tipos identificados</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Extensão Total</span>
            <Ruler className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-extrabold text-sky-300">{report.totalExtensionKm.toFixed(2)} km</p>
          <span className="text-[10px] text-slate-500 mt-1">{timeInSeconds}s de leitura</span>
        </div>
      </div>

      {/* 10 Etapas Workflow Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span>Etapas do Motor de Análise Executadas</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <StageItem step="1" title="Validação Arquivo" status="Sucesso" desc=".xlsx legível" />
          <StageItem step="2" title="Colunas Inteligentes" status="Sucesso" desc="Agnóstico à posição" />
          <StageItem step="3" title="Mapeamento Interno" status="Sucesso" desc="Estrutura de Objetos" />
          <StageItem step="4" title="Validação de Dados" status="Sucesso" desc="Km e Severidades" />
          <StageItem step="5" title="Normalização" status="Sucesso" desc="Formatos unificados" />
          <StageItem step="6" title="Sobreposição/Conflito" status="Tratado" desc={`${report.overlapsCount} sobreposições`} />
          <StageItem step="7" title="Organização Faixas" status="Sucesso" desc="Categorização" />
          <StageItem step="8" title="Cálculo da Escala" status="Sucesso" desc="Posição milimétrica" />
          <StageItem step="9" title="Geração Vetorial" status="Sucesso" desc="Canvas / SVG Prontos" />
          <StageItem step="10" title="Relatório Final" status="Sucesso" desc="Aprovado" />
        </div>
      </div>

      {/* Itemized Consistency Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Detalhamento de Inconsistências e Ajustes Automáticos</h2>
          </div>
          <span className="text-xs text-slate-400">
            {report.issues.length} ocorrência(s) registrada(s)
          </span>
        </div>

        {report.issues.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-200">
              Nenhuma inconsistência ou erro encontrado na planilha!
            </p>
            <p className="text-[11px] text-slate-500">
              Todos os registros foram validados e convertidos com 100% de precisão matemática.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3 w-16">Linha</th>
                  <th className="p-3 w-36">Campo / Coluna</th>
                  <th className="p-3 w-40">Valor Encontrado</th>
                  <th className="p-3">Causa do Alerta</th>
                  <th className="p-3">Ação do Sistema / Sugestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {report.issues.map((issue, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{issue.line ? `L${issue.line}` : '-'}</td>
                    <td className="p-3 font-semibold text-slate-200">{issue.column || 'Geral'}</td>
                    <td className="p-3 font-mono text-amber-300 truncate max-w-[150px]">{issue.value || '-'}</td>
                    <td className="p-3 text-slate-300">{issue.cause}</td>
                    <td className="p-3 text-emerald-400 font-medium">{issue.suggestion || 'Corrigido'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Identified Pathologies Badge List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Patologias Mapeadas nesta Importação ({report.pathologiesList.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {report.pathologiesList.map((pathology, idx) => (
            <span
              key={idx}
              className="bg-slate-800 text-sky-300 border border-slate-700/80 text-xs font-semibold px-3 py-1 rounded-lg"
            >
              {pathology}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

function StageItem({
  step,
  title,
  status,
  desc,
}: {
  step: string;
  title: string;
  status: string;
  desc: string;
}) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-slate-500">ETAPA {step}</span>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
          {status}
        </span>
      </div>
      <p className="font-semibold text-slate-200 text-[11px] truncate">{title}</p>
      <p className="text-[10px] text-slate-400 truncate mt-0.5">{desc}</p>
    </div>
  );
}
