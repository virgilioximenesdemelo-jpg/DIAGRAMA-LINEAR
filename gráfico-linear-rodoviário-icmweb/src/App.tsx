import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { FileUploadModal } from './components/FileUploadModal';
import { LinearDiagramView } from './components/LinearDiagramView';
import { DefectsTable } from './components/DefectsTable';
import { SummaryStatsView } from './components/SummaryStatsView';
import { ConsistencyReportView } from './components/ConsistencyReportView';
import { ContractSegmentationView } from './components/ContractSegmentationView';
import { ContractHeader, DefectRecord, DisplayOptions, ConsistencyReport, ContractSegment, PDFExportFormat } from './types';
import { parseICMWebExcel } from './utils/icmWebParser';
import { exportLinearDiagramPDF } from './utils/pdfExporter';
import {
  SAMPLE_HEADER,
  SAMPLE_DEFECTS,
  SAMPLE_DEFECTS_PAVED,
  SAMPLE_CONTRACTS,
  downloadSampleXLSX,
  createSampleConsistencyReport,
} from './utils/sampleDataGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'diagram' | 'table' | 'stats' | 'report' | 'contracts'>('report');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Contract header, defect records, and contract segments state
  const [header, setHeader] = useState<ContractHeader | null>(SAMPLE_HEADER);
  const [defects, setDefects] = useState<DefectRecord[]>(SAMPLE_DEFECTS);
  const [contracts, setContracts] = useState<ContractSegment[]>(() => {
    try {
      const saved = localStorage.getItem('icmweb_contracts');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar contratos salvos do localStorage:', e);
    }
    try {
      localStorage.setItem('icmweb_contracts', JSON.stringify(SAMPLE_CONTRACTS));
    } catch (e) {}
    return SAMPLE_CONTRACTS;
  });
  const [report, setReport] = useState<ConsistencyReport | null>(createSampleConsistencyReport());

  // Save contracts to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('icmweb_contracts', JSON.stringify(contracts));
    } catch (e) {
      console.error('Erro ao salvar contratos no localStorage:', e);
    }
  }, [contracts]);

  // Mapped columns summary
  const [lastColumnsDetected, setLastColumnsDetected] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  // Display options for Linear Diagram
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    kmStartFilter: 0,
    kmEndFilter: 20,
    zoomLevel: 1.0,
    kmPerPage: 10,
    currentPage: 1,
    selectedLado: 'TODOS',
    selectedPathology: 'TODAS',
    selectedSeverity: 'TODAS',
    showEstacas: true,
    showSubdivisions: true,
    showTooltips: true,
    compactMode: false,
    pageSize: 'A4',
    exportFormat: 'A4',
    roadType: 'PAVIMENTADO',
  });

  // Keep display filter range synced when header changes
  useEffect(() => {
    if (header) {
      setDisplayOptions((prev) => ({
        ...prev,
        kmStartFilter: header.kmInicialGlobal,
        kmEndFilter: header.kmFinalGlobal,
      }));
    }
  }, [header]);

  // Handle uploaded file processing
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await parseICMWebExcel(file);
      setHeader(result.header);
      setDefects(result.defects);
      setReport(result.report);
      setLastColumnsDetected(result.columnsDetected);
      setWarnings(result.warnings);

      // Switch to report tab first so user reviews consistency
      setActiveTab('report');
      setIsUploadModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao ler e analisar a planilha: ${err?.message || 'Arquivo inválido ou corrompido.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load sample dataset (Unpaved / Standard)
  const handleLoadSample = () => {
    setHeader(SAMPLE_HEADER);
    setDefects(SAMPLE_DEFECTS);
    setReport(createSampleConsistencyReport());
    setWarnings([]);
    setDisplayOptions((prev) => ({ ...prev, roadType: 'NAO_PAVIMENTADO' }));
    setActiveTab('report');
  };

  // Load Paved sample dataset
  const handleLoadSamplePaved = () => {
    setHeader(SAMPLE_HEADER);
    setDefects(SAMPLE_DEFECTS_PAVED);
    setReport(createSampleConsistencyReport());
    setWarnings([]);
    setDisplayOptions((prev) => ({ ...prev, roadType: 'PAVIMENTADO' }));
    setActiveTab('diagram');
  };

  // Export PDF with format override (A4, A4_PORTRAIT, A3)
  const handleExportPDF = (overrideFormat?: PDFExportFormat) => {
    if (!header || defects.length === 0) return;
    try {
      exportLinearDiagramPDF(header, defects, displayOptions, overrideFormat, contracts);
    } catch (err: any) {
      alert(`Erro ao gerar PDF: ${err?.message || 'Ocorreu uma falha na renderização.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header Navigation */}
      <HeaderBar
        header={header}
        defectsCount={defects.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onLoadSample={handleLoadSamplePaved}
        onDownloadSampleXlsx={downloadSampleXLSX}
        onExportPDF={handleExportPDF}
        isProcessing={isProcessing}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {header && defects.length > 0 ? (
          <>
            {activeTab === 'report' && report && (
              <ConsistencyReportView
                report={report}
                onProceedToDiagram={() => setActiveTab('diagram')}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
              />
            )}

            {activeTab === 'diagram' && (
              <LinearDiagramView
                header={header}
                defects={defects}
                contracts={contracts}
                options={displayOptions}
                setOptions={setDisplayOptions}
                onExportPDF={handleExportPDF}
              />
            )}

            {activeTab === 'table' && (
              <DefectsTable
                defects={defects}
                onDownloadSampleXlsx={downloadSampleXLSX}
              />
            )}

            {activeTab === 'stats' && (
              <SummaryStatsView
                header={header}
                defects={defects}
              />
            )}

            {activeTab === 'contracts' && (
              <ContractSegmentationView
                header={header}
                defects={defects}
                contracts={contracts}
                setContracts={setContracts}
                options={displayOptions}
                setOptions={setDisplayOptions}
                onViewDiagramForContract={(ctr) => {
                  setDisplayOptions((prev) => ({
                    ...prev,
                    kmStartFilter: ctr.kmInicial,
                    kmEndFilter: ctr.kmFinal,
                  }));
                  setActiveTab('diagram');
                }}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-full border border-slate-700 shadow-xl">
              <span className="text-3xl">🛣️</span>
            </div>
            <h2 className="text-xl font-bold text-white">Nenhum dado carregado</h2>
            <p className="text-xs text-slate-400 max-w-md">
              Faça upload da planilha exportada pelo ICMWeb para gerar automaticamente o gráfico linear de ocorrências.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#4B0B56] hover:bg-[#3B0842] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-lg cursor-pointer"
            >
              Importar Planilha do ICMWeb (.xlsx)
            </button>
          </div>
        )}
      </main>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
        onLoadSample={handleLoadSamplePaved}
        onDownloadSampleXlsx={downloadSampleXLSX}
        isProcessing={isProcessing}
        lastColumnsDetected={lastColumnsDetected}
        warnings={warnings}
      />
    </div>
  );
}
