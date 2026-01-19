/**
 * Service PDF Generator
 * 
 * Generuje servisní protokol
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoRegular, robotoBold } from './roboto-font';
import { 
	getCategoryLabel, 
	getTypeLabel, 
	getPriorityLabel, 
	getStatusLabel 
} from '$lib/config/serviceCategories';

// Register Roboto font with Czech character support
function registerFonts(doc: jsPDF): void {
	doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
	doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
	doc.addFileToVFS('Roboto-Bold.ttf', robotoBold);
	doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
	doc.setFont('Roboto', 'normal');
}

interface MaterialItem {
	name: string;
	quantity: number;
	price?: number;
}

export interface ServiceTicketData {
	id: string;
	ticketNumber: string;
	type: string;
	category?: string | null;
	priority: string;
	status: string;
	description: string;
	diagnosis?: string | null;
	workPerformed?: string | null;
	materialsUsed?: MaterialItem[] | null;
	resolution?: string | null;
	resolvedAt?: string | Date | null;
	scheduledAt?: string | Date | null;
	customer?: {
		fullName?: string | null;
		companyName?: string | null;
		contacts?: Array<{ 
			fullName?: string | null; 
			phone?: string | null;
		}>;
	} | null;
	order?: {
		orderNumber?: string | null;
		location?: {
			street?: string | null;
			city?: string | null;
			zip?: string | null;
		} | null;
	} | null;
	assignedTo?: {
		fullName: string;
		personalNumber?: string | null;
	} | null;
}

/**
 * Sestavení PDF dokumentu
 */
function buildServicePdf(ticket: ServiceTicketData): jsPDF {
	const doc = new jsPDF();
	registerFonts(doc);

	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 15;
	let y = 20;

	const formatDate = (date: string | Date | null | undefined): string => {
		if (!date) return '—';
		const d = new Date(date);
		return d.toLocaleDateString('cs-CZ');
	};

	// === HEADER ===
	doc.setFontSize(20);
	doc.setFont('Roboto', 'bold');
	doc.setTextColor(114, 47, 55); // Futurol wine
	doc.text('SERVISNÍ PROTOKOL', pageWidth / 2, y, { align: 'center' });
	y += 10;

	doc.setFontSize(12);
	doc.setTextColor(100, 100, 100);
	doc.text(`Tiket: ${ticket.ticketNumber}`, pageWidth / 2, y, { align: 'center' });
	y += 15;

	// === ZÁKLADNÍ INFO ===
	doc.setTextColor(0, 0, 0);
	doc.setFontSize(14);
	doc.setFont('Roboto', 'bold');
	doc.text('Informace o servisu', margin, y);
	y += 8;

	const contact = ticket.customer?.contacts?.[0];
	const customerName = ticket.customer?.companyName || 
		contact?.fullName || 
		ticket.customer?.fullName || 
		'N/A';
	const location = ticket.order?.location;
	const address = location ? `${location.street || ''}, ${location.city || ''} ${location.zip || ''}`.trim() : '—';
	const technicianInfo = ticket.assignedTo 
		? `${ticket.assignedTo.fullName}${ticket.assignedTo.personalNumber ? ` (${ticket.assignedTo.personalNumber})` : ''}`
		: '—';

	const infoData = [
		['Zakázka', ticket.order?.orderNumber || '—'],
		['Zákazník', customerName],
		['Adresa', address],
		['Typ servisu', getTypeLabel(ticket.type)],
		['Kategorie', getCategoryLabel(ticket.category)],
		['Priorita', getPriorityLabel(ticket.priority)],
		['Stav', getStatusLabel(ticket.status)],
		['Technik', technicianInfo],
		['Naplánováno', formatDate(ticket.scheduledAt)],
		['Vyřešeno', formatDate(ticket.resolvedAt)],
	];

	autoTable(doc, {
		startY: y,
		body: infoData,
		theme: 'plain',
		styles: { fontSize: 10, cellPadding: 3, font: 'Roboto' },
		columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
		margin: { left: margin, right: margin },
	});
	y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

	// === POPIS PROBLÉMU ===
	doc.setFontSize(14);
	doc.setFont('Roboto', 'bold');
	doc.text('Popis problému', margin, y);
	y += 8;
	doc.setFontSize(10);
	doc.setFont('Roboto', 'normal');
	const descLines = doc.splitTextToSize(ticket.description, pageWidth - 2 * margin);
	doc.text(descLines, margin, y);
	y += descLines.length * 5 + 10;

	// === DIAGNOSTIKA ===
	if (ticket.diagnosis) {
		if (y > 220) { doc.addPage(); y = 20; }
		doc.setFontSize(14);
		doc.setFont('Roboto', 'bold');
		doc.text('Diagnostika', margin, y);
		y += 8;
		doc.setFontSize(10);
		doc.setFont('Roboto', 'normal');
		const diagLines = doc.splitTextToSize(ticket.diagnosis, pageWidth - 2 * margin);
		doc.text(diagLines, margin, y);
		y += diagLines.length * 5 + 10;
	}

	// === PROVEDENÁ PRÁCE ===
	if (ticket.workPerformed) {
		if (y > 220) { doc.addPage(); y = 20; }
		doc.setFontSize(14);
		doc.setFont('Roboto', 'bold');
		doc.text('Provedená práce', margin, y);
		y += 8;
		doc.setFontSize(10);
		doc.setFont('Roboto', 'normal');
		const workLines = doc.splitTextToSize(ticket.workPerformed, pageWidth - 2 * margin);
		doc.text(workLines, margin, y);
		y += workLines.length * 5 + 10;
	}

	// === POUŽITÝ MATERIÁL ===
	if (ticket.materialsUsed && ticket.materialsUsed.length > 0) {
		if (y > 220) { doc.addPage(); y = 20; }
		doc.setFontSize(14);
		doc.setFont('Roboto', 'bold');
		doc.text('Použitý materiál', margin, y);
		y += 8;

		const materialData = ticket.materialsUsed.map(m => [
			m.name,
			m.quantity.toString(),
			m.price ? `${m.price} Kč` : '—'
		]);

		autoTable(doc, {
			startY: y,
			head: [['Položka', 'Množství', 'Cena']],
			body: materialData,
			theme: 'grid',
			headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
			styles: { fontSize: 10, cellPadding: 3, font: 'Roboto' },
			margin: { left: margin, right: margin },
		});
		y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
	}

	// === ZÁVĚR / ŘEŠENÍ ===
	if (ticket.resolution) {
		if (y > 220) { doc.addPage(); y = 20; }
		doc.setFontSize(14);
		doc.setFont('Roboto', 'bold');
		doc.text('Závěr', margin, y);
		y += 8;
		doc.setFontSize(10);
		doc.setFont('Roboto', 'normal');
		const resLines = doc.splitTextToSize(ticket.resolution, pageWidth - 2 * margin);
		doc.text(resLines, margin, y);
	}

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
export function generateServicePdf(ticket: ServiceTicketData): void {
	const doc = buildServicePdf(ticket);
	const fileName = `servis-${ticket.ticketNumber}.pdf`;
	doc.save(fileName);
}

/**
 * Vrací PDF jako base64 string (pro email)
 */
export function generateServicePdfBase64(ticket: ServiceTicketData): string {
	const doc = buildServicePdf(ticket);
	return doc.output('datauristring').split(',')[1];
}
