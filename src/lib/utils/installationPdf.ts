/**
 * Installation PDF Generator
 * 
 * Generuje protokol o montáži a předání
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoRegular, robotoBold } from './roboto-font';
import { INSTALLATION_CHECKLIST, getChecklistProgress } from '$lib/config/installationChecklist';

// Register Roboto font with Czech character support
function registerFonts(doc: jsPDF): void {
	doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
	doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
	doc.addFileToVFS('Roboto-Bold.ttf', robotoBold);
	doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
	doc.setFont('Roboto', 'normal');
}

export interface InstallationData {
	id: string;
	status: string;
	scheduledAt?: string | Date | null;
	completedAt?: string | Date | null;
	checklist?: Record<string, boolean> | null;
	workNotes?: string | null;
	handoverNotes?: string | null;
	order?: {
		orderNumber?: string | null;
		customer?: {
			fullName?: string | null;
			companyName?: string | null;
			contacts?: Array<{ 
				fullName?: string | null; 
				phone?: string | null; 
				email?: string | null;
			}>;
		} | null;
		location?: {
			street?: string | null;
			city?: string | null;
			zip?: string | null;
		} | null;
		product?: {
			name?: string | null;
		} | null;
	} | null;
	technician?: {
		fullName: string;
		personalNumber?: string | null;
		phone?: string | null;
	} | null;
}

/**
 * Sestavení PDF dokumentu
 */
function buildInstallationPdf(installation: InstallationData): jsPDF {
	const doc = new jsPDF();
	registerFonts(doc);

	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 15;
	let y = 20;

	// === HEADER ===
	doc.setFontSize(20);
	doc.setFont('Roboto', 'bold');
	doc.setTextColor(114, 47, 55); // Futurol wine
	doc.text('PROTOKOL O MONTÁŽI A PŘEDÁNÍ', pageWidth / 2, y, { align: 'center' });
	y += 10;

	doc.setFontSize(12);
	doc.setTextColor(100, 100, 100);
	const orderNumber = installation.order?.orderNumber || 'N/A';
	doc.text(`Zakázka: ${orderNumber}`, pageWidth / 2, y, { align: 'center' });
	y += 15;

	// === ZÁKLADNÍ INFO ===
	doc.setTextColor(0, 0, 0);
	doc.setFontSize(14);
	doc.setFont('Roboto', 'bold');
	doc.text('Základní informace', margin, y);
	y += 8;

	const contact = installation.order?.customer?.contacts?.[0];
	const customerName = installation.order?.customer?.companyName || 
		contact?.fullName || 
		installation.order?.customer?.fullName || 
		'N/A';
	const location = installation.order?.location;
	const address = location ? `${location.street || ''}, ${location.city || ''} ${location.zip || ''}`.trim() : 'N/A';
	const technicianInfo = installation.technician 
		? `${installation.technician.fullName}${installation.technician.personalNumber ? ` (${installation.technician.personalNumber})` : ''}`
		: 'N/A';

	const formatDate = (date: string | Date | null | undefined): string => {
		if (!date) return '—';
		const d = new Date(date);
		return d.toLocaleDateString('cs-CZ');
	};

	const infoData = [
		['Zákazník', customerName],
		['Adresa realizace', address],
		['Produkt', installation.order?.product?.name || 'Pergola'],
		['Technik', technicianInfo],
		['Plánovaný termín', formatDate(installation.scheduledAt)],
		['Datum dokončení', formatDate(installation.completedAt)],
		['Stav', installation.status === 'completed' ? 'Dokončeno' : 'Naplánováno'],
	];

	autoTable(doc, {
		startY: y,
		body: infoData,
		theme: 'plain',
		styles: { fontSize: 10, cellPadding: 3, font: 'Roboto' },
		columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
		margin: { left: margin, right: margin },
	});
	y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

	// === CHECKLIST ===
	doc.setFontSize(14);
	doc.setFont('Roboto', 'bold');
	const progress = getChecklistProgress(installation.checklist || null);
	doc.text(`Checklist montáže (${progress}% dokončeno)`, margin, y);
	y += 8;

	const checklistData: (string | number)[][] = [];
	INSTALLATION_CHECKLIST.forEach(section => {
		// Sekce header
		checklistData.push([section.label, '']);
		section.items.forEach(item => {
			const checked = installation.checklist?.[item.id] ?? false;
			checklistData.push([`    ${item.label}`, checked ? '✓' : '✗']);
		});
	});

	autoTable(doc, {
		startY: y,
		body: checklistData,
		theme: 'plain',
		styles: { fontSize: 9, cellPadding: 2, font: 'Roboto' },
		columnStyles: {
			0: { cellWidth: 140 },
			1: { cellWidth: 20, halign: 'center' }
		},
		didParseCell: (data) => {
			// Bold pro sekce (řádky bez odsazení)
			const cellText = data.cell.text[0] || '';
			if (data.column.index === 0 && !cellText.startsWith('    ')) {
				data.cell.styles.fontStyle = 'bold';
				data.cell.styles.fillColor = [240, 240, 240];
			}
			// Zelená pro ✓, červená pro ✗
			if (data.column.index === 1) {
				if (cellText === '✓') {
					data.cell.styles.textColor = [0, 150, 0];
				} else if (cellText === '✗') {
					data.cell.styles.textColor = [200, 0, 0];
				}
			}
		},
		margin: { left: margin, right: margin },
	});
	y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

	// === POZNÁMKY Z MONTÁŽE ===
	if (installation.workNotes) {
		if (y > 220) { doc.addPage(); y = 20; }

		doc.setFontSize(14);
		doc.setFont('Roboto', 'bold');
		doc.setTextColor(0, 0, 0);
		doc.text('Poznámky z montáže', margin, y);
		y += 8;

		doc.setFontSize(10);
		doc.setFont('Roboto', 'normal');
		const splitNotes = doc.splitTextToSize(installation.workNotes, pageWidth - 2 * margin);
		doc.text(splitNotes, margin, y);
		y += splitNotes.length * 5 + 10;
	}

	// === POZNÁMKY Z PŘEDÁNÍ ===
	if (installation.handoverNotes) {
		if (y > 220) { doc.addPage(); y = 20; }

		doc.setFontSize(14);
		doc.setFont('Roboto', 'bold');
		doc.text('Poznámky z předání', margin, y);
		y += 8;

		doc.setFontSize(10);
		doc.setFont('Roboto', 'normal');
		const splitNotes = doc.splitTextToSize(installation.handoverNotes, pageWidth - 2 * margin);
		doc.text(splitNotes, margin, y);
		y += splitNotes.length * 5 + 10;
	}

	// === PODPISY ===
	if (y > 230) { doc.addPage(); y = 20; }
	y = Math.max(y + 20, 240);

	doc.setFontSize(10);
	doc.setFont('Roboto', 'normal');

	// Technik
	doc.text('Technik:', margin, y);
	doc.line(margin + 20, y + 2, margin + 80, y + 2);
	doc.text(installation.technician?.fullName || '', margin + 20, y + 8);

	// Zákazník
	doc.text('Zákazník:', pageWidth / 2 + 10, y);
	doc.line(pageWidth / 2 + 30, y + 2, pageWidth - margin, y + 2);

	// === FOOTER ===
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.setFont('Roboto', 'normal');
		doc.setTextColor(128, 128, 128);
		doc.text(
			`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')} | Strana ${i} z ${pageCount} | Futurol.cz`,
			pageWidth / 2,
			doc.internal.pageSize.getHeight() - 10,
			{ align: 'center' }
		);
	}

	return doc;
}

/**
 * Stáhne PDF soubor
 */
export function generateInstallationPdf(installation: InstallationData): void {
	const doc = buildInstallationPdf(installation);
	const fileName = `montaz-${installation.order?.orderNumber ?? installation.id.slice(0, 8)}.pdf`;
	doc.save(fileName);
}

/**
 * Vrací PDF jako base64 string (pro email)
 */
export function generateInstallationPdfBase64(installation: InstallationData): string {
	const doc = buildInstallationPdf(installation);
	return doc.output('datauristring').split(',')[1];
}
