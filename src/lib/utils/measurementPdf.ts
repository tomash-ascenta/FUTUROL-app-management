import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoRegular, robotoBold } from './roboto-font';

// Register Roboto font with Czech character support
function registerFonts(doc: jsPDF): void {
    // Add Roboto Regular
    doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    
    // Add Roboto Bold
    doc.addFileToVFS('Roboto-Bold.ttf', robotoBold);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    
    // Set default font
    doc.setFont('Roboto', 'normal');
}

interface AutoTableOptions {
    startY?: number;
    head?: string[][];
    body?: (string | number)[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: Record<string, unknown>;
    styles?: Record<string, unknown>;
    columnStyles?: Record<number, Record<string, unknown>>;
    margin?: { left?: number; right?: number };
    tableWidth?: 'auto' | 'wrap' | number;
}

interface MeasurementData {
    id: string;
    width: number;
    depth: number;
    height: number;
    clearanceHeight?: number | null;
    pergolaType?: string | null;
    createdAt: string | Date;
    order?: {
        orderNumber?: string | null;
        customer: {
            fullName: string;
        };
        location?: {
            street?: string | null;
            city?: string | null;
            zip?: string | null;
        } | null;
    } | null;
    employee?: {
        fullName: string;
    } | null;
    details?: Record<string, unknown> | null;
}

export function generateMeasurementPdf(measurement: MeasurementData): void {
    const doc = new jsPDF();
    
    // Register Roboto font with Czech character support
    registerFonts(doc);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    const details = (measurement.details ?? {}) as Record<string, unknown>;
    const accessories = (details.accessories ?? {}) as Record<string, unknown>;
    const screens = (details.screens ?? {}) as Record<string, unknown>;

    // Helper functions
    const formatBoolean = (val: unknown): string => {
        if (val === true) return 'Ano';
        if (val === false) return 'Ne';
        return '—';
    };

    const formatValue = (val: unknown): string => {
        if (val === null || val === undefined || val === '') return '—';
        if (typeof val === 'boolean') return formatBoolean(val);
        return String(val);
    };

    const getDetail = (key: string): string => formatValue(details[key]);
    const getAccessory = (key: string): string => formatValue(accessories[key]);
    const getScreen = (key: string): string => {
        const screenData = screens[key] as Record<string, unknown> | undefined;
        if (!screenData) return '—';
        const width = screenData.width ? `${screenData.width} mm` : '—';
        const fabric = screenData.fabric ? String(screenData.fabric) : '—';
        return `${width} / ${fabric}`;
    };

    // === HEADER ===
    doc.setFontSize(20);
    doc.setFont('Roboto', 'bold');
    doc.text('PROTOKOL ZAMĚŘENÍ', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.setFont('Roboto', 'normal');
    doc.text(`Zakázka: ${measurement.order?.orderNumber ?? '—'}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // === ZÁKLADNÍ INFORMACE ===
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Základní informace', margin, y);
    y += 8;

    const location = measurement.order?.location;
    const address = location 
        ? `${location.street ?? ''}, ${location.zip ?? ''} ${location.city ?? ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
        : '—';

    autoTable(doc, {
        startY: y,
        head: [],
        body: [
            ['Zákazník', measurement.order?.customer.fullName ?? '—'],
            ['Adresa', address || '—'],
            ['Zaměřovač', measurement.employee?.fullName ?? '—'],
            ['Datum zaměření', new Date(measurement.createdAt).toLocaleDateString('cs-CZ', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            })],
            ['Typ pergoly', measurement.pergolaType ?? '—'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
        styles: { fontSize: 10, cellPadding: 4, font: 'Roboto' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // === ZÁKLADNÍ ROZMĚRY ===
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Základní rozměry', margin, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        head: [['Parametr', 'Hodnota']],
        body: [
            ['Šířka', `${measurement.width} mm`],
            ['Hloubka', `${measurement.depth} mm`],
            ['Výška', `${measurement.height} mm`],
            ['Podchozí výška', measurement.clearanceHeight ? `${measurement.clearanceHeight} mm` : '—'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
        styles: { fontSize: 10, cellPadding: 4, font: 'Roboto' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // === KONSTRUKCE ===
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Konstrukce', margin, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        head: [['Parametr', 'Hodnota']],
        body: [
            ['Střešní profily', getDetail('roofPanels')],
            ['Počet nohou', getDetail('legCount')],
            ['Délka nohou', getDetail('legLength')],
            ['Konzole', getDetail('bracketInfo')],
            ['Barva rámu', getDetail('colorFrame')],
            ['Barva střechy', getDetail('colorRoof')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
        styles: { fontSize: 10, cellPadding: 4, font: 'Roboto' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // === MONTÁŽ ===
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Montáž', margin, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        head: [['Parametr', 'Hodnota']],
        body: [
            ['Typ stěny', getDetail('wallType')],
            ['Typ zateplení', getDetail('insulationType')],
            ['Tloušťka zateplení', getDetail('insulationThickness')],
            ['Typ kotvení', getDetail('anchoringType')],
            ['Betonové patky', getDetail('concreteFootingsNeeded')],
            ['Odvod vody', getDetail('drainOutput')],
            ['Přívod elektřiny', getDetail('electricalInlet')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
        styles: { fontSize: 10, cellPadding: 4, font: 'Roboto' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Check if we need new page
    if (y > 240) {
        doc.addPage();
        y = 20;
    }

    // === PŘÍSLUŠENSTVÍ ===
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Příslušenství', margin, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        head: [['Parametr', 'Hodnota']],
        body: [
            ['Ovladač', getAccessory('remote')],
            ['Motor', getAccessory('motor')],
            ['Čidlo větru', getAccessory('windSensorEnabled')],
            ['LED osvětlení', getAccessory('ledType')],
            ['Počet LED', getAccessory('ledCount')],
            ['Zásuvky', getAccessory('outlets')],
            ['Trapézový kryt', getAccessory('trapezoidCover')],
            ['Kotvící profil', getAccessory('anchoringProfile')],
            ['Vyztužný profil', getAccessory('reinforcementProfile')],
            ['Izymo přijímač', getAccessory('izymoReceiver')],
            ['Tahoma', getAccessory('tahoma')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
        styles: { fontSize: 10, cellPadding: 4, font: 'Roboto' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Check if we need new page
    if (y > 200) {
        doc.addPage();
        y = 20;
    }

    // === ROLETY ===
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Screenové rolety', margin, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        head: [['Pozice', 'Šířka / Látka']],
        body: [
            ['Přední', getScreen('front')],
            ['Přední levá', getScreen('frontLeft')],
            ['Přední pravá', getScreen('frontRight')],
            ['Levá', getScreen('left')],
            ['Pravá', getScreen('right')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
        styles: { fontSize: 10, cellPadding: 4, font: 'Roboto' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // === LOGISTIKA ===
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Logistika', margin, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        head: [['Parametr', 'Hodnota']],
        body: [
            ['Parkování', getDetail('parking')],
            ['Skladovací prostor', getDetail('storageSpace')],
            ['Doba montáže', getDetail('duration')],
            ['Terén', getDetail('terrain')],
            ['Přístup', getDetail('access')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
        styles: { fontSize: 10, cellPadding: 4, font: 'Roboto' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // === POZNÁMKY ===
    const notes = details.additionalNotes as string | undefined;
    if (notes) {
        // Check if we need new page
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(14);
        doc.setFont('Roboto', 'bold');
        doc.text('Doplňující poznámky', margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('Roboto', 'normal');
        const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin);
        doc.text(splitNotes, margin, y);
    }

    // === FOOTER ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('Roboto', 'normal');
        doc.text(
            `Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')} | Strana ${i} z ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save the PDF
    const fileName = `zamereni_${measurement.order?.orderNumber ?? measurement.id}.pdf`;
    doc.save(fileName);
}
