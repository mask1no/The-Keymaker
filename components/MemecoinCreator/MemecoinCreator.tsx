'use client';
import React, { useState } from 'react';
import TokenForm from './TokenForm';
import PlatformSelector from './PlatformSelector';
import CloneTokenModal from './CloneTokenModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';

export default function MemecoinCreator() {
  const [platform, setPlatform] = useState('Raydium');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memecoin Creator</CardTitle>
      </CardHeader>
      <CardContent>
        <PlatformSelector onChange={setPlatform} />
        <TokenForm />
        <CloneTokenModal platform={platform} />
      </CardContent>
    </Card>
  );
} 