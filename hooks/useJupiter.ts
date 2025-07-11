import { useState, useEffect } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import { NEXT_PUBLIC_JUPITER_API_KEY } from '../constants';

export function useJupiter(token: string) {
  const [price, setPrice] = useState(0);

  const fetchPrice = debounce(async () => {
    const response = await axios.get(`https://api.jup.ag/price/${token}`, { headers: { 'Authorization': NEXT_PUBLIC_JUPITER_API_KEY } });
    setPrice(response.data.price);
  }, 500);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return price;
} 