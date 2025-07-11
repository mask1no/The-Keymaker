import React from 'react';
import { LineChart, Line, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default React.memo(function AnalyticsPanel() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch prices from Jupiter
    setData([{ time: '1', price: 100 }, { time: '2', price: 120 }]);
  }, []);

  const exportCSV = () => {
    // CSV export logic
  };

  return (
    <Card>
      <CardContent>
        <LineChart width={300} height={200} data={data}>
          <Line type="monotone" dataKey="price" stroke="#8884d8" />
          <XAxis dataKey="time" />
          <YAxis />
        </LineChart>
        <Button onClick={exportCSV}>Export to CSV</Button>
      </CardContent>
    </Card>
  );
}); 