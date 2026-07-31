/**
 * Data structures for ICMWeb Road Contract Linear Diagram
 */

export type SeverityLevel = 'Baixa' | 'Média' | 'Alta' | 'Péssima';
export type RoadType = 'PAVIMENTADO' | 'NAO_PAVIMENTADO';
export type PDFExportFormat = 'A4' | 'A3' | 'A4_PORTRAIT';

export interface ContractSegment {
  id: string;
  numeroContrato: string;
  empresa?: string;
  supervisora?: string;
  kmInicial: number;
  kmFinal: number;
  rodovia?: string;
  trecho?: string;
}

export interface DefectRecord {
  id: string;
  rodovia: string;
  trecho: string;
  kmInicial: number;
  kmFinal: number;
  lado: string; // 'D' | 'E' | 'D/E' | 'Pista Dupla' | 'Ambos'
  faixa?: string;
  tipoDefeito: string;
  gravidade: SeverityLevel;
  extensaoM: number;
  estacaInicial?: number;
  estacaFinal?: number;
  samambaia?: string;
  observacoes?: string;
  [key: string]: any; // preserve any additional columns from ICMWeb
}

export interface ContractHeader {
  contrato: string;
  rodovia: string;
  trecho: string;
  kmInicialGlobal: number;
  kmFinalGlobal: number;
  extensaoTotalKm: number;
  empresa: string;
  supervisora: string;
  dataLevantamento: string;
  snv: string;
  uf: string;
  lote?: string;
}

export interface ColumnMapping {
  rodovia: string | null;
  trecho: string | null;
  kmInicial: string | null;
  kmFinal: string | null;
  lado: string | null;
  faixa: string | null;
  tipoDefeito: string | null;
  gravidade: string | null;
  extensao: string | null;
  samambaia: string | null;
  observacoes: string | null;
}

export interface DisplayOptions {
  kmStartFilter: number;
  kmEndFilter: number;
  zoomLevel: number; // e.g. 1.0, 1.25, 1.5
  kmPerPage: number; // 5, 10, 15, 20
  currentPage: number;
  selectedLado: string; // 'TODOS' | 'D' | 'E'
  selectedPathology: string; // 'TODAS' | specific
  selectedSeverity: string; // 'TODAS' | 'Baixa' | 'Média' | 'Alta' | 'Péssima'
  showEstacas: boolean;
  showSubdivisions: boolean;
  showTooltips: boolean;
  compactMode: boolean;
  pageSize: 'A3' | 'A4' | 'A2';
  roadType: RoadType;
  selectedContractId: string; // 'TODOS' or specific contract segment ID
  exportFormat: PDFExportFormat;
}

export interface ValidationIssue {
  line?: number;
  column?: string;
  value?: string;
  cause: string;
  suggestion?: string;
  severity: 'warning' | 'error';
}

export interface ConsistencyReport {
  fileName?: string;
  fileValid: boolean;
  totalRows: number;
  validRecords: number;
  invalidRecords: number;
  warningCount: number;
  pathologiesCount: number;
  pathologiesList: string[];
  totalExtensionKm: number;
  processingTimeMs: number;
  overlapsCount: number;
  issues: ValidationIssue[];
}

export interface SeverityRule {
  level: SeverityLevel;
  label: string;
  cells: number;
  color: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}

export const SEVERITY_RULES: Record<SeverityLevel, SeverityRule> = {
  Baixa: {
    level: 'Baixa',
    label: 'Baixa (Bom)',
    cells: 1,
    color: '#22c55e',
    borderColor: '#15803d',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
  },
  Média: {
    level: 'Média',
    label: 'Média (Regular)',
    cells: 3,
    color: '#eab308',
    borderColor: '#a16207',
    badgeBg: '#fef9c3',
    badgeText: '#854d0e',
  },
  Alta: {
    level: 'Alta',
    label: 'Alta (Ruim)',
    cells: 5,
    color: '#ef4444',
    borderColor: '#b91c1c',
    badgeBg: '#fee2e2',
    badgeText: '#991b1b',
  },
  Péssima: {
    level: 'Péssima',
    label: 'Péssima (Péssimo)',
    cells: 7,
    color: '#8b5cf6',
    borderColor: '#6d28d9',
    badgeBg: '#f3e8ff',
    badgeText: '#5b21b6',
  },
};
