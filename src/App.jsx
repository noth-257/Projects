import { useEffect } from 'react';
import { useStore } from './store/useStore';
import AppLayout from './layouts/AppLayout';

export default function App() {
  const init = useStore((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return <AppLayout />;
}
