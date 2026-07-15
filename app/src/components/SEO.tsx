import { useEffect } from "react";

export default function SEO({
  title = "Estatein",
  description = "Discover Your Dream Property with Estatein. Browse properties for sale, rent, and investment opportunities.",
  canonical,
  image,
}: {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
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

    if (image) {
      setProperty("og:image", image);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    return () => {
      document.title = "Estatein";
    };
  }, [title, description, canonical, image]);

  return null;
}
