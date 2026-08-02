import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  Layers,
  MapPin,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { ContractHeader, DefectRecord, SEVERITY_RULES, SeverityLevel } from '../types';

interface SummaryStatsViewProps {
  header: ContractHeader;
  defects: DefectRecord[];
}

export const SummaryStatsView: React.FC<SummaryStatsViewProps> = ({
  header,
  defects,
}) => {
  // Aggregate stats by severity
  const severityCounts = useMemo(() => {
    const counts: Record<SeverityLevel, number> = {
      Baixa: 0,
      Média: 0,
      Alta: 0,
      Péssima: 0,
    };
    defects.forEach((d) => {
      counts[d.gravidade] = (counts[d.gravidade] || 0) + 1;
    });
    return counts;
  }, [defects]);

  // Aggregate total extension affected (m)
  const totalExtensionM = useMemo(() => {
    return defects.reduce((acc, curr) => acc + curr.extensaoM, 0);
  }, [defects]);

  // Aggregate by Pathology
  const pathologyStats = useMemo(() => {
    const map: Record<string, { count: number; extensionM: number }> = {};
    defects.forEach((d) => {
      if (!map[d.tipoDefeito]) {
        map[d.tipoDefeito] = { count: 0, extensionM: 0 };
      }
      map[d.tipoDefeito].count += 1;
      map[d.tipoDefeito].extensionM += d.extensaoM;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [defects]);

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Summary Banner */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              Relatório de Conservação ICMWeb
            </span>
            <h2 className="text-xl font-bold text-white mt-2">
              Resumo do Levantamento Rodoviário - {header.rodovia}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Contrato: {header.contrato} | Extensão Total do Trecho: {header.extensaoTotalKm.toFixed(2)} km
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700">
            <Activity className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-xs text-slate-400">Total Ocorrências</p>
              <p className="text-2xl font-black text-white">{defects.length}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Baixa (Bom)
              </span>
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {severityCounts.Baixa}
            </p>
            <p className="text-xs text-slate-400 mt-1">1 célula por ocorrência</p>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Média (Regular)
              </span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {severityCounts.Média}
            </p>
            <p className="text-xs text-slate-400 mt-1">3 células por ocorrência</p>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Alta (Ruim)
              </span>
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {severityCounts.Alta}
            </p>
            <p className="text-xs text-slate-400 mt-1">5 células por ocorrência</p>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Péssima (Péssimo)
              </span>
              <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {severityCounts.Péssima}
            </p>
            <p className="text-xs text-slate-400 mt-1">7 células por ocorrência</p>
          </div>
        </div>

        {/* Pathology Distribution List */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Distribuição de Defeitos por Categoria</span>
          </h3>

          <div className="space-y-3">
            {pathologyStats.map(([pathName, data]) => {
              const pct = Math.round((data.count / defects.length) * 100) || 0;

              return (
                <div key={pathName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-200">
                    <span>{pathName}</span>
                    <span className="text-sky-400 font-mono">
                      {data.count} itens ({pct}%) • {(data.extensionM / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
