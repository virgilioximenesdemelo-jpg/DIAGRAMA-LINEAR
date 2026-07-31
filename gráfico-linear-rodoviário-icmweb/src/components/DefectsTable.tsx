import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { DefectRecord, SeverityLevel, SEVERITY_RULES } from '../types';

interface DefectsTableProps {
  defects: DefectRecord[];
  onDownloadSampleXlsx: () => void;
}

export const DefectsTable: React.FC<DefectsTableProps> = ({
  defects,
  onDownloadSampleXlsx,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLado, setSelectedLado] = useState('TODOS');
  const [selectedSeverity, setSelectedSeverity] = useState('TODAS');
  const [selectedPathology, setSelectedPathology] = useState('TODAS');
  const [sortField, setSortField] = useState<keyof DefectRecord>('kmInicial');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Unique lists for filtering
  const uniquePathologies = useMemo(() => {
    return Array.from(new Set(defects.map((d) => d.tipoDefeito))).sort();
  }, [defects]);

  // Filtered and sorted records
  const filteredDefects = useMemo(() => {
    return defects
      .filter((d) => {
        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matches =
            d.tipoDefeito.toLowerCase().includes(term) ||
            d.rodovia.toLowerCase().includes(term) ||
            d.lado.toLowerCase().includes(term) ||
            d.gravidade.toLowerCase().includes(term) ||
            (d.observacoes && d.observacoes.toLowerCase().includes(term));
          if (!matches) return false;
        }

        if (selectedLado !== 'TODOS' && d.lado !== selectedLado) return false;
        if (selectedSeverity !== 'TODAS' && d.gravidade !== selectedSeverity) return false;
        if (selectedPathology !== 'TODAS' && d.tipoDefeito !== selectedPathology) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [defects, searchTerm, selectedLado, selectedSeverity, selectedPathology, sortField, sortDirection]);

  const handleSort = (field: keyof DefectRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Table Title Banner */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/80 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Ocorrências e Levantamentos ICMWeb
              </h2>
              <p className="text-xs text-slate-400">
                Lista tabular detalhada de todas as manifestações mapeadas ({filteredDefects.length} de {defects.length})
              </p>
            </div>
          </div>

          <button
            onClick={onDownloadSampleXlsx}
            className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors border border-slate-600"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar Tabela em Excel (.xlsx)</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por defeito, observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Lado Select */}
          <div>
            <select
              value={selectedLado}
              onChange={(e) => setSelectedLado(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="TODOS">Todos os Lados (D/E)</option>
              <option value="D">Lado Direito (D)</option>
              <option value="E">Lado Esquerdo (E)</option>
              <option value="D/E">Ambos / Pista Dupla</option>
            </select>
          </div>

          {/* Pathology Select */}
          <div>
            <select
              value={selectedPathology}
              onChange={(e) => setSelectedPathology(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 truncate"
            >
              <option value="TODAS">Todas as Patologias</option>
              {uniquePathologies.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Select */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="TODAS">Todas as Severidades</option>
              <option value="Baixa">Baixa (Bom - 1 cell)</option>
              <option value="Média">Média (Regular - 3 cells)</option>
              <option value="Alta">Alta (Ruim - 5 cells)</option>
              <option value="Péssima">Péssima (Péssimo - 7 cells)</option>
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-700 select-none">
                  <th
                    onClick={() => handleSort('kmInicial')}
                    className="p-3.5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Km Inicial</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('kmFinal')}
                    className="p-3.5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Km Final</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('extensaoM')}
                    className="p-3.5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Extensão (m)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-3.5">Lado / Faixa</th>
                  <th
                    onClick={() => handleSort('tipoDefeito')}
                    className="p-3.5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo de Defeito</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('gravidade')}
                    className="p-3.5 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Severidade</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-3.5">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {filteredDefects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-500" />
                        <p className="font-semibold text-slate-300">
                          Nenhum registro corresponde aos filtros selecionados.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDefects.map((item, idx) => {
                    const rule = SEVERITY_RULES[item.gravidade] || SEVERITY_RULES.Baixa;

                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="p-3.5 font-mono text-sky-400 font-bold">
                          Km {item.kmInicial.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono text-sky-400 font-bold">
                          Km {item.kmFinal.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {item.extensaoM} m
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-700 px-2 py-0.5 rounded text-[11px] font-bold text-slate-200">
                            {item.lado} ({item.faixa || 'Faixa 1'})
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-white">
                          {item.tipoDefeito}
                        </td>
                        <td className="p-3.5">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block"
                            style={{
                              backgroundColor: rule.badgeBg,
                              color: rule.badgeText,
                            }}
                          >
                            {rule.label} ({rule.cells} cells)
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] truncate max-w-xs">
                          {item.observacoes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
