'use client';

import { useState } from 'react';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';

interface SellCondition {
  id: string;
  type: 'price' | 'time' | 'volume';
  operator: 'greater' | 'less' | 'equal';
  value: number;
  action: 'sell_percentage' | 'sell_all';
  percentage?: number;
}

interface ConditionBuilderProps {
  onConditionsChange: (conditions: SellCondition[]) => void;
}

export function ConditionBuilder({ onConditionsChange }: ConditionBuilderProps) {
  const [conditions, setConditions] = useState<SellCondition[]>([]);
  const [newCondition, setNewCondition] = useState<Partial<SellCondition>>({
    type: 'price',
    operator: 'greater',
    action: 'sell_percentage',
    percentage: 50,
  });

  const addCondition = () => {
    if (!newCondition.type || !newCondition.operator || !newCondition.value) return;

    const condition: SellCondition = {
      id: Date.now().toString(),
      type: newCondition.type,
      operator: newCondition.operator,
      value: newCondition.value,
      action: newCondition.action || 'sell_percentage',
      percentage: newCondition.percentage,
    };

    const updatedConditions = [...conditions, condition];
    setConditions(updatedConditions);
    onConditionsChange(updatedConditions);

    // Reset form
    setNewCondition({
      type: 'price',
      operator: 'greater',
      action: 'sell_percentage',
      percentage: 50,
    });
  };

  const removeCondition = (id: string) => {
    const updatedConditions = conditions.filter((c) => c.id !== id);
    setConditions(updatedConditions);
    onConditionsChange(updatedConditions);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sell Conditions</CardTitle>
        <CardDescription>Set up automatic sell conditions for your positions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Conditions */}
        {conditions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Active Conditions</h4>
            {conditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-medium">
                    {condition.type === 'price' && 'Price'}
                    {condition.type === 'time' && 'Time'}
                    {condition.type === 'volume' && 'Volume'}
                  </span>
                  <span className="mx-2">
                    {condition.operator === 'greater' && '>'}
                    {condition.operator === 'less' && '<'}
                    {condition.operator === 'equal' && '='}
                  </span>
                  <span>{condition.value}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    →{' '}
                    {condition.action === 'sell_all' ? 'Sell All' : `Sell ${condition.percentage}%`}
                  </span>
                </div>
                <Button variant="outline" onClick={() => removeCondition(condition.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Condition */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-semibold">Add New Condition</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Condition Type</Label>
              <Select
                value={newCondition.type}
                onValueChange={(value) => setNewCondition({ ...newCondition, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Operator</Label>
              <Select
                value={newCondition.operator}
                onValueChange={(value) =>
                  setNewCondition({ ...newCondition, operator: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater">Greater than</SelectItem>
                  <SelectItem value="less">Less than</SelectItem>
                  <SelectItem value="equal">Equal to</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Value</Label>
            <Input
              type="number"
              value={newCondition.value || ''}
              onChange={(e) =>
                setNewCondition({ ...newCondition, value: parseFloat(e.target.value) })
              }
              placeholder="Enter value"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Action</Label>
              <Select
                value={newCondition.action}
                onValueChange={(value) =>
                  setNewCondition({ ...newCondition, action: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sell_percentage">Sell Percentage</SelectItem>
                  <SelectItem value="sell_all">Sell All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newCondition.action === 'sell_percentage' && (
              <div>
                <Label>Percentage</Label>
                <Input
                  type="number"
                  value={newCondition.percentage || ''}
                  onChange={(e) =>
                    setNewCondition({ ...newCondition, percentage: parseInt(e.target.value) })
                  }
                  placeholder="50"
                  min="1"
                  max="100"
                />
              </div>
            )}
          </div>

          <Button onClick={addCondition} className="w-full">
            Add Condition
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConditionBuilder;
