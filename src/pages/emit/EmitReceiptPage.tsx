import { emitReceipt } from '@/api/invoices'
import EmitWizard from './EmitWizard'

export default function EmitReceiptPage() {
  return (
    <EmitWizard
      config={{
        documentType: 'boleta',
        title: 'Emitir Boleta de Venta',
        defaultSeries: 'B001',
        seriesPrefix: 'B',
        defaultCustomerDocType: '1',
        allowedCustomerDocTypes: [
          { value: '1', label: 'DNI' },
          { value: '6', label: 'RUC' },
        ],
        emitFn: emitReceipt,
        emitButtonLabel: 'Emitir a SUNAT',
        emitAnotherLabel: 'Emitir otra boleta',
      }}
    />
  )
}
