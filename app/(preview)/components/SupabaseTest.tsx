"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      setError(null);
      
      // Test the connection by trying to fetch from a simple query
      const { data: result, error: queryError } = await supabase
        .from('posts') // This will fail if table doesn't exist, which is expected
        .select('*')
        .limit(1);

      if (queryError) {
        // If it's a table not found error, that's actually good - it means we're connected
        if (queryError.message.includes('relation "public.posts" does not exist')) {
          setConnectionStatus('connected');
          setError(null);
        } else {
          setConnectionStatus('error');
          setError(queryError.message);
        }
      } else {
        setConnectionStatus('connected');
        setData(result || []);
        setError(null);
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
          connectionStatus === 'connected' ? 'bg-green-500' :
          'bg-red-500'
        }`} />
        <span className="text-sm font-medium">
          {connectionStatus === 'testing' ? 'Testing connection...' :
           connectionStatus === 'connected' ? 'Connected to Supabase!' :
           'Connection failed'}
        </span>
      </div>
      
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {connectionStatus === 'connected' && !error && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-md">
          {data.length > 0 
            ? `Found ${data.length} records in posts table` 
            : 'Connection successful! Ready to use Supabase.'
          }
        </div>
      )}
      
      <Button 
        onClick={testConnection} 
        size="sm" 
        variant="outline"
        className="w-full"
        disabled={connectionStatus === 'testing'}
      >
        {connectionStatus === 'testing' ? 'Testing...' : 'Test Again'}
      </Button>
    </div>
  );
}