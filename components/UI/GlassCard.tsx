import { Card, CardContent } from '@/components/ui/card';

export default function GlassCard({ children }) {
  return (
    <Card className="border border-white/10 rounded-2xl shadow-xl bg-gradient-to-br from-green-900 to-black backdrop-blur-md">
      <CardContent>{children}</CardContent>
    </Card>
  );
} 