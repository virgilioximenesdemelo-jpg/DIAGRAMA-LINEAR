import { jsPDF } from 'jspdf';
import { ContractHeader, DefectRecord, DisplayOptions, SEVERITY_RULES, PDFExportFormat, ContractSegment } from '../types';
import { getPathologySlot, getPathologyColor } from '../components/LinearDiagramView';

export const PATHOLOGY_COLORS: Record<string, string> = {
  // Paved
  'Panela': '#DC2626',
  'Remendo': '#8B4513',
  'Trincamento': '#A855F7',
  'Roçada': '#22C55E',
  'Sinalização Vertical': '#3B82F6',
  'Sinalização Horizontal': '#EAB308',

  // Unpaved / Standard
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

/**
 * High-resolution Vector PDF Exporter with support for A4 (Landscape/Portrait), A3, and Contract Segmentation
 */
export function exportLinearDiagramPDF(
  header: ContractHeader,
  defects: DefectRecord[],
  options: DisplayOptions,
  overrideFormat?: PDFExportFormat,
  contracts: ContractSegment[] = []
): void {
  const exportFormat = overrideFormat || options.exportFormat || 'A4';
  const isPortrait = exportFormat === 'A4_PORTRAIT';
  const isA3 = exportFormat === 'A3';

  const formatStr = isA3 ? 'a3' : 'a4';
  const orientationStr = isPortrait ? 'portrait' : 'landscape';

  const pdf = new jsPDF({
    orientation: orientationStr,
    unit: 'mm',
    format: formatStr,
  });

  const pageWidth = isA3 ? 420 : isPortrait ? 210 : 297;
  const pageHeight = isA3 ? 297 : isPortrait ? 297 : 210;
  const marginX = isA3 ? 12 : 8;
  const marginY = isA3 ? 10 : 7;
  const contentWidth = pageWidth - marginX * 2;

  const startKm = Math.floor(options.kmStartFilter !== undefined ? options.kmStartFilter : header.kmInicialGlobal);
  const endKm = Math.ceil(options.kmEndFilter !== undefined ? options.kmEndFilter : header.kmFinalGlobal);
  const totalKm = Math.max(1, endKm - startKm);

  // Group 10 Km strips
  const stripKmSpan = options.kmPerPage || 10;
  const totalStrips = Math.ceil(totalKm / stripKmSpan);
  const stripsPerPage = isA3 ? 5 : isPortrait ? 5 : 4; // 4 strips per page on A4 Landscape to fill the sheet
  const totalPages = Math.ceil(totalStrips / stripsPerPage);

  const roadType = options.roadType || 'PAVIMENTADO';
  const roadTypeLabel = roadType === 'PAVIMENTADO' ? 'PAVIMENTADO' : 'NÃO PAVIMENTADO';

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage(formatStr, orientationStr);
    }

    // Outer sheet border
    pdf.setLineWidth(0.4);
    pdf.setDrawColor(30, 41, 59);
    pdf.rect(marginX, marginY, contentWidth, pageHeight - marginY * 2);

    // Purple Top Header Banner
    const bannerH = isA3 ? 10 : 8;
    pdf.setFillColor(74, 21, 75); // #4A154B
    pdf.rect(marginX, marginY, contentWidth, bannerH, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(isA3 ? 10 : 8);
    pdf.setTextColor(255, 255, 255);

    // Determine contract / KM label for top header banner
    const selectedContract = contracts.find(
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

    const isPaved = roadType === 'PAVIMENTADO';
    const icmSuffix = isPaved ? 'ICMP' : 'ICMNP';
    let rodoviaName = header.rodovia ? header.rodovia.trim() : 'BR-230/AM';
    if (rodoviaName === 'BR-230' || rodoviaName === 'BR 230') {
      rodoviaName = 'BR-230/AM';
    } else if (rodoviaName.includes('BR-230') && !rodoviaName.includes('BR-230/AM')) {
      rodoviaName = rodoviaName.replace('BR-230', 'BR-230/AM');
    }

    const fullHeaderTitle = `Diagrama Linear da Condição da Rodovia - ${rodoviaName} - ${contractOrKmText} - ${icmSuffix}`;

    pdf.text(
      fullHeaderTitle,
      pageWidth / 2,
      marginY + (isA3 ? 6.5 : 5.2),
      { align: 'center' }
    );

    // Legend Box "PONTOS A CORRIGIR" (Cabeçalho)
    const legendY = marginY + bannerH + 1.5;
    const legendH = isA3 ? 12 : 9.5;
    renderLegendBox(pdf, marginX, legendY, contentWidth, legendH, defects, roadType);

    // Footer Legend Box "REGRA MANDATÓRIA DE SEVERIDADE" (Rodapé)
    const footerLegendY = pageHeight - marginY - legendH;
    renderMandatoryRuleFooter(pdf, marginX, footerLegendY, contentWidth, legendH);

    // Render 10km Strips for this page
    const pageStripStartIdx = pageIdx * stripsPerPage;
    const pageStripEndIdx = Math.min(totalStrips, pageStripStartIdx + stripsPerPage);

    let currentY = legendY + legendH + (isA3 ? 2.5 : 1.2);
    const stripHeight = 40.5; // Exact diagram strip height in mm (ruler + contratada + tracks)
    const gapY = isA3 ? 2.5 : isPortrait ? 2.0 : 1.0;

    for (let s = pageStripStartIdx; s < pageStripEndIdx; s++) {
      const stripStartKm = startKm + s * stripKmSpan;
      const stripEndKm = Math.min(endKm, stripStartKm + stripKmSpan);

      renderDiagramStripPDF(
        pdf,
        marginX,
        currentY,
        contentWidth,
        stripStartKm,
        stripEndKm,
        header,
        defects,
        contracts,
        isA3,
        roadType,
        options
      );

      currentY += stripHeight + gapY;
    }
  }

  // Save PDF
  const filename = `Grafico_Linear_${roadTypeLabel}_${header.rodovia.replace(/[^\w]/g, '_')}_${exportFormat}.pdf`;
  pdf.save(filename);
}

/**
 * Legend box "PONTOS A CORRIGIR" (Header & Footer)
 */
function renderLegendBox(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  defects: DefectRecord[],
  roadType: 'PAVIMENTADO' | 'NAO_PAVIMENTADO'
): void {
  pdf.setFillColor(248, 250, 252);
  pdf.rect(x, y, w, h, 'F');
  pdf.setLineWidth(0.25);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(x, y, w, h, 'S');

  // Title badge "PONTOS A CORRIGIR"
  pdf.setFillColor(74, 21, 75);
  const badgeW = w < 250 ? 28 : 34;
  pdf.rect(x + 2, y + 1.5, badgeW, h - 3, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(w < 250 ? 5.5 : 6.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PONTOS A CORRIGIR', x + 2 + badgeW / 2, y + h / 2 + 1, { align: 'center' });

  // Render pathologies list according to roadType strictly with exact matching colors
  const items = roadType === 'PAVIMENTADO'
    ? [
        { name: 'Panela', color: getPathologyColor('Panela') },
        { name: 'Remendo', color: getPathologyColor('Remendo') },
        { name: 'Trincamento', color: getPathologyColor('Trincamento') },
        { name: 'Roçada', color: getPathologyColor('Roçada') },
        { name: 'Drenagem', color: getPathologyColor('Drenagem') },
        { name: 'Sinalização Vertical', color: getPathologyColor('Sinalização Vertical') },
        { name: 'Sinalização Horizontal', color: getPathologyColor('Sinalização Horizontal') },
      ]
    : [
        { name: 'Panelas', color: getPathologyColor('Panelas') },
        { name: 'Corrugações', color: getPathologyColor('Corrugações') },
        { name: 'Trilha de Roda', color: getPathologyColor('Trilha de Roda') },
        { name: 'Excesso de Poeira', color: getPathologyColor('Excesso de Poeira') },
        { name: 'Seção Trans. Impropria', color: getPathologyColor('Seção Trans. Impropria') },
        { name: 'Drenagem', color: getPathologyColor('Drenagem') },
        { name: "Poças D'água", color: getPathologyColor("Poças D'água") },
      ];

  const startItemsX = x + badgeW + 6;
  const colW = (w - badgeW - 10) / 7;

  items.forEach((item, idx) => {
    const itemX = startItemsX + idx * colW;
    const itemY = y + h / 2 - 1.2;

    // Color box
    const cleanHex = item.color.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    pdf.setFillColor(r, g, b);
    pdf.rect(itemX, itemY - 1, 4, 3, 'F');
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(itemX, itemY - 1, 4, 3, 'S');

    // Name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(w < 250 ? 4.5 : 5.2);
    pdf.setTextColor(30, 41, 59);
    pdf.text(item.name, itemX + 5, itemY + 1.2);
  });
}

/**
 * Footer Legend Box "REGRA MANDATÓRIA DE SEVERIDADE ICMWeb / DNIT"
 */
function renderMandatoryRuleFooter(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  pdf.setFillColor(248, 250, 252);
  pdf.rect(x, y, w, h, 'F');
  pdf.setLineWidth(0.25);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(x, y, w, h, 'S');

  // Title badge "LEGENDAS"
  pdf.setFillColor(74, 21, 75);
  const badgeW = w < 250 ? 28 : 34;
  pdf.rect(x + 2, y + 1.5, badgeW, h - 3, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(w < 250 ? 5.5 : 6.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('LEGENDAS', x + 2 + badgeW / 2, y + h / 2 + 1, { align: 'center' });

  // Severity Rules Scale
  const rules = [
    { label: 'Baixa (Bom)', count: 1 },
    { label: 'Média (Regular)', count: 3 },
    { label: 'Alta (Ruim)', count: 5 },
    { label: 'Péssima (Crítico)', count: 7 },
  ];

  const startX = x + badgeW + 6;
  const colW = (w - badgeW - 10) / 4;

  rules.forEach((rule, idx) => {
    const rx = startX + idx * colW;
    const ry = y + h / 2;

    const cellW = w < 250 ? 1.6 : 2.0;
    const cellH = w < 250 ? 2.2 : 2.6;
    const gap = 0.3;
    const totalBlockW = rule.count * cellW + (rule.count - 1) * gap;

    pdf.setFillColor(51, 65, 85);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.1);

    for (let c = 0; c < rule.count; c++) {
      const cx = rx + c * (cellW + gap);
      pdf.rect(cx, ry - cellH / 2, cellW, cellH, 'FD');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(w < 250 ? 4.8 : 5.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(
      `${rule.label}: ${rule.count} ${rule.count === 1 ? 'Célula' : 'Células'}`,
      rx + totalBlockW + 1.8,
      ry + 0.8
    );
  });
}

/**
 * Renders one 10 Km Diagram Strip into the PDF canvas
 */
function renderDiagramStripPDF(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  startKm: number,
  endKm: number,
  header: ContractHeader,
  defects: DefectRecord[],
  contracts: ContractSegment[] = [],
  isA3: boolean = false,
  roadType: 'PAVIMENTADO' | 'NAO_PAVIMENTADO' = 'PAVIMENTADO',
  options?: DisplayOptions
): void {
  const spanKm = endKm - startKm;
  const leftLabelW = 28; // mm
  const gridW = w - leftLabelW; // mm
  const cellsPerKm = 7; // Subdivisão oficial de 7 células por Km
  const totalCells = spanKm * cellsPerKm;
  const cellWidthMM = gridW / totalCells;
  const isPaved = roadType === 'PAVIMENTADO';

  const stripDefects = defects.filter(
    (d) => d.kmFinal > startKm && d.kmInicial < endKm
  );

  // 1. ESTACA / KM Header Row
  const rulerH = 6.5;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(x, y, leftLabelW, rulerH, 'F');
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(30, 41, 59);
  pdf.rect(x, y, leftLabelW, rulerH, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('ESTACA / KM', x + leftLabelW / 2, y + 4.2, { align: 'center' });

  // Grid Km / Estaca scale header
  const kmColW = gridW / spanKm;
  for (let k = 0; k < spanKm; k++) {
    const curKm = startKm + k;
    const curEstaca = curKm * 50;
    const kmX = x + leftLabelW + k * kmColW;

    pdf.setFillColor(248, 250, 252);
    pdf.rect(kmX, y, kmColW, rulerH, 'F');
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(100, 116, 139);
    pdf.rect(kmX, y, kmColW, rulerH, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`E+${curEstaca}`, kmX + kmColW / 2, y + 2.5, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${curKm}`, kmX + kmColW / 2, y + 5.5, { align: 'center' });
  }

  // 2. Contratada Bar Row
  const contratadaY = y + rulerH;
  const contratadaH = 4.5;

  pdf.setFillColor(226, 232, 240);
  pdf.rect(x, contratadaY, leftLabelW, contratadaH, 'F');
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(30, 41, 59);
  pdf.rect(x, contratadaY, leftLabelW, contratadaH, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Contratada', x + 2, contratadaY + 3);

  pdf.setFillColor(255, 255, 255);
  pdf.rect(x + leftLabelW, contratadaY, gridW, contratadaH, 'F');
  pdf.rect(x + leftLabelW, contratadaY, gridW, contratadaH, 'S');

  // Find selected or matching contract for this strip
  const selectedContract = contracts.find(
    (c) =>
      c.id === options?.selectedContractId ||
      (options?.kmStartFilter !== undefined &&
        options?.kmEndFilter !== undefined &&
        c.kmInicial <= options.kmStartFilter &&
        c.kmFinal >= options.kmEndFilter) ||
      (options?.kmStartFilter !== undefined &&
        options?.kmEndFilter !== undefined &&
        c.kmInicial === options.kmStartFilter &&
        c.kmFinal === options.kmEndFilter)
  );

  const matchingContract =
    selectedContract ||
    contracts.find((c) => c.kmInicial <= startKm && c.kmFinal >= endKm) ||
    contracts.find((c) => c.kmInicial < endKm && c.kmFinal > startKm);

  const getCompanyLabelPDF = () => {
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

  const companyLabel = getCompanyLabelPDF();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(15, 23, 42);
  pdf.text(
    companyLabel,
    x + leftLabelW + gridW / 2,
    contratadaY + 3.2,
    { align: 'center' }
  );

  // 3. Track Rows (LE Faixa de Domínio, LE Acostamento, Eixo, LD Acostamento, LD Faixa de Domínio)
  const trackRows = isPaved
    ? [
        { id: 'le_fd', side: 'LE', label: 'Faixa de Domínio', bg: { r: 254, g: 243, b: 199 }, isAsphalt: false, h: 3.5 },
        { id: 'le_acostamento', side: 'LE', label: 'Acostamento', bg: { r: 30, g: 41, b: 59 }, isAsphalt: true, h: 7.5 },
        { id: 'eixo', side: null, label: 'Eixo da Pista', bg: { r: 15, g: 23, b: 42 }, isAsphalt: true, h: 7.5 },
        { id: 'ld_acostamento', side: 'LD', label: 'Acostamento', bg: { r: 30, g: 41, b: 59 }, isAsphalt: true, h: 7.5 },
        { id: 'ld_fd', side: 'LD', label: 'Faixa de Domínio', bg: { r: 254, g: 243, b: 199 }, isAsphalt: false, h: 3.5 },
      ]
    : [
        { id: 'le_fd', side: 'LE', label: 'Faixa de Domínio', bg: { r: 253, g: 230, b: 138 }, isAsphalt: false, h: 3.5 },
        { id: 'le_acostamento', side: 'LE', label: 'Acostamento', bg: { r: 120, g: 53, b: 15 }, isAsphalt: false, h: 7.5 },
        { id: 'eixo', side: null, label: 'Eixo da Pista', bg: { r: 120, g: 53, b: 15 }, isAsphalt: false, h: 7.5 },
        { id: 'ld_acostamento', side: 'LD', label: 'Acostamento', bg: { r: 120, g: 53, b: 15 }, isAsphalt: false, h: 7.5 },
        { id: 'ld_fd', side: 'LD', label: 'Faixa de Domínio', bg: { r: 253, g: 230, b: 138 }, isAsphalt: false, h: 3.5 },
      ];

  const tracksStartY = contratadaY + contratadaH;
  let currentTrackY = tracksStartY;

  trackRows.forEach((track) => {
    const trackH = track.h;
    const trackY = currentTrackY;

    // Track label left
    pdf.setFillColor(241, 245, 249);
    pdf.rect(x, trackY, leftLabelW, trackH, 'F');
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(30, 41, 59);
    pdf.rect(x, trackY, leftLabelW, trackH, 'S');

    if (track.side) {
      // Dark badge box for LE / LD side
      pdf.setFillColor(30, 41, 59);
      pdf.rect(x + 1.2, trackY + trackH / 2 - 1.5, 4.2, 3.0, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(4.2);
      pdf.setTextColor(255, 255, 255);
      pdf.text(track.side, x + 1.2 + 2.1, trackY + trackH / 2 + 0.6, { align: 'center' });

      // Track label text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(trackH < 5.0 ? 4.5 : 5.0);
      pdf.setTextColor(30, 41, 59);
      pdf.text(track.label, x + 6.0, trackY + trackH / 2 + 0.8);
    } else {
      // Eixo da Pista
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.0);
      pdf.setTextColor(120, 53, 15);
      pdf.text(track.label, x + 1.5, trackY + trackH / 2 + 0.8);
    }

    // Track background fill
    pdf.setFillColor(track.bg.r, track.bg.g, track.bg.b);
    pdf.rect(x + leftLabelW, trackY, gridW, trackH, 'F');

    // Grid vertical lines for 14 cells per km
    for (let c = 0; c <= totalCells; c++) {
      const cellX = x + leftLabelW + c * cellWidthMM;
      const isKmBorder = c % cellsPerKm === 0;

      pdf.setLineWidth(isKmBorder ? 0.3 : 0.1);
      if (track.isAsphalt) {
        pdf.setDrawColor(isKmBorder ? 148 : 71, isKmBorder ? 163 : 85, isKmBorder ? 184 : 105);
      } else {
        pdf.setDrawColor(isKmBorder ? 71 : 203, isKmBorder ? 85 : 213, isKmBorder ? 105 : 225);
      }
      pdf.line(cellX, trackY, cellX, trackY + trackH);
    }

    // Dashed center road line on Eixo da Pista
    if (track.id === 'eixo') {
      pdf.setLineWidth(0.35);
      if (isPaved) {
        pdf.setDrawColor(255, 255, 255); // White dashed centerline for asphalt
      } else {
        pdf.setDrawColor(234, 179, 8); // Yellow dashed line for unpaved
      }
      pdf.setLineDashPattern([2, 1.5], 0);
      pdf.line(x + leftLabelW, trackY + trackH / 2, x + leftLabelW + gridW, trackY + trackH / 2);
      pdf.setLineDashPattern([], 0); // reset line dash
    }

    currentTrackY += trackH;
  });

  // 4. Render Defect Blocks as continuous grouped blocks inside grid
  const cellMap: Record<number, DefectRecord[]> = {};

  stripDefects.forEach((d) => {
    const rule = SEVERITY_RULES[d.gravidade] || SEVERITY_RULES.Baixa;
    const numCells = Math.min(rule.cells, 7);
    const startCellIdx = Math.max(0, Math.floor((d.kmInicial - startKm) * cellsPerKm));

    for (let i = 0; i < numCells; i++) {
      const cellIdx = startCellIdx + i;
      if (cellIdx < totalCells) {
        if (!cellMap[cellIdx]) cellMap[cellIdx] = [];
        cellMap[cellIdx].push(d);
      }
    }
  });

  // Pavement section (Acostamento LE, Eixo, Acostamento LD) starts after Faixa de Domínio LE (3.5mm)
  const pavementStartY = tracksStartY + 3.5;
  const pavementH = 22.5; // 7.5 + 7.5 + 7.5

  stripDefects.forEach((def) => {
    const colorHex = getPathologyColor(def.tipoDefeito);
    const rgb = hexToRgb(colorHex);
    const rule = SEVERITY_RULES[def.gravidade] || SEVERITY_RULES.Baixa;
    const numCells = Math.min(rule.cells, 7);

    const startCellIdx = Math.max(0, Math.floor((def.kmInicial - startKm) * cellsPerKm));
    const endCellIdx = Math.min(totalCells, startCellIdx + numCells);
    const actualCells = Math.max(1, endCellIdx - startCellIdx);

    if (startCellIdx >= totalCells || endCellIdx <= 0) return;

    const pSlot = getPathologySlot(def.tipoDefeito, isPaved);
    const blockCenterY = pavementStartY + (pSlot + 0.5) * (pavementH / 7);
    const blockH = 3.0;
    const blockY = blockCenterY - blockH / 2;

    const leftX = x + leftLabelW + startCellIdx * cellWidthMM;

    // Render side-by-side cell blocks for the defect
    for (let cI = 0; cI < actualCells; cI++) {
      const cellX = leftX + cI * cellWidthMM;
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(cellX, blockY, cellWidthMM, blockH, 'F');
      pdf.setLineWidth(0.15);
      pdf.setDrawColor(15, 23, 42);
      pdf.rect(cellX, blockY, cellWidthMM, blockH, 'S');
    }
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

