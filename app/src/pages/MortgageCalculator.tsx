import { useMemo, useState } from "react";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";

const TIPS = [
  { title: "Improve Your Credit Score", description: "A higher credit score typically unlocks lower interest rates, which can save you thousands over the life of your loan." },
  { title: "Maximize Your Down Payment", description: "Putting more down reduces your loan amount, your monthly payment, and can help you avoid private mortgage insurance." },
  { title: "Lock in Your Rate Early", description: "Rates can move quickly — locking in once you have an offer accepted protects you from rate increases during closing." },
];

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState(450000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);

  const results = useMemo(() => {
    const downPayment = homePrice * (downPaymentPct / 100);
    const loanAmount = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    const monthlyPayment =
      monthlyRate === 0
        ? loanAmount / numPayments
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalPaid = monthlyPayment * numPayments;
    const totalInterest = totalPaid - loanAmount;

    return { downPayment, loanAmount, monthlyPayment, totalPaid, totalInterest };
  }, [homePrice, downPaymentPct, interestRate, loanTerm]);

  const principalShare = Math.round((results.loanAmount / (results.loanAmount + results.totalInterest)) * 100) || 0;

  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Calculate Your Monthly Payment"
          paragraph="Use our mortgage calculator to estimate your monthly payments based on home price, down payment, interest rate, and loan term."
        />
      </Section>

      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-8 rounded-xl border border-border p-6 md:p-10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Home Price</span>
                <span className="text-white">{formatCurrency(homePrice)}</span>
              </div>
              <input
                type="range"
                min={50000}
                max={2000000}
                step={5000}
                value={homePrice}
                onChange={(e) => setHomePrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Down Payment</span>
                <span className="text-white">
                  {downPaymentPct}% ({formatCurrency(results.downPayment)})
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Interest Rate</span>
                <span className="text-white">{interestRate.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-muted">Loan Term</span>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white focus:outline-none"
              >
                {[15, 20, 30].map((term) => (
                  <option key={term} value={term} className="bg-base text-white">
                    {term} Years
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-10">
            <div className="flex flex-col gap-1 border-b border-border pb-6">
              <span className="text-sm text-muted">Estimated Monthly Payment</span>
              <span className="text-4xl font-bold text-primary-text sm:text-5xl">
                {formatCurrency(results.monthlyPayment)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Loan Amount</span>
                <span className="text-lg font-semibold text-white">{formatCurrency(results.loanAmount)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Down Payment</span>
                <span className="text-lg font-semibold text-white">{formatCurrency(results.downPayment)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Total Interest Paid</span>
                <span className="text-lg font-semibold text-white">{formatCurrency(results.totalInterest)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Total Amount Paid</span>
                <span className="text-lg font-semibold text-white">{formatCurrency(results.totalPaid)}</span>
              </div>
            </div>
            <PrimaryButton to="/contact" className="mt-2 w-full">
              Get Pre-Qualified
            </PrimaryButton>
          </div>
        </div>
      </Section>

      {/* Breakdown */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Understanding Your Payment"
          paragraph="Your monthly payment is primarily made up of principal and interest. Taxes and insurance vary by location and lender and aren't included in this estimate."
        />
        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-border">
            <div className="bg-primary" style={{ width: `${principalShare}%` }} />
            <div className="bg-white/20" style={{ width: `${100 - principalShare}%` }} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-8">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-base text-white">Principal ({principalShare}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-white/20" />
            <span className="text-base text-white">Interest ({100 - principalShare}%)</span>
          </div>
        </div>
      </Section>

      {/* Tips */}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIPS.map((tip) => (
            <div key={tip.title} className="flex flex-col gap-3 rounded-xl border border-border p-6 md:p-8">
              <h3 className="text-lg font-semibold text-white">{tip.title}</h3>
              <p className="text-base leading-relaxed text-muted">{tip.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTASection />
    </>
  );
}
