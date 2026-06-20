import { useEffect, useState } from 'react';
import api from '../api/client.js';
export default function useFetch(url, fallback = []) {
  const [data, setData] = useState(fallback);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState('');
  const reload = () => {
    if (!url) { setData(fallback); setMeta(null); setLoading(false); return; }
    setLoading(true); setError('');
    api.get(url).then(r => {
      setData(r.data.data);
      setMeta(r.data.meta || null);
    }).catch(e => setError(e.response?.data?.message || e.message)).finally(() => setLoading(false));
  };
  useEffect(reload, [url]);
  return { data, meta, loading, error, reload, refetch: reload };
}
