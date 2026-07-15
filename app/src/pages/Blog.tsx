import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";
import { BLOG_CATEGORIES, BLOG_POSTS, FEATURED_BLOG_POST } from "../data/content";
import heroLifestyle from "../assets/img/hero-lifestyle.jpg";

export default function Blog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOG_POSTS.filter((post) => {
      if (category && post.category !== category) return false;
      if (!q) return true;
      return post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q);
    });
  }, [query, category]);

  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading align="center" title="Estatein Blog" paragraph="Real estate insights & tips from our team of experts." />
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-border px-5 py-4">
          <Search className="shrink-0 text-subtle" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search blog posts"
            className="w-full bg-transparent text-base text-white placeholder:text-subtle focus:outline-none"
          />
        </div>
      </Section>

      {/* Featured article */}
      <Section className="border-t border-border">
        <a href="#" className="grid grid-cols-1 gap-8 rounded-xl border border-border p-6 md:p-10 lg:grid-cols-2 lg:items-center">
          <img
            src={heroLifestyle}
            alt={FEATURED_BLOG_POST.title}
            className="h-[240px] w-full rounded-lg object-cover lg:h-[340px]"
          />
          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary-text">
              {FEATURED_BLOG_POST.category}
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">{FEATURED_BLOG_POST.title}</h2>
            <p className="text-base leading-relaxed text-muted lg:text-lg">{FEATURED_BLOG_POST.excerpt}</p>
            <div className="flex items-center gap-3 text-sm text-muted">
              <span className="text-white">{FEATURED_BLOG_POST.author}</span>
              <span>·</span>
              <span>{FEATURED_BLOG_POST.readTime}</span>
              <span>·</span>
              <span>{FEATURED_BLOG_POST.date}</span>
            </div>
            <span className="text-base font-medium text-white underline underline-offset-4 hover:text-primary-text">
              Read More
            </span>
          </div>
        </a>
      </Section>

      {/* Grid + categories */}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_240px]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {filtered.map((post) => (
              <a key={post.slug} href="#" className="flex flex-col gap-4 rounded-xl border border-border p-6">
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-text">
                  {post.category}
                </span>
                <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                <p className="text-base leading-relaxed text-muted">{post.excerpt}</p>
                <div className="mt-auto flex items-center gap-2 text-sm text-muted">
                  <span className="text-white">{post.author}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </a>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-base text-muted">
                No articles match your search — try another term or category.
              </p>
            )}
          </div>

          <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-white">Categories</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setCategory(null)}
                className={`rounded-lg px-3 py-2 text-left text-base ${category === null ? "bg-primary/10 text-primary-text" : "text-muted hover:text-white"}`}
              >
                All
              </button>
              {BLOG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg px-3 py-2 text-left text-base ${category === cat ? "bg-primary/10 text-primary-text" : "text-muted hover:text-white"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
