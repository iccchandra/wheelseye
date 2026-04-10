import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('lr/:shipmentId')
  @ApiOperation({ summary: 'Download Lorry Receipt (e-Bilty) PDF' })
  async downloadLR(@Param('shipmentId') id: string, @Res() res: Response) {
    return this.documentsService.generateLorryReceipt(id, res);
  }

  @Get('pod/:shipmentId')
  @ApiOperation({ summary: 'Download Proof of Delivery PDF' })
  async downloadPOD(@Param('shipmentId') id: string, @Res() res: Response) {
    return this.documentsService.generatePODReceipt(id, res);
  }

  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Download GST Tax Invoice PDF' })
  async downloadInvoice(@Param('invoiceId') id: string, @Res() res: Response) {
    return this.documentsService.generateInvoicePDF(id, res);
  }
}
