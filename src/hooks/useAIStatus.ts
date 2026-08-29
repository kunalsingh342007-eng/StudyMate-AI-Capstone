import { useState, useEffect } from 'react';
import { ApiClient } from '../services/api/apiClient';
import { AIStatus } from '../types';

export function useAIStatus() {
  const [status, setStatus] = useState<AIStatus>({
    isConfigured: false,
    provider: 'Anthropic Claude',
    model: 'claude-3-5-sonnet-20241022',
    status: 'missing_api_key',
    message: 'Checking Claude API connection status...',
  });
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await ApiClient.getStatus();
      setStatus(res);
    } catch {
      setStatus({
        isConfigured: false,
        provider: 'Anthropic Claude',
        model: 'claude-3-5-sonnet-20241022',
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
