"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/card';
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
        if (queryError.message.includes('relation "posts" does not exist')) {
          setConnectionStatus('connected');
          setError('Connected! (No posts table found - this is normal for a new project)');
        } else {
          setConnectionStatus('error');
          setError(queryError.message);
        }
      } else {
        setConnectionStatus('connected');
        setData(result || []);
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <h3 className="text-lg font-semibold">Supabase Connection Test</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
            connectionStatus === 'connected' ? 'bg-green-500' :
            'bg-red-500'
          }`} />
          <span className="text-sm">
            {connectionStatus === 'testing' ? 'Testing connection...' :
             connectionStatus === 'connected' ? 'Connected to Supabase!' :
             'Connection failed'}
          </span>
        </div>
        
        {error && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            {error}
          </div>
        )}
        
        {data.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Found {data.length} records in posts table
          </div>
        )}
        
        <Button 
          onClick={testConnection} 
          size="sm" 
          variant="outline"
          className="w-full"
        >
          Test Again
        </Button>
      </CardContent>
    </Card>
  );
}