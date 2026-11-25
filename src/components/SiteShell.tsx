"use client";

import type { ReactNode } from "react";
import CustomCursor from "@/components/CustomCursor";
import GrainOverlay from "@/components/GrainOverlay";
import LoadingScreen from "@/components/LoadingScreen";
import Navigation from "@/components/Navigation";
import SakuraPetals from "@/components/SakuraPetals";
import SmoothScroll from "@/components/SmoothScroll";

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <div className="site-frame">
        <Navigation />
        <main>{children}</main>
        <SakuraPetals />
        <GrainOverlay />
      </div>
      <CustomCursor />
      <LoadingScreen />
    </SmoothScroll>
  );
}
