import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { Shipment } from '../shipments/shipment.model';
import { Invoice } from '../billing/invoice.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Shipment) private shipmentModel: typeof Shipment,
    @InjectModel(Invoice)  private invoiceModel: typeof Invoice,
  ) {}

  async generateLorryReceipt(shipmentId: string, res: Response): Promise<void> {
    const shipment = await this.shipmentModel.findByPk(shipmentId, {
      include: [Vehicle, Driver],
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LR-${shipment.trackingNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('LORRY RECEIPT (e-Bilty)', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text('FreightTrack Logistics Pvt. Ltd.', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // LR details
    this.addRow(doc, 'LR Number',      shipment.trackingNumber);
    this.addRow(doc, 'Date',           new Date().toLocaleDateString('en-IN'));
    this.addRow(doc, 'Vehicle No.',    shipment.vehicle?.regNumber || '—');
    this.addRow(doc, 'Driver',         shipment.driver?.name || '—');
    this.addRow(doc, 'Driver Phone',   shipment.driver?.phone || '—');
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // Route
    doc.fontSize(11).font('Helvetica-Bold').text('Route Details');
    doc.moveDown(0.3);
    this.addRow(doc, 'From',          shipment.origin);
    this.addRow(doc, 'To',            shipment.destination);
    this.addRow(doc, 'Scheduled Pickup', shipment.scheduledPickup?.toLocaleDateString('en-IN') || '—');
    this.addRow(doc, 'Est. Delivery',    shipment.estimatedDelivery?.toLocaleDateString('en-IN') || '—');
    doc.moveDown(0.5);

    // Cargo
    doc.fontSize(11).font('Helvetica-Bold').text('Cargo Details');
    doc.moveDown(0.3);
    this.addRow(doc, 'Description',   shipment.cargoDescription || '—');
    this.addRow(doc, 'Weight',        `${shipment.weightMT} MT`);
    this.addRow(doc, 'Truck Type',    shipment.truckType || '—');
    this.addRow(doc, 'Insurance',     shipment.insuranceEnabled ? `Enabled — ₹${(shipment.insuranceCoverage || 0).toLocaleString('en-IN')} coverage` : 'Not insured');
    doc.moveDown(0.5);

    // Consignee
    doc.fontSize(11).font('Helvetica-Bold').text('Consignee Details');
    doc.moveDown(0.3);
    this.addRow(doc, 'Name',  shipment.consigneeName || '—');
    this.addRow(doc, 'Phone', shipment.consigneePhone || '—');
    doc.moveDown(0.5);

    // Freight
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    this.addRow(doc, 'Freight Amount', `₹${(shipment.quotedAmount || 0).toLocaleString('en-IN')}`);
    doc.moveDown(1);

    doc.fontSize(9).font('Helvetica').fillColor('grey')
      .text('This is a computer-generated document. Subject to terms & conditions of FreightTrack.', { align: 'center' });

    doc.end();
  }

  async generatePODReceipt(shipmentId: string, res: Response): Promise<void> {
    const shipment = await this.shipmentModel.findByPk(shipmentId, { include: [Vehicle, Driver] });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (!shipment.podCapturedAt) throw new NotFoundException('POD not yet captured');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=POD-${shipment.trackingNumber}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('PROOF OF DELIVERY', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    this.addRow(doc, 'Tracking Number',  shipment.trackingNumber);
    this.addRow(doc, 'Delivered On',     shipment.podCapturedAt.toLocaleString('en-IN'));
    this.addRow(doc, 'Vehicle',          shipment.vehicle?.regNumber || '—');
    this.addRow(doc, 'Driver',           shipment.driver?.name || '—');
    this.addRow(doc, 'From',             shipment.origin);
    this.addRow(doc, 'To',               shipment.destination);
    this.addRow(doc, 'Cargo',            `${shipment.cargoDescription} — ${shipment.weightMT} MT`);
    this.addRow(doc, 'Consignee',        shipment.consigneeName || '—');
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').text('Delivery Status: DELIVERED', { align: 'center' });
    if (shipment.podImageUrl) {
      doc.moveDown(0.5).fontSize(10).font('Helvetica').text(`POD Image: ${shipment.podImageUrl}`);
    }

    doc.end();
  }

  async generateInvoicePDF(invoiceId: string, res: Response): Promise<void> {
    const invoice = await this.invoiceModel.findByPk(invoiceId, { include: [Shipment] });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=INV-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text('FreightTrack Logistics Pvt. Ltd. | GSTIN: 36AABCF1234A1ZX', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    this.addRow(doc, 'Invoice No.',   invoice.invoiceNumber);
    this.addRow(doc, 'Invoice Date',  invoice.invoiceDate?.toLocaleDateString('en-IN') || new Date().toLocaleDateString('en-IN'));
    this.addRow(doc, 'Due Date',      invoice.dueDate?.toLocaleDateString('en-IN') || '—');
    this.addRow(doc, 'LR Number',     invoice.shipment?.trackingNumber || '—');
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
    doc.fontSize(10).font('Helvetica')
      .text(invoice.consigneeName || '—')
      .text(`GSTIN: ${invoice.consigneeGstin || '—'}`)
      .text(invoice.consigneeAddress || '—');
    doc.moveDown(0.5);

    // Charges table
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    const charges = [
      ['Freight charges',    invoice.freightAmount],
      ['Detention charges',  invoice.detentionAmount],
      ['Toll charges',       invoice.tollAmount],
      ['Insurance',          invoice.insuranceAmount],
      ['Other charges',      invoice.otherCharges],
    ];
    charges.filter(([, v]) => (v as number) > 0).forEach(([label, val]) => {
      this.addRow(doc, label as string, `₹${(val as number).toLocaleString('en-IN')}`);
    });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    this.addRow(doc, 'Subtotal',          `₹${(invoice.subtotal || 0).toLocaleString('en-IN')}`);
    if (invoice.cgst) this.addRow(doc, `CGST (${invoice.gstRate / 2}%)`, `₹${invoice.cgst}`);
    if (invoice.sgst) this.addRow(doc, `SGST (${invoice.gstRate / 2}%)`, `₹${invoice.sgst}`);
    if (invoice.igst) this.addRow(doc, `IGST (${invoice.gstRate}%)`,     `₹${invoice.igst}`);
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica-Bold');
    this.addRow(doc, 'TOTAL AMOUNT', `₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}`);

    doc.end();
  }

  private addRow(doc: any, label: string, value: string) {
    doc.fontSize(10).font('Helvetica-Bold').text(label + ':', { continued: true, width: 180 });
    doc.font('Helvetica').text('  ' + value);
  }
}
