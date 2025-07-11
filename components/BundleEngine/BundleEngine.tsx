import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactGridLayout from 'react-grid-layout';
import { buildBundle, previewBundle, executeBundle } from '../../services/bundleService';

export default React.memo(function BundleEngine() {
  const [txs, setTxs] = useState([]);
  const [memecoinAddr, setMemecoinAddr] = useState('');
  const [amount, setAmount] = useState(0);
  const [slippage, setSlippage] = useState(5);

  const handleAddTx = () => {
    // Add buy/sell/sniping tx placeholder
    setTxs([...txs, { memecoinAddr, amount, slippage }]);
  };

  const handlePreview = async () => {
    const preview = await previewBundle(txs);
    console.log(preview);
  };

  const handleExecute = async () => {
    await executeBundle(txs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundle Engine</CardTitle>
      </CardHeader>
      <CardContent>
        <Input value={memecoinAddr} onChange={e => setMemecoinAddr(e.target.value)} placeholder="Memecoin Address" />
        <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} placeholder="Amount" />
        <Input type="number" value={slippage} onChange={e => setSlippage(parseFloat(e.target.value))} placeholder="Slippage" />
        <Button onClick={handleAddTx}>Add Transaction</Button>
        <ReactGridLayout className="layout" cols={1} rowHeight={30} width={300}>
          {txs.map((tx, i) => (
            <div key={i}>Tx {i+1}: {tx.memecoinAddr}</div>
          ))}
        </ReactGridLayout>
        <Button onClick={handlePreview}>Preview Bundle</Button>
        <Button onClick={handleExecute}>Execute Bundle</Button>
      </CardContent>
    </Card>
  );
}); 