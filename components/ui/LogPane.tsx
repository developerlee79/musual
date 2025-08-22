'use client';
import React from 'react';

export function useLogs() {
  const [logs, setLogs] = React.useState<string[]>([]);
  const log = React.useCallback((msg: string) => {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  }, []);
  const clear = React.useCallback(() => setLogs([]), []);
  return { logs, log, clear };
}

export const LogPane: React.FC<{ logs: string[] }>= ({ logs }) => (
  <div className="card" style={{ maxHeight: 220, overflow: 'auto' }}>
    <div style={{ fontWeight: 700, color:'#9cf', marginBottom:8 }}>Logs</div>
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color:'#bde', fontSize:12 }}>
      {logs.length ? logs.join('\n') : 'No logs yet.'}
    </pre>
  </div>
); 