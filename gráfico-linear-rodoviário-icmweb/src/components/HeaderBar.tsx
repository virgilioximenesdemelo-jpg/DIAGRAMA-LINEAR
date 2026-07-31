import React from 'react';
import {
  FileSpreadsheet,
  Download,
  FileDown,
  BarChart3,
  Layers,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { ContractHeader } from '../types';
import { MatupiriLogo } from './MatupiriLogo';

interface HeaderBarProps {
  header: ContractHeader | null;
  defectsCount: number;
  activeTab: 'diagram' | 'table' | 'stats' | 'report' | 'contracts';
  setActiveTab: (tab: 'diagram' | 'table' | 'stats' | 'report' | 'contracts') => void;
  onOpenUploadModal: () => void;
  onLoadSample: () => void;
  onDownloadSampleXlsx: () => void;
  onExportPDF: () => void;
  isProcessing: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  header,
  defectsCount,
  activeTab,
  setActiveTab,
  onOpenUploadModal,
  onLoadSample,
  onDownloadSampleXlsx,
  onExportPDF,
  isProcessing,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between min-h-[64px] py-2 gap-3">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-white px-2.5 py-1 rounded-lg shadow-md flex items-center justify-center border border-slate-200">
              <MatupiriLogo className="h-9 w-auto" variant="color" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                  Gráfico Linear Rodoviário
                </h1>
                <span className="bg-sky-500/20 text-sky-300 text-xs px-2 py-0.5 rounded-full font-mono border border-sky-400/30 whitespace-nowrap">
                  ICMWeb v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block whitespace-nowrap">
                Sistema Automatizado de Diagnóstico e Diagrama Linear (DNIT)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700/60 overflow-x-auto max-w-full scrollbar-none gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'report'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Relatório de Consistência</span>
            </button>
            <button
              onClick={() => setActiveTab('diagram')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'diagram'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Diagrama Linear</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'table'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>Ocorrências ({defectsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'stats'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Resumo & Estatísticas</span>
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'contracts'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Contratos (KM)</span>
            </button>
          </div>

          {/* Actions Button Group */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenUploadModal}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              title="Importar planilha do ICMWeb (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Importar Planilha ICMWeb</span>
            </button>

            <button
              onClick={onExportPDF}
              disabled={!header || defectsCount === 0 || isProcessing}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Gerar e Baixar PDF Vetorial A3"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF A3</span>
            </button>

            {/* Overflow Dropdown / Quick Links */}
            <div className="relative group">
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs p-2 rounded-lg border border-slate-700 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 hidden group-hover:block z-50">
                <button
                  onClick={onLoadSample}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Carregar Exemplo (BR-101/SC)</span>
                </button>
                <button
                  onClick={onDownloadSampleXlsx}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baixar Modelo Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
