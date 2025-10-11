'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Badge } from '@/components/UI/badge';

interface TokenTemplate {
  name: string;
  symbol: string;
  decimals: number;
  description?: string;
  website?: string;
  twitter?: string;
}

interface TokenLibraryProps {
  onPick: (token: TokenTemplate) => void;
}

const tokenTemplates: TokenTemplate[] = [
  {
    name: 'Meme Coin',
    symbol: 'MEME',
    decimals: 9,
    description: 'A fun meme token',
    website: 'https://memecoin.com',
    twitter: 'https://twitter.com/memecoin',
  },
  {
    name: 'Utility Token',
    symbol: 'UTIL',
    decimals: 9,
    description: 'A utility token for ecosystem',
    website: 'https://utility.com',
  },
  {
    name: 'Governance Token',
    symbol: 'GOV',
    decimals: 9,
    description: 'Token for governance voting',
    website: 'https://governance.com',
  },
];

export default function TokenLibrary({ onPick }: TokenLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TokenTemplate | null>(null);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Token Templates</CardTitle>
        <CardDescription>
          Choose from pre-configured token templates or create your own
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tokenTemplates.map((template, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-colors ${
                selectedTemplate?.symbol === template.symbol
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedTemplate(template);
                onPick(template);
              }}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="secondary">{template.symbol}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="text-xs text-gray-500">Decimals: {template.decimals}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTemplate && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg">
            <h4 className="font-semibold mb-2">Selected Template: {selectedTemplate.name}</h4>
            <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              Symbol: {selectedTemplate.symbol} | Decimals: {selectedTemplate.decimals}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
