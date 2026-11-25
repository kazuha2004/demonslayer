import { characters, demons } from "@/data/content";
import BladeExperience from "@/components/BladeExperience";
import EntityShowcase from "@/components/EntityShowcase";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Section from "@/components/Section";
import SectionBackdrop from "@/components/SectionBackdrop";
import WorldSection from "@/components/WorldSection";

export default function HomePage() {
  return (
    <SectionBackdrop>
      <Section id="hero" first labelledBy="hero-title">
        <Hero />
      </Section>
      <Section id="world" labelledBy="world-section-title" entryDirection="left">
        <WorldSection />
      </Section>

      <Section id="characters" labelledBy="characters-title" allowVerticalMovement={false}>
        <EntityShowcase entities={characters} theme="characters" />
      </Section>

      <Section id="blade" labelledBy="blades-title">
        <BladeExperience />
      </Section>

      <Section id="demons" labelledBy="demons-title">
        <EntityShowcase entities={demons} theme="demons" />
      </Section>

      <Section id="footer" last labelledBy="footer-title">
        <Footer />
      </Section>
    </SectionBackdrop>
  );
}
