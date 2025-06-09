import type { FinancialMetrics } from "../schema";
import { extractWorkExperiences, getUserWorkExperiences } from "./base";
import {
  calculateCAGR,
  calculatePercentageChange,
  getBonusesForYear,
  getCurrentSalary,
  getEmploymentYears,
  yearsBetween,
} from "./utils";

/**
 * Financial metrics and salary progression queries
 */

export async function getFinancialMetrics(
  userId: string
): Promise<FinancialMetrics> {
  // Get all work experiences ordered by start date
  const experiences = await getUserWorkExperiences(userId);

  if (experiences.length === 0) {
    return {
      currentSalary: 0,
      currentTotalComp: 0,
      totalCareerGrowth: 0,
      compoundAnnualGrowthRate: 0,
      salaryHistory: [],
      jobChangeImpact: [],
      marketComparison: {},
    };
  }

  const workExps = extractWorkExperiences(experiences);

  // Calculate current salary and total comp
  const currentExp =
    workExps.find((e) => !e.endDate) || workExps[workExps.length - 1];
  const currentSalary = getCurrentSalary(currentExp);
  const currentTotalComp = currentExp.totalCompensation || currentSalary;

  // Calculate first salary
  const firstExp = workExps[0];
  const firstSalary = firstExp.baseSalary || 0;

  // Calculate total career growth
  const totalCareerGrowth = calculatePercentageChange(
    firstSalary,
    currentSalary
  );

  // Calculate CAGR
  const careerStartDate = firstExp.startDate;
  const yearsOfExperience = careerStartDate
    ? yearsBetween(new Date(careerStartDate))
    : 1;

  const compoundAnnualGrowthRate = calculateCAGR(
    firstSalary,
    currentSalary,
    yearsOfExperience
  );

  // Build salary history by year
  const salaryHistory = buildSalaryHistory(workExps);

  // Calculate job change impact
  const jobChangeImpact = calculateJobChangeImpact(workExps);

  return {
    currentSalary,
    currentTotalComp,
    totalCareerGrowth,
    compoundAnnualGrowthRate,
    salaryHistory,
    jobChangeImpact,
    marketComparison: {
      lastUpdated: new Date().toISOString(),
    },
  };
}

function buildSalaryHistory(workExps: any[]) {
  const salaryHistory: FinancialMetrics["salaryHistory"] = [];

  for (const exp of workExps) {
    if (!exp.startDate || !exp.baseSalary) continue;

    const years = getEmploymentYears(exp.startDate, exp.endDate);

    for (const year of years) {
      const yearSalary = getCurrentSalary(exp);
      const bonuses = getBonusesForYear(exp.bonusHistory || [], year);

      salaryHistory.push({
        year,
        baseSalary: yearSalary,
        totalComp: exp.totalCompensation || yearSalary,
        bonuses,
        equityValue: exp.equityValue || 0,
        company: exp.company,
        role: exp.role,
      });
    }
  }

  return salaryHistory;
}

function calculateJobChangeImpact(workExps: any[]) {
  const jobChangeImpact: FinancialMetrics["jobChangeImpact"] = [];

  for (let i = 1; i < workExps.length; i++) {
    const prevExp = workExps[i - 1];
    const currentExp = workExps[i];

    const prevSalary = getCurrentSalary(prevExp);
    const newSalary = getCurrentSalary(currentExp);

    if (prevSalary > 0 && newSalary > 0) {
      const salaryIncrease = newSalary - prevSalary;
      const percentageIncrease = calculatePercentageChange(
        prevSalary,
        newSalary
      );

      jobChangeImpact.push({
        changeDate: currentExp.startDate || "",
        fromCompany: prevExp.company,
        toCompany: currentExp.company,
        salaryIncrease,
        percentageIncrease,
        totalCompIncrease:
          (currentExp.totalCompensation || newSalary) -
          (prevExp.totalCompensation || prevSalary),
      });
    }
  }

  return jobChangeImpact;
}

export async function getSalaryProgressionData(userId: string) {
  const experiences = await getUserWorkExperiences(userId);
  const workExps = extractWorkExperiences(experiences);

  const salaryData: Array<{
    date: string;
    baseSalary: number;
    totalComp: number;
    company: string;
    title: string;
  }> = [];

  for (const exp of workExps) {
    if (!exp.startDate || !exp.baseSalary) continue;

    // Add entry for start of role
    salaryData.push({
      date: exp.startDate,
      baseSalary: exp.baseSalary,
      totalComp: exp.totalCompensation || exp.baseSalary,
      company: exp.company,
      title: exp.role,
    });

    // Add entries for salary adjustments
    const adjustments = (exp.salaryAdjustments as any[]) || [];
    for (const adj of adjustments) {
      salaryData.push({
        date: adj.effectiveDate,
        baseSalary: adj.newSalary,
        totalComp: adj.newSalary, // Could be enhanced with total comp tracking
        company: exp.company,
        title: adj.newTitle || exp.role,
      });
    }
  }

  return salaryData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function getCompensationBreakdown(userId: string) {
  const experiences = await getUserWorkExperiences(userId);
  const workExps = extractWorkExperiences(experiences);

  const compensationBreakdown = workExps.map((exp) => {
    const baseSalary = getCurrentSalary(exp);
    const totalBonuses = ((exp.bonusHistory as any[]) || []).reduce(
      (sum, bonus) => sum + (bonus.amount || 0),
      0
    );

    return {
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate,
      baseSalary,
      signingBonus: exp.signingBonus || 0,
      annualBonus: exp.annualBonus || 0,
      totalBonuses,
      equityValue: exp.equityValue || 0,
      totalCompensation: exp.totalCompensation || baseSalary,
      currency: exp.currency || "USD",
    };
  });

  return compensationBreakdown;
}
