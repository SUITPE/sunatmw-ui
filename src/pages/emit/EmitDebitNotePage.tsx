import EmitNotePage from './EmitNotePage'
import type { EmitNotePageConfig } from './EmitNotePage'
import { emitDebitNote } from '@/api/notes'

const DEBIT_NOTE_MOTIVOS = [
  { code: '01', label: 'Intereses por mora' },
  { code: '02', label: 'Aumento en el valor' },
  { code: '03', label: 'Penalidades / otros conceptos' },
]

const config: EmitNotePageConfig = {
  title: 'Emitir Nota de Debito',
  subtitle: 'Emita una nota de debito electronica vinculada a un documento existente',
  noteTypeName: 'Nota de Debito',
  motivoLabel: 'Motivo (Catalogo 10)',
  motivoOptions: DEBIT_NOTE_MOTIVOS,
  emitFn: emitDebitNote,
  resetButtonLabel: 'Emitir otra nota de debito',
}

export default function EmitDebitNotePage() {
  return <EmitNotePage config={config} />
}
