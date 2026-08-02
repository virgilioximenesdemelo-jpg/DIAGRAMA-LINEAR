import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCcw,
  Download,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onDownloadSampleXlsx: () => void;
  isProcessing: boolean;
  lastColumnsDetected?: Record<string, string>;
  warnings?: string[];
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onLoadSample,
  onDownloadSampleXlsx,
  isProcessing,
  lastColumnsDetected,
  warnings,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        onFileUpload(file);
      } else {
        alert('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls).');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 bg-purple-100 text-purple-800 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Importar Planilha ICMWeb
            </h2>
            <p className="text-xs text-slate-500">
              O sistema detecta automaticamente colunas de Km, Lado, Defeito e Gravidade.
            </p>
          </div>
        </div>

        {/* Warnings Banner */}
        {warnings && warnings.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Aviso de Leitura:</span>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Dropzone Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-500 bg-purple-50/80 scale-[1.01]'
              : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Arraste a planilha do ICMWeb aqui
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ou clique para procurar no seu computador (.xlsx, .xls)
              </p>
            </div>
            <span className="inline-block text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Compatível com relatórios exportados do ICMWeb / DNIT
            </span>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center space-x-3 text-purple-900">
            <RefreshCcw className="w-5 h-5 animate-spin text-purple-700" />
            <span className="text-xs font-semibold">
              Processando planilha e construindo diagrama linear...
            </span>
          </div>
        )}

        {/* Detected Columns Summary */}
        {lastColumnsDetected && Object.keys(lastColumnsDetected).length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Mapeamento Inteligente Realizado:</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(lastColumnsDetected).map(([key, colName]) => (
                <div key={key} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-500 capitalize">{key}:</span>
                  <span className="font-semibold text-slate-800 truncate ml-2 max-w-[120px]">
                    "{colName}"
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onDownloadSampleXlsx}
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Baixar Planilha Modelo (.xlsx)</span>
          </button>

          <button
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Usar Dados de Exemplo BR-101</span>
          </button>
        </div>
      </div>
    </div>
  );
};
