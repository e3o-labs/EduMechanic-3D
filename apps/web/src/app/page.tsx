'use client';

import dynamic from 'next/dynamic';
import { Header } from '../components/ui/Header';
import { DrawerPanel } from '../components/ui/DrawerPanel';
import { PresetModal } from '../components/ui/PresetModal';
import { PortfolioModal } from '../components/ui/PortfolioModal';

// Dynamically import Three.js / R3F Viewport to prevent SSR canvas issues
const CanvasViewport = dynamic(
  () => import('../components/3d/CanvasViewport').then((mod) => mod.CanvasViewport),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        <CanvasViewport />
        <DrawerPanel />
      </main>
      <PresetModal />
      <PortfolioModal />
    </>
  );
}
