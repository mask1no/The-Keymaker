import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PlatformSelector from './PlatformSelector';

export default function TokenForm() {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [supply, setSupply] = useState(1000000000);
  const [image, setImage] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [x, setX] = useState('');
  const [platform, setPlatform] = useState('Raydium');

  const handlePreview = () => {
    console.log({ name, ticker, supply, image, telegram, website, x, platform });
  };

  const handleDeploy = async () => {
    // Call service based on platform
  };

  const handleClone = () => {
    // Open clone modal
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memecoin Creator</CardTitle>
      </CardHeader>
      <CardContent>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <Input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="Ticker" />
        <Input type="number" value={supply} onChange={e => setSupply(parseInt(e.target.value))} placeholder="Supply" />
        <Input value={image} onChange={e => setImage(e.target.value)} placeholder="Image URL" />
        <Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="Telegram" />
        <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website" />
        <Input value={x} onChange={e => setX(e.target.value)} placeholder="X.com" />
        <PlatformSelector value={platform} onChange={setPlatform} />
        <Button onClick={handlePreview}>Preview Token</Button>
        <Button onClick={handleDeploy}>Deploy Token</Button>
        <Button onClick={handleClone}>Clone Token</Button>
      </CardContent>
    </Card>
  );
} 