import EmitNotePage from './EmitNotePage'
import type { EmitNotePageConfig } from './EmitNotePage'
import { emitCreditNote } from '@/api/notes'

const CREDIT_NOTE_MOTIVOS = [
  { code: '01', label: 'Anulacion de la operacion' },
  { code: '02', label: 'Anulacion por error en el RUC' },
  { code: '03', label: 'Correccion por error en la descripcion' },
  { code: '04', label: 'Descuento global' },
  { code: '05', label: 'Descuento por item' },
  { code: '06', label: 'Devolucion total' },
  { code: '07', label: 'Devolucion por item' },
  { code: '08', label: 'Bonificacion' },
  { code: '09', label: 'Disminucion en el valor' },
  { code: '10', label: 'Otros conceptos' },
]

const config: EmitNotePageConfig = {
  title: 'Emitir Nota de Credito',
  subtitle: 'Emita una nota de credito electronica vinculada a un documento existente',
  noteTypeName: 'Nota de Credito',
  motivoLabel: 'Motivo (Catalogo 09)',
  motivoOptions: CREDIT_NOTE_MOTIVOS,
  emitFn: emitCreditNote,
  resetButtonLabel: 'Emitir otra nota de credito',
}

export default function EmitCreditNotePage() {
  return <EmitNotePage config={config} />
}
