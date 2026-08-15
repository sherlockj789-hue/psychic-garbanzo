"use client";

import { NavProvider, useNav } from "@/lib/nav";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { FloatingTeacher } from "@/components/site/floating-teacher";
import { HomeView } from "@/components/views/home";
import { CareersView } from "@/components/views/careers";
import { CareerDetailView } from "@/components/views/career-detail";
import { GradeView } from "@/components/views/grade";
import { LessonView } from "@/components/views/lesson";
import { SimView } from "@/components/views/sim";
import { SkillsView } from "@/components/views/skills";
import { ManifestoView } from "@/components/views/manifesto";

function Router() {
  const { route } = useNav();

  let view: React.ReactNode;
  switch (route.name) {
    case "home": view = <HomeView />; break;
    case "careers": view = <CareersView initialGroup={route.group} initialQ={route.q} />; break;
    case "career": view = <CareerDetailView slug={route.slug} />; break;
    case "grade": view = <GradeView slug={route.slug} grade={route.grade} />; break;
    case "lesson": view = <LessonView key={`${route.slug}-${route.grade}-${route.lesson}`} slug={route.slug} grade={route.grade} lesson={route.lesson} />; break;
    case "sim": view = <SimView key={route.slug} slug={route.slug} />; break;
    case "skills": view = <SkillsView />; break;
    case "skill": view = <SkillsView key={route.slug} initialSlug={route.slug} />; break;
    case "manifesto": view = <ManifestoView />; break;
    default: view = <HomeView />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{view}</main>
      <SiteFooter />
      <FloatingTeacher />
    </div>
  );
}

export default function Home() {
  return (
    <NavProvider>
      <Router />
    </NavProvider>
  );
}
