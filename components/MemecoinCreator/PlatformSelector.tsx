import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PlatformSelector({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select Platform" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Raydium">Raydium</SelectItem>
        <SelectItem value="Pump.fun">Pump.fun</SelectItem>
        <SelectItem value="LetsBonk.fun">LetsBonk.fun</SelectItem>
        <SelectItem value="Moonshot">Moonshot</SelectItem>
      </SelectContent>
    </Select>
  );
} 