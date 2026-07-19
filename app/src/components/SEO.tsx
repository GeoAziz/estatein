import { useEffect } from "react";

export default function SEO({
  title = "Estatein",
  description = "Discover Your Dream Property with Estatein. Browse properties for sale, rent, and investment opportunities.",
  canonical,
  image,
  jsonLd,
}: {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  jsonLd?: object | object[];
}) {
  useEffect(() => {
    const fullTitle = title === "Estatein" ? title : `${title} | Estatein`;
    document.title = fullTitle;

    function setMeta(name: string, content: string) {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    }

    function setProperty(prop: string, content: string) {
      let tag = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    }

    setMeta("description", description);
    setProperty("og:title", fullTitle);
    setProperty("og:description", description);
    setProperty("og:type", "website");
    setProperty("og:site_name", "Estatein");

    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);

    if (image) {
      setProperty("og:image", image);
      setMeta("twitter:image", image);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
      setProperty("og:url", canonical);
    }

    const injectedScripts: HTMLScriptElement[] = [];
    if (jsonLd) {
      const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const entry of entries) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(entry);
        document.head.appendChild(script);
        injectedScripts.push(script);
      }
    }

    return () => {
      document.title = "Estatein";
      for (const script of injectedScripts) {
        script.remove();
      }
    };
  }, [title, description, canonical, image, jsonLd]);

  return null;
}
