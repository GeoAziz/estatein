import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement IntersectionObserver; DashboardLayout (and anything
// using scroll-spy-style nav highlighting) needs a stub to mount in tests.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as any).IntersectionObserver = IntersectionObserverStub;
