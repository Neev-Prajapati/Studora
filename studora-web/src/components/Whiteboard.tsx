"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const KonvaCanvas = dynamic(() => import('./KonvaCanvas'), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] rounded-xl min-h-[400px]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )
});

export default function Whiteboard({ fileUrl }: { fileUrl: string }) {
  return <KonvaCanvas fileUrl={fileUrl} />;
}
