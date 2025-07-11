import { useState, useEffect } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import { NEXT_PUBLIC_BIRDEYE_API_KEY } from '../constants';

export function useBirdeye(tokenAddr: string) {
  const [metadata, setMetadata] = useState(null);

  const fetchMetadata = debounce(async () => {
    const response = await axios.get(`https://api.birdeye.so/token/${tokenAddr}`, { headers: { 'Authorization': NEXT_PUBLIC_BIRDEYE_API_KEY } });
    setMetadata(response.data);
  }, 500);

  useEffect(() => {
    fetchMetadata();
  }, [tokenAddr]);

  return metadata;
} 