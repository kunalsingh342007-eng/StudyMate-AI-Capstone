import { useState, useEffect } from 'react';
import { ApiClient } from '../services/api/apiClient';
import { AIStatus } from '../types';

export function useAIStatus() {
  const [status, setStatus] = useState<AIStatus>({
    isConfigured: false,
    provider: 'Google Gemini',
     model: 'gemini-3.7-flash',
    status: 'missing_api_key',
    message: 'Checking Google Gemini API connection status...',
  });
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await ApiClient.getStatus();
      setStatus(res);
    } catch {
      setStatus({
        isConfigured: false,
        provider: 'Google Gemini',
        model: 'gemini-3.7-flash',
        status: 'error',
        message: 'Could not connect to API status endpoint.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { status, loading, refetch: checkStatus };
}
