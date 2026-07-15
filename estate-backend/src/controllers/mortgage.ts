import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { sendSuccess } from "../utils/response.js";

export async function getRates(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rates = await prisma.mortgageRate.findMany({
      orderBy: [{ loanType: "asc" }, { termYears: "asc" }],
    });

    sendSuccess(res, { rates });
  } catch (err) {
    next(err);
  }
}

export async function calculateMortgage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { homePrice, downPaymentPercent, interestRate, loanTermYears } = req.body;

    const downPayment = homePrice * (downPaymentPercent / 100);
    const loanAmount = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTermYears * 12;

    const monthlyPayment =
      monthlyRate === 0
        ? loanAmount / numPayments
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalPaid = monthlyPayment * numPayments;
    const totalInterest = totalPaid - loanAmount;

    const principalShare = Math.round((loanAmount / (loanAmount + totalInterest)) * 100) || 0;

    sendSuccess(res, {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest),
      totalPaid: Math.round(totalPaid),
      principalShare,
      interestShare: 100 - principalShare,
      breakdown: {
        loanAmount,
        downPayment,
        interestRate,
        loanTermYears,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function preQualify(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { income, debts, creditScore, downPaymentAmount } = req.body;

    // Simple pre-qualification logic
    const monthlyIncome = income / 12;
    const monthlyDebts = debts / 12;
    const maxPayment = (monthlyIncome - monthlyDebts) * 0.28; // 28% front-end ratio

    // Estimate max loan based on current average rate
    const avgRate = 6.5;
    const monthlyRate = avgRate / 100 / 12;
    const termMonths = 30 * 12;
    const maxLoan = maxPayment * ((Math.pow(1 + monthlyRate, termMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, termMonths)));
    const maxAmount = maxLoan + downPaymentAmount;

    const preQualified = creditScore >= 620 && maxAmount > 0;

    sendSuccess(res, {
      preQualified,
      maxAmount: Math.round(maxAmount),
      rate: avgRate,
      loanOffer: preQualified
        ? {
            amount: Math.round(maxLoan),
            term: 30,
            rate: avgRate,
            monthlyPayment: Math.round(maxPayment),
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
}
