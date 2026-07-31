import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Eye, FileDown, Layers, MapPin, Building2, Check, X } from 'lucide-react';
import { ContractHeader, ContractSegment, DefectRecord, DisplayOptions, PDFExportFormat } from '../types';
import { exportLinearDiagramPDF } from '../utils/pdfExporter';

interface ContractSegmentationViewProps {
  header: ContractHeader;
  defects: DefectRecord[];
  contracts: ContractSegment[];
  setContracts: React.Dispatch<React.SetStateAction<ContractSegment[]>>;
  options: DisplayOptions;
  setOptions: React.Dispatch<React.SetStateAction<DisplayOptions>>;
  onViewDiagramForContract: (contract: ContractSegment) => void;
}

export const ContractSegmentationView: React.FC<ContractSegmentationViewProps> = ({
  header,
  defects,
  contracts,
  setContracts,
  options,
  setOptions,
  onViewDiagramForContract,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formContract, setFormContract] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSupervisor, setFormSupervisor] = useState('');
  const [formKmInit, setFormKmInit] = useState('0.00');
  const [formKmEnd, setFormKmEnd] = useState('10.00');
  const [formTrecho, setFormTrecho] = useState('');

  const handleOpenAdd = () => {
    setFormContract(`SR-${Math.floor(400 + Math.random() * 50)}/2026`);
    setFormCompany(header.empresa || 'CONSTRUTORA TRIANGULO');
    setFormSupervisor(header.supervisora || 'SUPERVISORA SUL');
    setFormKmInit('0.00');
    setFormKmEnd('10.00');
    setFormTrecho('Trecho Operacional');
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSaveContract = () => {
    const kmI = parseFloat(formKmInit.replace(',', '.')) || 0;
    const kmF = parseFloat(formKmEnd.replace(',', '.')) || 10;

    if (kmF <= kmI) {
      alert('O KM Final deve ser maior que o KM Inicial!');
      return;
    }

    if (editingId) {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                numeroContrato: formContract,
                empresa: formCompany,
                supervisora: formSupervisor,
                kmInicial: kmI,
                kmFinal: kmF,
                trecho: formTrecho,
              }
            : c
        )
      );
    } else {
      const newContract: ContractSegment = {
        id: `CTR-${Date.now()}`,
        numeroContrato: formContract,
        empresa: formCompany,
        supervisora: formSupervisor,
        kmInicial: kmI,
        kmFinal: kmF,
        trecho: formTrecho,
      };
      setContracts((prev) => [...prev, newContract]);
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (c: ContractSegment) => {
    setEditingId(c.id);
    setFormContract(c.numeroContrato);
    setFormCompany(c.empresa || '');
    setFormSupervisor(c.supervisora || '');
    setFormKmInit(c.kmInicial.toString());
    setFormKmEnd(c.kmFinal.toString());
    setFormTrecho(c.trecho || '');
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover esta separação contratual?')) {
      setContracts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleExportPdfContract = (c: ContractSegment, format: PDFExportFormat) => {
    const subOptions: DisplayOptions = {
      ...options,
      kmStartFilter: c.kmInicial,
      kmEndFilter: c.kmFinal,
    };
    const contractHeader: ContractHeader = {
      ...header,
      contrato: c.numeroContrato,
      empresa: c.empresa || header.empresa,
      supervisora: c.supervisora || header.supervisora,
      kmInicialGlobal: c.kmInicial,
      kmFinalGlobal: c.kmFinal,
      extensaoTotalKm: c.kmFinal - c.kmInicial,
    };
    exportLinearDiagramPDF(contractHeader, defects, subOptions, format, [c]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">
              Gestão de Contratos e Separação por Quilometragem (KM)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre os contratos atuantes na rodovia ({header.rodovia}) para dividir automaticamente o diagrama linear e emitir relatórios PDF específicos por contrato.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Novo Contrato</span>
        </button>
      </div>

      {/* Form Add / Edit */}
      {isAdding && (
        <div className="bg-slate-900/90 border border-sky-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-sky-400 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{editingId ? 'Editar Contrato' : 'Novo Contrato por Quilometragem'}</span>
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Número do Contrato</label>
              <input
                type="text"
                value={formContract}
                onChange={(e) => setFormContract(e.target.value)}
                placeholder="Ex: SR-400/2023"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Empresa Construtora/Executora</label>
              <input
                type="text"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Ex: Construtora Triângulo S.A."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Empresa Supervisora</label>
              <input
                type="text"
                value={formSupervisor}
                onChange={(e) => setFormSupervisor(e.target.value)}
                placeholder="Ex: Consórcio Supervisor"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">KM Inicial</label>
              <input
                type="text"
                value={formKmInit}
                onChange={(e) => setFormKmInit(e.target.value)}
                placeholder="Ex: 314.80"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">KM Final</label>
              <input
                type="text"
                value={formKmEnd}
                onChange={(e) => setFormKmEnd(e.target.value)}
                placeholder="Ex: 400.60"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Descrição do Trecho (Opcional)</label>
              <input
                type="text"
                value={formTrecho}
                onChange={(e) => setFormTrecho(e.target.value)}
                placeholder="Ex: Trecho Lote 01"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveContract}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Contrato</span>
            </button>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Contrato</th>
                <th className="py-3 px-4">Quilometragem</th>
                <th className="py-3 px-4">Extensão</th>
                <th className="py-3 px-4">Empresa Executora</th>
                <th className="py-3 px-4">Ocorrências</th>
                <th className="py-3 px-4 text-right">Ações no Diagrama & Exportação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 italic">
                    Nenhum contrato cadastrado. Clique em "Adicionar Novo Contrato" para dividir a rodovia.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const ext = (c.kmFinal - c.kmInicial).toFixed(2);
                  const contractDefectsCount = defects.filter(
                    (d) => d.kmFinal >= c.kmInicial && d.kmInicial <= c.kmFinal
                  ).length;

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-sky-300">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                          <span>{c.numeroContrato}</span>
                        </div>
                        {c.trecho && <span className="block text-[10px] text-slate-400 font-normal">{c.trecho}</span>}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                        KM {c.kmInicial.toFixed(2)} ao KM {c.kmFinal.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {ext} Km
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{c.empresa || header.empresa}</div>
                        {c.supervisora && (
                          <div className="text-[10px] text-slate-500">{c.supervisora}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        {contractDefectsCount} registros
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onViewDiagramForContract(c)}
                            className="bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                            title="Visualizar este contrato no Diagrama Linear"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver no Diagrama</span>
                          </button>

                          <button
                            onClick={() => handleExportPdfContract(c, 'A4')}
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                            title="Exportar PDF A4 Vetorial deste Contrato"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>PDF A4</span>
                          </button>

                          <button
                            onClick={() => handleEdit(c)}
                            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-md transition-colors"
                            title="Editar Contrato"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-slate-800 rounded-md transition-colors"
                            title="Excluir Contrato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
  );
};
