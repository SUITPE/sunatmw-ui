import { emitInvoice } from '@/api/invoices'
import EmitWizard from './EmitWizard'

export default function EmitInvoicePage() {
  return (
    <EmitWizard
      config={{
        documentType: 'factura',
        title: 'Emitir Factura',
        defaultSeries: 'F001',
        seriesPrefix: 'F',
        defaultCustomerDocType: '6',
        allowedCustomerDocTypes: [
          { value: '6', label: 'RUC' },
          { value: '1', label: 'DNI' },
        ],
        emitFn: emitInvoice,
        emitButtonLabel: 'Emitir a SUNAT',
        emitAnotherLabel: 'Emitir otra factura',
      }}
    />
  )
}
