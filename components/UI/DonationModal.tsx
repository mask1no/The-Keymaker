import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog'
import { Button } from '@/components/UI/button'
interface DonationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function DonationModal({ open, onOpenChange }: DonationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/30 backdrop-blur border border-white/10">
        <DialogHeader>
          <DialogTitle>Support The Keymaker</DialogTitle>
        </DialogHeader>
        <p>
          Send SOL to: <span className="text-aqua">keymaker.sol</span>
        </p>
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  )
}
