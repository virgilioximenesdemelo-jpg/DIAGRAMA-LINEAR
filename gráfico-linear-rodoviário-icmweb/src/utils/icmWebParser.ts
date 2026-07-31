import * as XLSX from 'xlsx';
import { ContractHeader, DefectRecord, SeverityLevel, ConsistencyReport, ValidationIssue } from '../types';
import { SAMPLE_HEADER } from './sampleDataGenerator';

function normalizeText(text: string): string {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isMatch(header: string, aliases: string[]): boolean {
  const norm = normalizeText(header);
  return aliases.some((alias) => norm.includes(alias) || alias === norm);
}

export interface ParseResult {
  header: ContractHeader;
  defects: DefectRecord[];
  rawRowsCount: number;
  columnsDetected: Record<string, string>;
  warnings: string[];
  report: ConsistencyReport;
}

/**
 * 10-STAGE ANALYSIS ENGINE FOR ICMWEB EXCEL FILES:
 * ETAPA 1 - Validação do Arquivo (.xlsx / integridade)
 * ETAPA 2 - Identificação Inteligente das Colunas
 * ETAPA 3 - Mapeamento dos Dados para estrutura interna
 * ETAPA 4 - Validação dos Dados (Km, Severidade, Campos obrigatórios)
 * ETAPA 5 - Normalização (Km, Lado, Nomes)
 * ETAPA 6 - Tratamento de Sobreposição & Conflitos
 * ETAPA 7 - Organização por Faixas e Patologias
 * ETAPA 8 - Cálculo da Escala Quilométrica & Estacas
 * ETAPA 9 - Geração da Pré-Visualização / Diagrama
 * ETAPA 10 - Relatório de Consistência da Análise
 */
export async function parseICMWebExcel(
  file: File | ArrayBuffer,
  fileNameStr?: string
): Promise<ParseResult> {
  const startTime = performance.now();
  const issues: ValidationIssue[] = [];

  // ETAPA 1: Validação do Arquivo
  const nameOfFile = fileNameStr || (file instanceof File ? file.name : 'planilha_icmweb.xlsx');
  
  if (file instanceof File) {
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      issues.push({
        cause: 'Formato de arquivo não recomendado.',
        value: file.name,
        suggestion: 'Utilize preferencialmente arquivos no formato Excel (.xlsx).',
        severity: 'warning',
      });
    }
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  } catch (err) {
    throw new Error('ETAPA 1 FALHOU: O arquivo fornecido está corrompido ou inacessível.');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellFormula: false });
  } catch (err) {
    throw new Error('ETAPA 1 FALHOU: Não foi possível realizar a leitura da estrutura do Excel. O arquivo pode estar corrompido.');
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('ETAPA 1 FALHOU: A planilha Excel não possui nenhuma aba legível.');
  }

  const sheetNames = workbook.SheetNames;
  let targetSheetName = sheetNames[0];
  for (const name of sheetNames) {
    const norm = normalizeText(name);
    if (norm.includes('icm') || norm.includes('levantamento') || norm.includes('defeito') || norm.includes('dados')) {
      targetSheetName = name;
      break;
    }
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error('ETAPA 1 FALHOU: A aba selecionada da planilha está vazia ou inacessível.');
  }

  const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!matrix || matrix.length === 0) {
    throw new Error('ETAPA 1 FALHOU: Nenhuma linha de dados foi encontrada no arquivo Excel.');
  }

  const warnings: string[] = [];

  // ETAPA 2 & 3: Metadata Extraction & Smart Column Identification
  let contrato = '';
  let rodovia = '';
  let trecho = '';
  let empresa = '';
  let supervisora = '';
  let dataLevantamento = '';
  let snv = '';
  let uf = '';

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      const nextVal = String(row[c + 1] || '').trim();
      const normCell = normalizeText(cellVal);

      if (normCell.includes('contrato') && !contrato && nextVal) contrato = nextVal;
      if ((normCell.includes('rodovia') || normCell.includes('br/uf')) && !rodovia && nextVal) rodovia = nextVal;
      if (normCell.includes('trecho') && !trecho && nextVal) trecho = nextVal;
      if ((normCell.includes('empresa') || normCell.includes('construtora')) && !empresa && nextVal) empresa = nextVal;
      if (normCell.includes('supervisora') && !supervisora && nextVal) supervisora = nextVal;
      if ((normCell.includes('data') || normCell.includes('periodo')) && !dataLevantamento && nextVal) dataLevantamento = nextVal;
      if (normCell.includes('snv') && !snv && nextVal) snv = nextVal;
      if (normCell === 'uf' && !uf && nextVal) uf = nextVal;
    }
  }

  const isPivotedMatrix = checkIsPivotedMatrix(matrix);

  let rawDefects: DefectRecord[] = [];
  let detectedCols: Record<string, string> = {};
  let sheetIssues: ValidationIssue[] = [];

  if (isPivotedMatrix) {
    const matrixResult = parsePivotedMatrixSheet(matrix, { contrato, rodovia, uf });
    rawDefects = matrixResult.defects;
    detectedCols = matrixResult.detectedCols;
    sheetIssues = matrixResult.issues || [];
    if (matrixResult.contrato) contrato = matrixResult.contrato;
    if (matrixResult.rodovia) rodovia = matrixResult.rodovia;
    if (matrixResult.uf) uf = matrixResult.uf;
  } else {
    const listResult = parseUnpivotedListSheet(matrix, { contrato, rodovia, trecho, empresa, supervisora, dataLevantamento, snv, uf });
    rawDefects = listResult.defects;
    detectedCols = listResult.detectedCols;
    warnings.push(...listResult.warnings);
    sheetIssues = listResult.issues || [];
    if (listResult.contrato) contrato = listResult.contrato;
    if (listResult.rodovia) rodovia = listResult.rodovia;
    if (listResult.trecho) trecho = listResult.trecho;
  }

  issues.push(...sheetIssues);

  if (rawDefects.length === 0) {
    throw new Error('ETAPA 4 FALHOU: Nenhum registro de defeito válido foi identificado. Verifique os cabeçalhos de Km e Patologias.');
  }

  // ETAPA 6: Tratamento de Sobreposição e Conflitos
  const { cleanDefects, overlapsCount, overlapIssues } = handleOverlapsAndDeDuplicate(rawDefects);
  issues.push(...overlapIssues);

  const defects = cleanDefects;

  // ETAPA 7 & 8: Faixas & Cálculo da Escala Quilométrica
  let minKm = Math.min(...defects.map((d) => d.kmInicial));
  let maxKm = Math.max(...defects.map((d) => d.kmFinal));
  if (!isFinite(minKm)) minKm = 0;
  if (!isFinite(maxKm)) maxKm = 10;

  const roundedMinKm = Math.floor(minKm);
  const roundedMaxKm = Math.ceil(maxKm);

  const header: ContractHeader = {
    contrato: contrato || SAMPLE_HEADER.contrato,
    rodovia: rodovia || 'BR-230/AM',
    trecho: trecho || `KM ${roundedMinKm.toFixed(2)} ao KM ${roundedMaxKm.toFixed(2)}`,
    kmInicialGlobal: roundedMinKm,
    kmFinalGlobal: roundedMaxKm,
    extensaoTotalKm: round2(roundedMaxKm - roundedMinKm),
    empresa: empresa || SAMPLE_HEADER.empresa,
    supervisora: supervisora || SAMPLE_HEADER.supervisora,
    dataLevantamento: dataLevantamento || new Date().toLocaleDateString('pt-BR'),
    snv: snv || '230BAM0010',
    uf: uf || 'AM',
  };

  const pathologiesSet = new Set(defects.map((d) => d.tipoDefeito));
  const pathologiesList = Array.from(pathologiesSet).sort();

  const endTime = performance.now();
  const processingTimeMs = Math.round((endTime - startTime) * 10) / 10;

  // ETAPA 10: Relatório de Consistência
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const errorIssues = issues.filter((i) => i.severity === 'error');

  const report: ConsistencyReport = {
    fileName: nameOfFile,
    fileValid: true,
    totalRows: matrix.length,
    validRecords: defects.length,
    invalidRecords: errorIssues.length,
    warningCount: warningIssues.length,
    pathologiesCount: pathologiesList.length,
    pathologiesList,
    totalExtensionKm: header.extensaoTotalKm,
    processingTimeMs,
    overlapsCount,
    issues,
  };

  return {
    header,
    defects,
    rawRowsCount: matrix.length,
    columnsDetected: detectedCols,
    warnings: issues.map((i) => `${i.cause} ${i.suggestion || ''}`.trim()),
    report,
  };
}

/**
 * ETAPA 6: Resolve overlapping records on identical highway segments & sides
 */
function handleOverlapsAndDeDuplicate(rawDefects: DefectRecord[]): {
  cleanDefects: DefectRecord[];
  overlapsCount: number;
  overlapIssues: ValidationIssue[];
} {
  const map = new Map<string, DefectRecord>();
  let overlapsCount = 0;
  const overlapIssues: ValidationIssue[] = [];

  const sevRank: Record<SeverityLevel, number> = {
    Péssima: 4,
    Alta: 3,
    Média: 2,
    Baixa: 1,
  };

  for (const defect of rawDefects) {
    const key = `${defect.kmInicial.toFixed(2)}_${defect.kmFinal.toFixed(2)}_${defect.tipoDefeito}_${defect.lado}`;
    if (map.has(key)) {
      overlapsCount++;
      const existing = map.get(key)!;
      if (sevRank[defect.gravidade] > sevRank[existing.gravidade]) {
        map.set(key, defect);
      }
      overlapIssues.push({
        column: 'Trecho / Defeito',
        value: `${defect.tipoDefeito} (KM ${defect.kmInicial} - ${defect.kmFinal})`,
        cause: `Sobreposição de registros no trecho KM ${defect.kmInicial.toFixed(2)} ao ${defect.kmFinal.toFixed(2)} (${defect.lado}).`,
        suggestion: 'Unificado automaticamente mantendo o nível de severidade mais crítico.',
        severity: 'warning',
      });
    } else {
      map.set(key, defect);
    }
  }

  return {
    cleanDefects: Array.from(map.values()),
    overlapsCount,
    overlapIssues,
  };
}

/**
 * Checks if the matrix contains pathology group headers with Bom/Regular/Ruim/Péssimo sub-headers
 */
function checkIsPivotedMatrix(matrix: any[][]): boolean {
  for (let r = 0; r < Math.min(matrix.length, 10); r++) {
    const row = matrix[r] || [];
    const rowStr = row.map((cell) => normalizeText(String(cell))).join(' ');

    if (
      (rowStr.includes('bom') && rowStr.includes('regular') && rowStr.includes('ruim') && rowStr.includes('pessimo')) ||
      (rowStr.includes('panelas') && rowStr.includes('corrugacoes')) ||
      rowStr.includes('condicao da pista')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Parses Pivoted Matrix Sheets (as depicted in ICMWeb Excel exports)
 * Position-agnostic: detects metadata, pathology columns and severities by header names and content analysis.
 */
function parsePivotedMatrixSheet(
  matrix: any[][],
  meta: { contrato: string; rodovia: string; uf: string }
): {
  defects: DefectRecord[];
  detectedCols: Record<string, string>;
  contrato?: string;
  rodovia?: string;
  uf?: string;
  issues: ValidationIssue[];
} {
  const defects: DefectRecord[] = [];
  const detectedCols: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  // Find header row and sub-header row dynamically by searching for severity keywords
  let headerRowIdx = -1;
  let subHeaderRowIdx = -1;

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r] || [];
    const rowStr = row.map((cell) => normalizeText(String(cell))).join(' ');

    if (
      (rowStr.includes('bom') && rowStr.includes('regular')) ||
      (rowStr.includes('ruim') && rowStr.includes('pessim')) ||
      (rowStr.includes('baixa') && rowStr.includes('media'))
    ) {
      subHeaderRowIdx = r;
      headerRowIdx = r > 0 ? r - 1 : r;
      break;
    }
  }

  if (subHeaderRowIdx === -1) {
    // Fallback: search for row containing pathology names
    for (let r = 0; r < Math.min(matrix.length, 15); r++) {
      const rowStr = (matrix[r] || []).map((cell) => normalizeText(String(cell))).join(' ');
      if (rowStr.includes('panela') || rowStr.includes('corruga') || rowStr.includes('poca') || rowStr.includes('drenagem')) {
        headerRowIdx = r;
        subHeaderRowIdx = r + 1 < matrix.length ? r + 1 : r;
        break;
      }
    }
  }

  if (subHeaderRowIdx === -1) {
    subHeaderRowIdx = 1;
    headerRowIdx = 0;
  }

  const headerRow = matrix[headerRowIdx] || [];
  const subHeaderRow = matrix[subHeaderRowIdx] || [];
  const maxCols = Math.max(...matrix.slice(0, subHeaderRowIdx + 2).map((r) => r?.length || 0));

  // Search ALL header rows (0 to subHeaderRowIdx) for metadata columns by name/alias
  let colContrato = -1;
  let colUf = -1;
  let colRodovia = -1;
  let colSentido = -1;
  let colKmIni = -1;
  let colKmFin = -1;
  let colTrecho = -1;

  for (let c = 0; c < maxCols; c++) {
    // Combine text for column 'c' across all header rows
    let colHeaderCombined = '';
    for (let r = 0; r <= subHeaderRowIdx; r++) {
      const cell = String(matrix[r]?.[c] || '').trim();
      if (cell) colHeaderCombined += ' ' + normalizeText(cell);
    }

    if (isMatch(colHeaderCombined, ['contrato'])) colContrato = c;
    if (isMatch(colHeaderCombined, ['uf', 'estado'])) colUf = c;
    if (isMatch(colHeaderCombined, ['rodovia', 'br/uf', 'br'])) colRodovia = c;
    if (isMatch(colHeaderCombined, ['sentido', 'lado', 'pista', 'lado/pista', 'posicao'])) colSentido = c;
    if (isMatch(colHeaderCombined, ['km inicial', 'kmini', 'km_inicial', 'km_inicio', 'km i', 'estaca inicial', 'km_i', 'km inicio'])) colKmIni = c;
    if (isMatch(colHeaderCombined, ['km final', 'kmfin', 'km_final', 'km_fim', 'km f', 'estaca final', 'km_f', 'km fim'])) colKmFin = c;
    if (isMatch(colHeaderCombined, ['trecho', 'lote', 'segmento'])) colTrecho = c;
  }

  // Content-based fallback if Km columns were not identified by header names
  const dataStartRow = subHeaderRowIdx + 1;

  if (colKmIni === -1 || colKmFin === -1) {
    let candidates: { colIdx: number; avgVal: number }[] = [];
    for (let c = 0; c < maxCols; c++) {
      let validNumCount = 0;
      let sum = 0;
      for (let r = dataStartRow; r < Math.min(matrix.length, dataStartRow + 20); r++) {
        const val = parseNumber(matrix[r]?.[c]);
        if (!isNaN(val) && val >= 0 && val < 5000) {
          validNumCount++;
          sum += val;
        }
      }
      if (validNumCount >= 3) {
        candidates.push({ colIdx: c, avgVal: sum / validNumCount });
      }
    }

    if (colKmIni === -1 && candidates.length > 0) {
      colKmIni = candidates[0].colIdx;
    }
    if (colKmFin === -1 && candidates.length > 1) {
      colKmFin = candidates[1].colIdx;
    } else if (colKmFin === -1 && colKmIni >= 0) {
      colKmFin = colKmIni + 1;
    }
  }

  const metaColSet = new Set([colContrato, colUf, colRodovia, colSentido, colKmIni, colKmFin, colTrecho].filter((idx) => idx >= 0));

  detectedCols['Km Inicial'] = colKmIni >= 0 ? `Coluna ${colKmIni + 1}` : 'N/A';
  detectedCols['Km Final'] = colKmFin >= 0 ? `Coluna ${colKmFin + 1}` : 'N/A';
  if (colSentido >= 0) detectedCols['Sentido/Lado'] = `Coluna ${colSentido + 1}`;

  // Build Pathology + Severity column mapping dynamically
  interface PathColMap {
    colIdx: number;
    pathology: string;
    severity: SeverityLevel;
  }
  const pathologyCols: PathColMap[] = [];

  let currentPathology = 'Panelas';

  for (let c = 0; c < maxCols; c++) {
    if (metaColSet.has(c)) continue;

    let topCell = String(headerRow[c] || '').trim();
    if (!topCell) {
      for (let prevC = c - 1; prevC >= 0; prevC--) {
        const prevVal = String(headerRow[prevC] || '').trim();
        if (prevVal && !metaColSet.has(prevC)) {
          topCell = prevVal;
          break;
        }
      }
    }

    const normTop = normalizeText(topCell);
    if (topCell && !normTop.includes('condicao') && !normTop.includes('contrato') && !normTop.includes('km')) {
      currentPathology = topCell;
    }

    const subCell = String(subHeaderRow[c] || headerRow[c] || '').trim();
    const subText = normalizeText(subCell);
    let sev: SeverityLevel | null = null;

    if (subText.includes('bom') || subText.includes('baixa') || subText === '1' || subText === 'b') sev = 'Baixa';
    else if (subText.includes('regular') || subText.includes('media') || subText === '2' || subText === 'm' || subText === 'r') sev = 'Média';
    else if (subText.includes('ruim') || subText.includes('alta') || subText === '3' || subText === 'a') sev = 'Alta';
    else if (subText.includes('pessim') || subText.includes('pessima') || subText === '4' || subText === 'p') sev = 'Péssima';

    if (sev) {
      pathologyCols.push({
        colIdx: c,
        pathology: normalizeDefectName(currentPathology),
        severity: sev,
      });
    }
  }

  // Iterate over data rows
  let extractedContrato = meta.contrato;
  let extractedRodovia = meta.rodovia;
  let extractedUf = meta.uf;

  for (let r = dataStartRow; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (!row || row.length === 0) continue;

    let kmIni = colKmIni >= 0 ? parseNumber(row[colKmIni]) : NaN;
    let kmFin = colKmFin >= 0 ? parseNumber(row[colKmFin]) : NaN;

    if (isNaN(kmIni) || isNaN(kmFin)) continue;

    if (kmIni > kmFin) {
      const tmp = kmIni;
      kmIni = kmFin;
      kmFin = tmp;
      issues.push({
        line: r + 1,
        column: 'KM Inicial / KM Final',
        value: `${kmFin} > ${kmIni}`,
        cause: `KM Inicial maior que KM Final na linha ${r + 1}.`,
        suggestion: 'Invertido automaticamente.',
        severity: 'warning',
      });
    }

    if (colContrato >= 0 && row[colContrato]) extractedContrato = String(row[colContrato]).trim();
    if (colRodovia >= 0 && row[colRodovia]) extractedRodovia = String(row[colRodovia]).trim();
    if (colUf >= 0 && row[colUf]) extractedUf = String(row[colUf]).trim();

    const sentidoRaw = colSentido >= 0 ? String(row[colSentido] || '') : 'D';
    const lado = parseLado(sentidoRaw);

    pathologyCols.forEach((pCol) => {
      const rawVal = row[pCol.colIdx];
      const cellVal = String(rawVal || '').trim().toUpperCase();
      const isMarked = cellVal && cellVal !== '0' && cellVal !== 'NÃO' && cellVal !== 'NAO' && cellVal !== '-' && cellVal !== 'FALSE';

      if (isMarked) {
        defects.push({
          id: `DEF-${defects.length + 1}`,
          rodovia: extractedRodovia || 'BR-230/AM',
          trecho: `${kmIni.toFixed(2)} - ${kmFin.toFixed(2)} km`,
          kmInicial: round2(kmIni),
          kmFinal: round2(kmFin),
          lado,
          faixa: 'Faixa 1',
          tipoDefeito: pCol.pathology,
          gravidade: pCol.severity,
          extensaoM: Math.round(Math.abs(kmFin - kmIni) * 1000),
          estacaInicial: round2(kmIni * 50),
          estacaFinal: round2(kmFin * 50),
          observacoes: `Identificado na planilha ICMWeb (${pCol.severity})`,
        });
      }
    });
  }

  return {
    defects,
    detectedCols,
    contrato: extractedContrato,
    rodovia: extractedRodovia,
    uf: extractedUf,
    issues,
  };
}

/**
 * Parses Unpivoted List Sheets (explicit columns)
 */
function parseUnpivotedListSheet(
  matrix: any[][],
  meta: any
): {
  defects: DefectRecord[];
  detectedCols: Record<string, string>;
  warnings: string[];
  issues: ValidationIssue[];
  contrato?: string;
  rodovia?: string;
  trecho?: string;
} {
  const defects: DefectRecord[] = [];
  const detectedCols: Record<string, string> = {};
  const warnings: string[] = [];
  const issues: ValidationIssue[] = [];

  const aliasesMap = {
    rodovia: ['rodovia', 'br', 'uf', 'br/uf', 'rodovia/uf'],
    trecho: ['trecho', 'subtrecho', 'lote', 'segmento'],
    kmInicial: ['km inicial', 'km_inicial', 'km_inicio', 'km ini', 'kmini', 'km_inic', 'km i', 'estaca inicial', 'km_i'],
    kmFinal: ['km final', 'km_final', 'km_fim', 'km fin', 'kmfin', 'km_f', 'estaca final', 'km_f'],
    lado: ['lado', 'pista', 'sentido', 'lado_pista', 'posicao', 'lado/pista'],
    faixa: ['faixa', 'faixa_pista', 'faixa1', 'lane', 'faixa edicao'],
    tipoDefeito: ['tipo de defeito', 'tipo defeito', 'defeito', 'patologia', 'manifestacao', 'servico', 'item', 'ocorrencia', 'grupo'],
    gravidade: ['gravidade', 'severidade', 'nivel', 'grau', 'conceito', 'sev'],
    extensao: ['extensao', 'extensão', 'comprimento', 'extensão (m)', 'extensao_m', 'metros', 'ext'],
    estacaInicial: ['estaca inicial', 'estaca_ini'],
    estacaFinal: ['estaca final', 'estaca_fin'],
    observacoes: ['observacoes', 'observação', 'obs', 'detalhes', 'nota'],
  };

  let headerRowIndex = -1;
  let bestScore = 0;

  for (let r = 0; r < Math.min(matrix.length, 25); r++) {
    const row = matrix[r] || [];
    let score = 0;
    row.forEach((cell) => {
      const cellStr = String(cell || '');
      if (isMatch(cellStr, aliasesMap.kmInicial)) score += 3;
      if (isMatch(cellStr, aliasesMap.kmFinal)) score += 3;
      if (isMatch(cellStr, aliasesMap.tipoDefeito)) score += 3;
      if (isMatch(cellStr, aliasesMap.gravidade)) score += 2;
      if (isMatch(cellStr, aliasesMap.lado)) score += 2;
    });
    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = r;
    }
  }

  if (headerRowIndex === -1) headerRowIndex = 0;

  const headerRow = matrix[headerRowIndex] || [];
  const colMap: Record<string, number> = {};

  headerRow.forEach((cellVal: any, colIdx: number) => {
    const headerStr = String(cellVal || '').trim();
    if (!headerStr) return;
    for (const [key, aliases] of Object.entries(aliasesMap)) {
      if (colMap[key] === undefined && isMatch(headerStr, aliases)) {
        colMap[key] = colIdx;
        detectedCols[key] = headerStr;
      }
    }
  });

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (!row || row.length === 0 || row.every((c) => c === '')) continue;

    const getValue = (key: string) => (colMap[key] !== undefined ? row[colMap[key]] : undefined);

    let kmIni = parseNumber(getValue('kmInicial'));
    let kmFin = parseNumber(getValue('kmFinal'));

    if (isNaN(kmIni)) {
      const eIni = parseNumber(getValue('estacaInicial'));
      if (!isNaN(eIni)) kmIni = eIni / 50;
    }
    if (isNaN(kmFin)) {
      const eFin = parseNumber(getValue('estacaFinal'));
      if (!isNaN(eFin)) kmFin = eFin / 50;
    }

    if (isNaN(kmIni) || isNaN(kmFin)) continue;

    if (kmIni > kmFin) {
      const tmp = kmIni;
      kmIni = kmFin;
      kmFin = tmp;
      issues.push({
        line: r + 1,
        column: 'KM Inicial / KM Final',
        value: `${kmFin} > ${kmIni}`,
        cause: `KM Inicial maior que KM Final na linha ${r + 1}.`,
        suggestion: 'Invertido automaticamente.',
        severity: 'warning',
      });
    }

    const tipoDefeitoRaw = String(getValue('tipoDefeito') || 'Patologia desconhecida');
    const gravidadeRaw = String(getValue('gravidade') || 'Baixa');
    const ladoRaw = String(getValue('lado') || 'D');

    defects.push({
      id: `DEF-${defects.length + 1}`,
      rodovia: String(getValue('rodovia') || meta.rodovia || 'BR-230/AM').trim(),
      trecho: String(getValue('trecho') || meta.trecho || 'Trecho Geral').trim(),
      kmInicial: round2(kmIni),
      kmFinal: round2(kmFin),
      lado: parseLado(ladoRaw),
      faixa: String(getValue('faixa') || 'Faixa 1').trim(),
      tipoDefeito: normalizeDefectName(tipoDefeitoRaw),
      gravidade: parseSeverity(gravidadeRaw),
      extensaoM: parseNumber(getValue('extensao')) || Math.round((kmFin - kmIni) * 1000),
      estacaInicial: round2(kmIni * 50),
      estacaFinal: round2(kmFin * 50),
      observacoes: String(getValue('observacoes') || '').trim(),
    });
  }

  return { defects, detectedCols, warnings, issues };
}

function parseNumber(val: any): number {
  if (val === undefined || val === null || val === '') return NaN;
  if (typeof val === 'number') return val;
  const str = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? NaN : num;
}

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

function parseSeverity(val: string): SeverityLevel {
  const norm = normalizeText(val);
  if (norm.includes('pessim') || norm.includes('critica') || norm === 'p' || norm === '4') return 'Péssima';
  if (norm.includes('alta') || norm.includes('ruim') || norm === 'a' || norm === '3') return 'Alta';
  if (norm.includes('media') || norm.includes('regular') || norm === 'm' || norm === '2') return 'Média';
  if (norm.includes('baixa') || norm.includes('bom') || norm === 'b' || norm === '1') return 'Baixa';
  return 'Baixa';
}

function parseLado(val: string): string {
  const norm = normalizeText(val);
  if (norm.includes('esq') || norm === 'e' || norm.includes('decrescente')) return 'E';
  if (norm.includes('dir') || norm === 'd' || norm.includes('crescente')) return 'D';
  if (norm.includes('dupla') || norm.includes('e/d') || norm.includes('d/e') || norm.includes('ambos')) return 'D/E';
  return val.toUpperCase() || 'D';
}

function normalizeDefectName(raw: string): string {
  const norm = normalizeText(raw);

  if (norm.includes('vert')) return 'Sinalização Vertical';
  if (norm.includes('horiz')) return 'Sinalização Horizontal';
  if (norm.includes('rocada') || norm.includes('roçada')) return 'Roçada';
  if (norm.includes('remendo')) return 'Remendo';
  if (norm.includes('trinca') || norm.includes('fissura')) return 'Trincamento';
  if (norm.includes('panela') || norm.includes('buraco')) return 'Panela';
  if (norm.includes('ondulacao') || norm.includes('corrugaco')) return 'Corrugações';
  if (norm.includes('poca') || norm.includes('agua')) return "Poças D'água";
  if (norm.includes('drenagem')) return 'Drenagem';
  if (norm.includes('trilha') || norm.includes('roda')) return 'Trilha de Roda';
  if (norm.includes('secao') || norm.includes('impropria')) return 'Seção Trans. Impropria';
  if (norm.includes('poeira') || norm.includes('excesso de poeira')) return 'Excesso de Poeira';
  if (norm.includes('bordo') || norm.includes('degrau')) return 'Excesso de Bordo';

  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1);
}
