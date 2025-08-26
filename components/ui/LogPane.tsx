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
