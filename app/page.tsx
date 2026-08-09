import Link from "next/link";
import { Sparkles, Brain, FileCheck, Waypoints, Clapperboard, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";

const tools = [
  {
    icon: Brain,
    label: "Flashcards",
    text: "text-tool-flashcards",
    bg: "bg-tool-flashcards/10",
    desc: "Question/answer decks you flip through, generated straight from your material.",
  },
  {
    icon: FileCheck,
    label: "Quiz",
    text: "text-tool-quiz",
    bg: "bg-tool-quiz/10",
    desc: "Multiple-choice checks with explanations, scored as you go.",
  },
  {
    icon: Waypoints,
    label: "Visual Map",
    text: "text-tool-visual",
    bg: "bg-tool-visual/10",
    desc: "A step-by-step concept map for ideas that build on each other.",
  },
  {
    icon: Clapperboard,
    label: "Storyboard",
    text: "text-tool-storyboard",
    bg: "bg-tool-storyboard/10",
    desc: "A scene-by-scene script for explaining the concept out loud.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="gradient-warm">
        <PageContainer className="flex flex-col items-center gap-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-700">
            <Sparkles className="h-4 w-4" />
            Your notes, one upload away from four study tools
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Upload a PDF. Get a whole study kit back.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Drop in lecture notes, a textbook chapter, or a slide deck. FlashGenie reads it, then
            you can ask it questions or turn it into flashcards, a quiz, a visual concept map, or a
            storyboard — in one workspace.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start for free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </PageContainer>
      </section>

      {/* How it works */}
      <section className="py-20">
        <PageContainer>
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-foreground">
              One source, four ways to study it
            </h2>
            <p className="mt-2 text-muted-foreground">
              Upload once. Generate whichever format fits how you learn best.
            </p>
          </div>

          <div className="mb-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 card-shadow">
              <UploadCloud className="h-4 w-4 text-primary" />
              PDF, DOCX, or TXT in
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className="rounded-xl border border-border bg-card p-6 card-shadow"
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t.label}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/40 py-16">
        <PageContainer className="flex flex-col items-center gap-4 text-center">
          <h2 className="font-display text-2xl font-semibold text-foreground">Ready to study smarter?</h2>
          <Button asChild size="lg">
            <Link href="/signup">Create your free account</Link>
          </Button>
        </PageContainer>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FlashGenie. All rights reserved.
      </footer>
    </>
  );
}
