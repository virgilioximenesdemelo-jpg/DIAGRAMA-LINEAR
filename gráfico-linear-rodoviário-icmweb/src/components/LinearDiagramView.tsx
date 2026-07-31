import React, { useMemo, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Filter,
} from 'lucide-react';
import {
  ContractHeader,
  ContractSegment,
  DefectRecord,
  DisplayOptions,
  PDFExportFormat,
  SEVERITY_RULES,
} from '../types';

interface LinearDiagramViewProps {
  header: ContractHeader;
  defects: DefectRecord[];
  contracts?: ContractSegment[];
  options: DisplayOptions;
  setOptions: React.Dispatch<React.SetStateAction<DisplayOptions>>;
  onExportPDF: (overrideFormat?: PDFExportFormat) => void;
}

// Mandatory Color Palette Mapping for standard ICMWeb pathologies
export const PATHOLOGY_COLORS: Record<string, string> = {
  // Paved
  'Panela': '#DC2626',
  'Remendo': '#8B4513',
  'Trincamento': '#A855F7',
  'Roçada': '#22C55E',
  'Sinalização Vertical': '#3B82F6',
  'Sinalização Horizontal': '#EAB308',

  // Unpaved
  'Panelas': '#DC2626',
  'Corrugações': '#2563EB',
  "Poças D'água": '#38BDF8',
  'Drenagem': '#F97316',
  'Seção Trans. Impropria': '#65A30D',
  'Excesso de Poeira': '#9333EA',
  'Trilha de Roda': '#6B7280',

  // Fallbacks
  'Excesso de Bordo': '#F97316',
  'Remendos': '#8B4513',
  'Outros Defeitos': '#64748B',
};

export const STANDARD_PATHOLOGIES_UNPAVED = [
  'Panelas',
  'Drenagem',
  "Poças D'água",
  'Corrugações',
  'Seção Trans. Impropria',
  'Excesso de Poeira',
  'Trilha de Roda',
];

export const STANDARD_PATHOLOGIES_PAVED = [
  'Panela',
  'Remendo',
  'Trincamento',
  'Roçada',
  'Drenagem',
  'Sinalização Vertical',
  'Sinalização Horizontal',
];

export function getPathologyColor(tipo: string): string {
  if (!tipo) return PATHOLOGY_COLORS['Outros Defeitos'];

  if (PATHOLOGY_COLORS[tipo]) return PATHOLOGY_COLORS[tipo];

  const norm = tipo.toLowerCase().trim();

  if (norm.includes('vert')) return PATHOLOGY_COLORS['Sinalização Vertical'];
  if (norm.includes('horiz')) return PATHOLOGY_COLORS['Sinalização Horizontal'];
  if (norm.includes('panela') || norm.includes('buraco')) return PATHOLOGY_COLORS['Panela'];
  if (norm.includes('remendo')) return PATHOLOGY_COLORS['Remendo'];
  if (norm.includes('trinc') || norm.includes('fissur')) return PATHOLOGY_COLORS['Trincamento'];
  if (norm.includes('roça') || norm.includes('roca')) return PATHOLOGY_COLORS['Roçada'];
  if (norm.includes('drenagem')) return PATHOLOGY_COLORS['Drenagem'];
  if (norm.includes('corrugaç') || norm.includes('corrugac') || norm.includes('ondula')) return PATHOLOGY_COLORS['Corrugações'];
  if (norm.includes('poça') || norm.includes('poca') || norm.includes('agua')) return PATHOLOGY_COLORS["Poças D'água"];
  if (norm.includes('seção') || norm.includes('secao') || norm.includes('impropria')) return PATHOLOGY_COLORS['Seção Trans. Impropria'];
  if (norm.includes('poeira')) return PATHOLOGY_COLORS['Excesso de Poeira'];
  if (norm.includes('trilha') || norm.includes('roda')) return PATHOLOGY_COLORS['Trilha de Roda'];
  if (norm.includes('bordo')) return PATHOLOGY_COLORS['Excesso de Bordo'];

  return PATHOLOGY_COLORS['Outros Defeitos'];
}

export const LinearDiagramView: React.FC<LinearDiagramViewProps> = ({
  header,
  defects,
  contracts = [],
  options,
  setOptions,
  onExportPDF,
}) => {
  // Filter defects based on UI display options
  const filteredDefects = useMemo(() => {
    return defects.filter((d) => {
      // Km range filter
      if (d.kmFinal < options.kmStartFilter || d.kmInicial > options.kmEndFilter) {
        return false;
      }
      // Lado filter
      if (options.selectedLado !== 'TODOS' && d.lado !== options.selectedLado) {
        return false;
      }
      // Pathology filter
      if (options.selectedPathology !== 'TODAS') {
        const normSelected = options.selectedPathology.toLowerCase().replace(/s$/, '');
        const normDefect = d.tipoDefeito.toLowerCase().replace(/s$/, '');
        if (normSelected !== normDefect && !d.tipoDefeito.toLowerCase().includes(normSelected)) {
          return false;
        }
      }
      // Severity filter
      if (
        options.selectedSeverity !== 'TODAS' &&
        d.gravidade !== options.selectedSeverity
      ) {
        return false;
      }
      return true;
    });
  }, [defects, options]);

  // Master list of unique pathologies present in the dataset
  const uniquePathologies = useMemo(() => {
    const set = new Set(defects.map((d) => d.tipoDefeito));
    return Array.from(set).sort();
  }, [defects]);

  // List of display pathologies (strictly 7 items depending on pavement type)
  const displayPathologies = useMemo(() => {
    const isPaved = options.roadType === 'PAVIMENTADO';
    return isPaved ? STANDARD_PATHOLOGIES_PAVED : STANDARD_PATHOLOGIES_UNPAVED;
  }, [options.roadType]);

  // Header title matching PDF export logic
  const displayHeaderTitle = useMemo(() => {
    const startKm = options.kmStartFilter !== undefined ? options.kmStartFilter : header.kmInicialGlobal;
    const endKm = options.kmEndFilter !== undefined ? options.kmEndFilter : header.kmFinalGlobal;

    const selectedContract = contracts?.find(
      (c) =>
        c.id === options.selectedContractId ||
        (options.kmStartFilter !== undefined &&
          options.kmEndFilter !== undefined &&
          c.kmInicial <= options.kmStartFilter &&
          c.kmFinal >= options.kmEndFilter) ||
        (c.kmInicial === startKm && c.kmFinal === endKm)
    );

    let contractOrKmText = '';
    let hasContract = false;

    if (selectedContract) {
      const contractNum = (selectedContract.numeroContrato || '').trim();
      const isSemContrato =
        contractNum.toUpperCase().includes('SEM CONTRATO') ||
        (selectedContract.empresa && selectedContract.empresa.toUpperCase().includes('SEM CONTRATO'));

      if (!isSemContrato && contractNum !== '') {
        hasContract = true;
        contractOrKmText = contractNum.toUpperCase().startsWith('CONTRATO')
          ? contractNum
          : `CONTRATO ${contractNum}`;
      }
    } else if (header.contrato) {
      const mainNum = header.contrato.trim();
      const isSemContrato = mainNum.toUpperCase().includes('SEM CONTRATO') || mainNum === '';
      if (!isSemContrato) {
        hasContract = true;
        contractOrKmText = mainNum.toUpperCase().startsWith('CONTRATO')
          ? mainNum
          : `CONTRATO ${mainNum}`;
      }
    }

    if (!hasContract) {
      const segStart =
        options.kmStartFilter !== undefined
          ? options.kmStartFilter
          : selectedContract
          ? selectedContract.kmInicial
          : header.kmInicialGlobal;
      const segEnd =
        options.kmEndFilter !== undefined
          ? options.kmEndFilter
          : selectedContract
          ? selectedContract.kmFinal
          : header.kmFinalGlobal;

      const startKmStr = segStart.toFixed(2).replace('.', ',');
      const endKmStr = segEnd.toFixed(2).replace('.', ',');
      contractOrKmText = `KM ${startKmStr} AO KM ${endKmStr}`;
    }

    const isPaved = options.roadType === 'PAVIMENTADO';
    const icmSuffix = isPaved ? 'ICMP' : 'ICMNP';
    let rodoviaName = header.rodovia ? header.rodovia.trim() : 'BR-230/AM';
    if (rodoviaName === 'BR-230' || rodoviaName === 'BR 230') {
      rodoviaName = 'BR-230/AM';
    } else if (rodoviaName.includes('BR-230') && !rodoviaName.includes('BR-230/AM')) {
      rodoviaName = rodoviaName.replace('BR-230', 'BR-230/AM');
    }

    return `Diagrama Linear da Condição da Rodovia - ${rodoviaName} - ${contractOrKmText} - ${icmSuffix}`;
  }, [header, options, contracts]);

  // Determine kilometer paging (e.g. 10 Km per band strip)
  const startKm = Math.floor(header.kmInicialGlobal);
  const endKm = Math.ceil(header.kmFinalGlobal);
  const kmSpan = Math.max(1, endKm - startKm);

  const kmPerStrip = options.kmPerPage || 10;
  const numStrips = Math.ceil(kmSpan / kmPerStrip);

  // Generate strip definitions (Km ranges)
  const strips = useMemo(() => {
    const list = [];
    for (let i = 0; i < numStrips; i++) {
      const stripStart = startKm + i * kmPerStrip;
      const stripEnd = Math.min(endKm, stripStart + kmPerStrip);
      list.push({
        id: i,
        startKm: stripStart,
        endKm: stripEnd,
        spanKm: stripEnd - stripStart,
      });
    }
    return list;
  }, [startKm, endKm, kmPerStrip, numStrips]);

  // Zoom controls
  const handleZoomIn = () => {
    setOptions((prev) => ({ ...prev, zoomLevel: Math.min(2.0, prev.zoomLevel + 0.15) }));
  };
  const handleZoomOut = () => {
    setOptions((prev) => ({ ...prev, zoomLevel: Math.max(0.7, prev.zoomLevel - 0.15) }));
  };
  const handleResetZoom = () => {
    setOptions((prev) => ({ ...prev, zoomLevel: 1.0 }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Control & Filter Toolbar */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-3 sticky top-16 z-30 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Km & Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tipo de Pista Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-purple-500/40">
              <span className="font-semibold text-purple-300">Pista:</span>
              <button
                onClick={() =>
                  setOptions((prev) => ({
                    ...prev,
                    roadType: prev.roadType === 'PAVIMENTADO' ? 'NAO_PAVIMENTADO' : 'PAVIMENTADO',
                  }))
                }
                className="bg-purple-950/80 hover:bg-purple-900 text-purple-200 font-bold px-2 py-0.5 rounded border border-purple-500/30 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <span>{options.roadType === 'PAVIMENTADO' ? '🛣️ Pavimentado' : '🛤️ Não Pavimentado'}</span>
              </button>
            </div>

            {/* Contract Filter Selector */}
            {contracts && contracts.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-sky-500/40">
                <span className="font-semibold text-sky-300">Contrato:</span>
                <select
                  value={
                    options.kmStartFilter !== undefined
                      ? `${options.kmStartFilter}-${options.kmEndFilter}`
                      : 'ALL'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'ALL') {
                      setOptions((prev) => ({
                        ...prev,
                        kmStartFilter: header.kmInicialGlobal,
                        kmEndFilter: header.kmFinalGlobal,
                      }));
                    } else {
                      const [s, f] = val.split('-').map(Number);
                      setOptions((prev) => ({ ...prev, kmStartFilter: s, kmEndFilter: f }));
                    }
                  }}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="ALL" className="bg-slate-800">
                    Todos os Contratos
                  </option>
                  {contracts.map((c) => {
                    const isSemContrato =
                      c.numeroContrato.toUpperCase().includes('SEM CONTRATO') ||
                      (c.empresa && c.empresa.toUpperCase().includes('SEM CONTRATO'));
                    const label = isSemContrato
                      ? `KM ${c.kmInicial.toFixed(1)} a KM ${c.kmFinal.toFixed(1)} (Sem Contrato)`
                      : `${c.numeroContrato} (KM ${c.kmInicial.toFixed(1)} - ${c.kmFinal.toFixed(1)})`;
                    return (
                      <option
                        key={c.id}
                        value={`${c.kmInicial}-${c.kmFinal}`}
                        className="bg-slate-800"
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-300">Lado:</span>
              <select
                value={options.selectedLado}
                onChange={(e) => setOptions((prev) => ({ ...prev, selectedLado: e.target.value }))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="TODOS" className="bg-slate-800">Todos os Lados</option>
                <option value="D" className="bg-slate-800">Direito (D)</option>
                <option value="E" className="bg-slate-800">Esquerdo (E)</option>
                <option value="D/E" className="bg-slate-800">Pista Dupla / Ambos</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <span className="font-semibold text-slate-300">Patologia:</span>
              <select
                value={options.selectedPathology}
                onChange={(e) => setOptions((prev) => ({ ...prev, selectedPathology: e.target.value }))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="TODAS" className="bg-slate-800">Todas as Patologias</option>
                {displayPathologies.map((path) => (
                  <option key={path} value={path} className="bg-slate-800">
                    {path}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <span className="font-semibold text-slate-300">Severidade:</span>
              <select
                value={options.selectedSeverity}
                onChange={(e) => setOptions((prev) => ({ ...prev, selectedSeverity: e.target.value }))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="TODAS" className="bg-slate-800">Todas</option>
                <option value="Baixa" className="bg-slate-800">Baixa (Bom - 1 cel)</option>
                <option value="Média" className="bg-slate-800">Média (Regular - 3 cel)</option>
                <option value="Alta" className="bg-slate-800">Alta (Ruim - 5 cel)</option>
                <option value="Péssima" className="bg-slate-800">Péssima (Péssimo - 7 cel)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <span className="font-semibold text-slate-300">Km / Faixa:</span>
              <select
                value={options.kmPerPage}
                onChange={(e) => setOptions((prev) => ({ ...prev, kmPerPage: Number(e.target.value) }))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value={5} className="bg-slate-800">5 Km por Faixa</option>
                <option value={10} className="bg-slate-800">10 Km por Faixa (Padrão)</option>
                <option value={15} className="bg-slate-800">15 Km por Faixa</option>
                <option value={20} className="bg-slate-800">20 Km por Faixa</option>
              </select>
            </div>
          </div>

          {/* Right: Zoom & Export Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-sky-400 min-w-[45px] text-center">
                {Math.round(options.zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors border-l border-slate-800 ml-0.5"
                title="Redefinir Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export PDF Button Dropdown */}
            <div className="relative group">
              <button
                onClick={() => onExportPDF('A4')}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Exportar PDF</span>
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 py-1 hidden group-hover:block z-50">
                <button
                  onClick={() => onExportPDF('A4')}
                  className="w-full text-left px-3.5 py-2 text-xs text-white hover:bg-slate-700 flex items-center justify-between"
                >
                  <span>PDF Vetorial A4 (Paisagem)</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Padrão</span>
                </button>
                <button
                  onClick={() => onExportPDF('A4_PORTRAIT')}
                  className="w-full text-left px-3.5 py-2 text-xs text-white hover:bg-slate-700 flex items-center justify-between"
                >
                  <span>PDF Vetorial A4 (Retrato)</span>
                </button>
                <button
                  onClick={() => onExportPDF('A3')}
                  className="w-full text-left px-3.5 py-2 text-xs text-white hover:bg-slate-700 flex items-center justify-between border-t border-slate-700/60"
                >
                  <span>PDF Vetorial A3 (Prancha)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable Canvas */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex justify-center">
        <div
          className="transition-transform duration-150 origin-top bg-white text-slate-900 rounded-xl shadow-2xl p-6 border border-slate-300 max-w-[1400px] w-full"
          style={{ transform: `scale(${options.zoomLevel})` }}
        >
          {/* 1. Top Header Title - Purple ICMWeb Standard Header */}
          <div className="bg-[#4A154B] text-white py-2.5 px-4 rounded-t-lg shadow-sm flex items-center justify-between">
            <h2 className="font-bold text-sm sm:text-base tracking-wide text-center w-full">
              {displayHeaderTitle}
            </h2>
          </div>

          {/* 2. "PONTOS A CORRIGIR" Top Header Legend Box (Appears ONLY at top of sheet) */}
          <div className="bg-slate-50 border border-slate-300 p-3 rounded-b-lg mb-6 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="bg-[#4A154B] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                  PONTOS A CORRIGIR
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  ({filteredDefects.length} ocorrências mapeadas no trecho selecionado)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {displayPathologies.map((pathName) => {
                const color = getPathologyColor(pathName);
                const count = filteredDefects.filter((d) => {
                  return getPathologyColor(d.tipoDefeito) === color;
                }).length;

                return (
                  <div
                    key={pathName}
                    className="flex items-center space-x-1.5 bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-xs shrink-0 shadow-inner border border-black/30"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                        {pathName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono font-semibold">
                        {count} {count === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Render Highway Diagram Segment Strips (Identical format to PDF screenshot) */}
          <div className="space-y-8 overflow-x-auto pb-4">
            {strips.map((strip) => (
              <div key={strip.id} className="min-w-[1600px]">
                <RenderDiagramStrip
                  strip={strip}
                  header={header}
                  defects={filteredDefects}
                  contracts={contracts}
                  options={options}
                />
              </div>
            ))}
          </div>

          {/* 4. Bottom Rule & Mandatory Severity Scale Footer */}
          <div className="mt-8 pt-4 border-t-2 border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 gap-4">
            <div>
              <p className="font-bold text-slate-800">
                Regra Mandatória de Severidade ICMWeb / DNIT (Quantidade de Células):
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 font-medium">
                <span className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs">
                  <span className="flex flex-row space-x-0">
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                  </span>
                  <span>Baixa (Bom): <strong>1 Célula</strong></span>
                </span>

                <span className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs">
                  <span className="flex flex-row space-x-0">
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                  </span>
                  <span>Média (Regular): <strong>3 Células</strong></span>
                </span>

                <span className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs">
                  <span className="flex flex-row space-x-0">
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                  </span>
                  <span>Alta (Ruim): <strong>5 Células</strong></span>
                </span>

                <span className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs">
                  <span className="flex flex-row space-x-0">
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                    <span className="w-3.5 h-3.5 bg-slate-700 rounded-none border border-slate-900 inline-block"></span>
                  </span>
                  <span>Péssima (Péssimo): <strong>7 Células</strong></span>
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="font-bold text-slate-800">Contrato: {header.contrato}</p>
              <p className="text-[11px] text-slate-500">
                Data do Levantamento: {header.dataLevantamento} | Empresa: {header.empresa}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DiagramStripProps {
  strip: { id: number; startKm: number; endKm: number; spanKm: number };
  header: ContractHeader;
  defects: DefectRecord[];
  contracts?: ContractSegment[];
  options: DisplayOptions;
}

export function getPathologySlot(tipo: string, isPaved: boolean): number {
  const norm = (tipo || '').toLowerCase().trim();

  if (isPaved) {
    if (norm.includes('panela') || norm.includes('buraco')) return 0;
    if (norm.includes('remendo')) return 1;
    if (norm.includes('trinca') || norm.includes('fissura')) return 2;
    if (norm.includes('roçada') || norm.includes('rocada')) return 3;
    if (norm.includes('drenagem')) return 4;
    if (norm.includes('vertical') || norm.includes('vert')) return 5;
    if (norm.includes('horizontal') || norm.includes('horiz')) return 6;

    const idx = STANDARD_PATHOLOGIES_PAVED.indexOf(tipo);
    if (idx !== -1) return idx;
  } else {
    if (norm.includes('panela') || norm.includes('buraco')) return 0;
    if (norm.includes('drenagem')) return 1;
    if (norm.includes('poça') || norm.includes('poca') || norm.includes('agua')) return 2;
    if (norm.includes('corrugaç') || norm.includes('corrugac') || norm.includes('ondula')) return 3;
    if (norm.includes('seção') || norm.includes('secao') || norm.includes('impropria')) return 4;
    if (norm.includes('poeira')) return 5;
    if (norm.includes('trilha') || norm.includes('roda')) return 6;

    const idx = STANDARD_PATHOLOGIES_UNPAVED.indexOf(tipo);
    if (idx !== -1) return idx;
  }

  return 0;
}

/**
  * Individual 10 Km Diagram Strip Component
  * Symbolizes highway cross section (Faixa de Domínio, Acostamento, Eixo da Pista - Left & Right)
  */
const RenderDiagramStrip: React.FC<DiagramStripProps> = ({
  strip,
  header,
  defects,
  contracts = [],
  options,
}) => {
  const { startKm, endKm, spanKm } = strip;
  const isPaved = options.roadType === 'PAVIMENTADO';

  // Defects overlapping this Km range
  const stripDefects = defects.filter(
    (d) => d.kmFinal > startKm && d.kmInicial < endKm
  );

  // Subdivisions per Km (1 Km = 7 cells max per pathology subdivision)
  const cellsPerKm = 7;
  const totalCells = spanKm * cellsPerKm;

  // Find selected or matching contract for this strip
  const selectedContract = contracts?.find(
    (c) =>
      c.id === options.selectedContractId ||
      (options.kmStartFilter !== undefined &&
        options.kmEndFilter !== undefined &&
        c.kmInicial <= options.kmStartFilter &&
        c.kmFinal >= options.kmEndFilter) ||
      (options.kmStartFilter !== undefined &&
        options.kmEndFilter !== undefined &&
        c.kmInicial === options.kmStartFilter &&
        c.kmFinal === options.kmEndFilter)
  );

  const matchingContract =
    selectedContract ||
    contracts?.find((c) => c.kmInicial <= startKm && c.kmFinal >= endKm) ||
    contracts?.find((c) => c.kmInicial < endKm && c.kmFinal > startKm);

  const getCompanyLabel = () => {
    if (matchingContract) {
      const num = (matchingContract.numeroContrato || '').trim();
      const emp = (matchingContract.empresa || '').trim();
      const isSemContrato =
        num.toUpperCase().includes('SEM CONTRATO') ||
        emp.toUpperCase().includes('SEM CONTRATO');

      if (isSemContrato) {
        return `KM ${matchingContract.kmInicial.toFixed(2)} a KM ${matchingContract.kmFinal.toFixed(2)}`;
      }
      const formattedNum = num.toUpperCase().startsWith('CONTRATO') ? num : `CONTRATO ${num}`;
      const formattedEmp = emp ? ` - ${emp}` : '';
      return `${formattedNum}${formattedEmp}`;
    }
    if (header.contrato) {
      const mainNum = header.contrato.trim();
      const mainEmp = (header.empresa || '').trim();
      const isSemContrato = mainNum.toUpperCase().includes('SEM CONTRATO') || mainNum === '';
      if (!isSemContrato) {
        const formattedNum = mainNum.toUpperCase().startsWith('CONTRATO') ? mainNum : `CONTRATO ${mainNum}`;
        const formattedEmp = mainEmp ? ` - ${mainEmp}` : '';
        return `${formattedNum}${formattedEmp}`;
      }
    }
    return `KM ${startKm.toFixed(2)} a KM ${endKm.toFixed(2)}`;
  };

  const companyLabel = getCompanyLabel();

  const trackRows = isPaved
    ? [
        { id: 'le_fd', side: 'LE', label: 'Faixa de Domínio', bg: '#FEF3C7', isAsphalt: false, hClass: 'min-h-[28px] h-[28px]' },
        { id: 'le_acostamento', side: 'LE', label: 'Acostamento', bg: '#1E293B', isAsphalt: true, hClass: 'min-h-[56px]' },
        { id: 'eixo', side: null, label: 'Eixo da Pista', bg: '#0F172A', isAsphalt: true, hClass: 'min-h-[56px]' },
        { id: 'ld_acostamento', side: 'LD', label: 'Acostamento', bg: '#1E293B', isAsphalt: true, hClass: 'min-h-[56px]' },
        { id: 'ld_fd', side: 'LD', label: 'Faixa de Domínio', bg: '#FEF3C7', isAsphalt: false, hClass: 'min-h-[28px] h-[28px]' },
      ]
    : [
        { id: 'le_fd', side: 'LE', label: 'Faixa de Domínio', bg: '#FDE68A', isAsphalt: false, hClass: 'min-h-[28px] h-[28px]' },
        { id: 'le_acostamento', side: 'LE', label: 'Acostamento', bg: '#78350F', isAsphalt: false, hClass: 'min-h-[56px]' },
        { id: 'eixo', side: null, label: 'Eixo da Pista', bg: '#78350F', isAsphalt: false, hClass: 'min-h-[56px]' },
        { id: 'ld_acostamento', side: 'LD', label: 'Acostamento', bg: '#78350F', isAsphalt: false, hClass: 'min-h-[56px]' },
        { id: 'ld_fd', side: 'LD', label: 'Faixa de Domínio', bg: '#FDE68A', isAsphalt: false, hClass: 'min-h-[28px] h-[28px]' },
      ];

  return (
    <div className="border-2 border-slate-800 rounded-xl overflow-hidden shadow-md bg-white mb-8">
      {/* 1. Km / Estacas Ruler Header */}
      <div className="flex border-b-2 border-slate-800 bg-slate-100">
        {/* Left Column Label */}
        <div className="w-[104px] shrink-0 bg-slate-200 p-1 border-r-2 border-slate-800 flex flex-col justify-center items-center text-center font-bold text-slate-800 text-[9px] uppercase tracking-tight select-none whitespace-nowrap">
          <span>ESTACA / KM</span>
        </div>

        {/* Kilometer / Estaca Scale Columns with generous spacing */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${spanKm}, 1fr)` }}>
          {Array.from({ length: spanKm }).map((_, kmIndex) => {
            const currentKm = startKm + kmIndex;
            const currentEstaca = currentKm * 50;

            return (
              <div
                key={kmIndex}
                className="border-r-2 border-slate-600 text-center flex flex-col justify-between py-2 px-1 bg-slate-50/90 hover:bg-amber-50/50 transition-colors"
              >
                {/* Estaca label */}
                <div className="text-[10px] font-mono text-slate-600 font-bold leading-tight">
                  E+{currentEstaca}
                </div>

                {/* Major Km Number */}
                <div className="font-black text-xs text-slate-900 my-1 tracking-tight">
                  KM {currentKm}
                </div>

                {/* 14-Block Subdivision ticks */}
                <div className="flex justify-between px-0.5 text-[6px] text-slate-500 font-mono font-bold select-none">
                  <span>|</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                  <span>|</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Contratada Thin Single Line Bar */}
      <div className="flex border-b-2 border-slate-800 bg-slate-100/90 h-7 items-center relative">
        <div className="w-[104px] shrink-0 h-full px-1 border-r-2 border-slate-800 flex items-center justify-start text-left bg-slate-200/90 select-none">
          <span className="text-[8.5px] font-bold text-slate-800 uppercase tracking-tight truncate">
            Contratada
          </span>
        </div>
        <div className="flex-1 h-full flex items-center justify-center px-3 bg-slate-50 text-slate-900 font-extrabold text-[10.5px] uppercase tracking-wider select-none truncate">
          {companyLabel}
        </div>
      </div>

      {/* 3. Highway Track Rows */}
      <div className="divide-y divide-slate-300 relative">
        {trackRows.map((track) => (
          <div
            key={track.id}
            className={`flex relative ${track.hClass}`}
            style={{ backgroundColor: track.bg }}
          >
            {/* Left Track Side Label (LE / LD / Eixo) */}
            <div className="w-[104px] shrink-0 px-1 py-1 border-r-2 border-slate-800 flex items-center justify-start text-left select-none bg-slate-100/90 text-slate-800">
              <div className="flex items-center space-x-1 text-[8.5px] font-bold uppercase tracking-tight">
                {track.side && (
                  <span className="bg-slate-800 text-white px-1 py-0.5 rounded text-[8px] font-mono font-extrabold shrink-0">
                    {track.side}
                  </span>
                )}
                <span className={`${track.id === 'eixo' ? 'text-amber-900 font-extrabold' : 'text-slate-800'} leading-tight whitespace-pre-line text-left`}>
                  {track.label}
                </span>
              </div>
            </div>

            {/* Grid Cells Container */}
            <div
              className={`flex-1 grid relative items-center ${track.hClass}`}
              style={{ gridTemplateColumns: `repeat(${totalCells}, 1fr)` }}
            >
              {/* Background grid vertical lines (14 cells per Km & major 1km borders) */}
              {Array.from({ length: totalCells }).map((_, cellIdx) => (
                <div
                  key={cellIdx}
                  className={`h-full border-r ${
                    (cellIdx + 1) % cellsPerKm === 0
                      ? track.isAsphalt ? 'border-slate-500 border-r-2' : 'border-slate-600 border-r-2'
                      : track.isAsphalt ? 'border-slate-700/60' : 'border-slate-200'
                  }`}
                />
              ))}

              {/* Dashed Centerline for Eixo da Pista */}
              {track.id === 'eixo' && (
                <div
                  className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b-2 border-dashed ${
                    isPaved ? 'border-white shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'border-amber-300/80'
                  } pointer-events-none z-10`}
                />
              )}
            </div>
          </div>
        ))}

        {/* Overlay Defect Blocks across the Highway Grid */}
        <div className="absolute inset-0 pointer-events-none pl-[104px]">
          <div className="relative w-full h-full">
            {renderHighwayDefectBlocks(stripDefects, startKm, spanKm, isPaved)}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders defect blocks positioned accurately on the highway cross section as continuous grouped blocks across cells,
 * strictly limiting maximum cells per pathology according to severity level (1, 3, 5 or 7 cells max).
 */
function renderHighwayDefectBlocks(
  defects: DefectRecord[],
  startKm: number,
  spanKm: number,
  isPaved: boolean
) {
  const cellsPerKm = 7; // Subdivisão oficial de 7 células por Km do ICMWeb
  const totalCells = spanKm * cellsPerKm;

  // Build cell-by-cell defect map to detect multi-pathology overlaps
  const cellMap: Map<number, DefectRecord[]> = new Map();
  for (let c = 0; c < totalCells; c++) {
    cellMap.set(c, []);
  }

  defects.forEach((def) => {
    const rule = SEVERITY_RULES[def.gravidade] || SEVERITY_RULES.Baixa;
    const numCells = Math.min(rule.cells, 7);

    const startCellIdx = Math.max(
      0,
      Math.floor((def.kmInicial - startKm) * cellsPerKm)
    );

    for (let i = 0; i < numCells; i++) {
      const cellIdx = startCellIdx + i;
      if (cellIdx < totalCells) {
        cellMap.get(cellIdx)!.push(def);
      }
    }
  });

  const renderedBlocks: React.ReactNode[] = [];

  // Render each defect record as a single continuous grouped block
  defects.forEach((def, defIdx) => {
    const color = getPathologyColor(def.tipoDefeito);
    const rule = SEVERITY_RULES[def.gravidade] || SEVERITY_RULES.Baixa;
    const numCells = Math.min(rule.cells, 7);

    const startCellIdx = Math.max(
      0,
      Math.floor((def.kmInicial - startKm) * cellsPerKm)
    );
    const endCellIdx = Math.min(totalCells, startCellIdx + numCells);
    const actualCells = Math.max(1, endCellIdx - startCellIdx);

    if (startCellIdx >= totalCells || endCellIdx <= 0) return;

    const leftPct = (startCellIdx / totalCells) * 100;
    const widthPct = (actualCells / totalCells) * 100;

    // Check if multi-pathology in these cells
    let isMultiPathology = false;
    for (let c = startCellIdx; c < endCellIdx; c++) {
      const cDefs = cellMap.get(c) || [];
      const uniqueTypes = new Set(cDefs.map((d) => d.tipoDefeito));
      if (uniqueTypes.size > 1) {
        isMultiPathology = true;
        break;
      }
    }

    // Calculate vertical position: each pathology maps to its designated vertical slot row (0 to 6)
    const pSlot = getPathologySlot(def.tipoDefeito, isPaved);
    const topPct = ((40 + pSlot * 24) / 224) * 100;

    const cellStartKm = startKm + startCellIdx / cellsPerKm;
    const cellEndKm = startKm + endCellIdx / cellsPerKm;

    renderedBlocks.push(
      <div
        key={`${def.id}-grouped-${defIdx}`}
        className="absolute -translate-y-1/2 flex flex-row border border-slate-950/90 shadow-md pointer-events-auto group cursor-pointer transition-all hover:z-50 hover:scale-105 overflow-hidden rounded-xs"
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          top: `${topPct}%`,
          height: '24px',
        }}
      >
        {Array.from({ length: actualCells }).map((_, cellI) => (
          <div
            key={cellI}
            className="flex-1 h-full border-r border-slate-950/60 last:border-r-0"
            style={{ backgroundColor: color }}
          />
        ))}

        {/* Visible Pathology Label Text directly on the defect block */}
        <div className="absolute inset-0 flex items-center justify-center px-1 pointer-events-none z-10">
          <span className="text-[9px] font-black uppercase text-white tracking-tight drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] truncate select-none">
            {def.tipoDefeito} ({def.lado})
          </span>
        </div>

        {/* Hover Tooltip Popup */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-2xl z-50 pointer-events-none border border-slate-700">
          <div className="flex items-center space-x-1.5 border-b border-slate-700 pb-1 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: color }}
            />
            <p className="font-bold text-sky-400">{def.tipoDefeito}</p>
          </div>
          <div className="space-y-0.5 text-[10px] text-slate-300">
            <p>
              <strong>Extensão do Defeito ({actualCells} blocos):</strong> KM {cellStartKm.toFixed(2)} ao {cellEndKm.toFixed(2)}
            </p>
            <p>
              <strong>Km da Planilha:</strong> {def.kmInicial.toFixed(2)} ao {def.kmFinal.toFixed(2)}
            </p>
            <p>
              <strong>Lado:</strong> {def.lado} | <strong>Faixa:</strong> {def.faixa || 'Faixa 1'}
            </p>
            <p>
              <strong>Grau Severidade:</strong> {rule.label} ({actualCells} cél. em bloco)
            </p>
            <p>
              <strong>Extensão:</strong> {def.extensaoM} m
            </p>
            {def.observacoes && (
              <p className="italic text-slate-400 mt-1 border-t border-slate-800 pt-1">
                "{def.observacoes}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  });

  return renderedBlocks;
}
