import { vi } from "vitest";

/**
 * There is no live Postgres instance in this environment/CI to run
 * migrations against, so these smoke tests mock the Prisma client at the
 * module boundary rather than hitting a real database. This still exercises
 * the full Express middleware chain, validation, auth, and controller logic
 * — only the persistence layer is stubbed.
 */
function model() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  };
}

export const prismaMock = {
  user: model(),
  agent: model(),
  property: model(),
  listing: model(),
  inquiry: model(),
  favorite: model(),
  savedSearch: model(),
  contactMessage: model(),
  errorLog: model(),
  analyticsEvent: model(),
  notification: model(),
  activityLog: model(),
  otpCode: model(),
  agentAvailabilitySlot: model(),
  twoFactorBackupCode: model(),
  school: model(),
  neighborhood: model(),
  estate: model(),
  payment: model(),
  $transaction: vi.fn(),
};

export function resetPrismaMock() {
  for (const [key, m] of Object.entries(prismaMock)) {
    if (key === "$transaction") {
      (m as ReturnType<typeof vi.fn>).mockReset();
      // Default: run the transaction callback against the same mock client.
      (m as ReturnType<typeof vi.fn>).mockImplementation((cb: any) => cb(prismaMock));
      continue;
    }
    for (const fn of Object.values(m)) {
      (fn as ReturnType<typeof vi.fn>).mockReset();
    }
  }
}
