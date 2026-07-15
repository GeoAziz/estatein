import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CompareBar from "./CompareBar";
import { PROPERTIES } from "../data/properties";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-base text-white">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" key={pathname} className="animate-page-fade flex-1">
        <Outlet />
      </main>
      <Footer />
      <CompareBar properties={PROPERTIES} />
    </div>
  );
}
