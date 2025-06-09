import {
  centsToDollars,
  getCareerProgressionSummary,
  getFinancialMetrics,
  getJobApplicationMetrics,
  getRecentCareerEvents,
  getSalaryProgressionData,
  getWorkExperiencesWithFinancials,
} from './queries'

import type {
  CareerEvent,
  CareerProgressionSummary,
  FinancialMetrics,
  JobApplicationMetrics,
  WorkExperienceWithFinancials,
} from './schema'

// Dashboard overview data interface
export interface CareerDashboardData {
  financial: FinancialMetrics
  progression: CareerProgressionSummary
  jobApplications: JobApplicationMetrics
  workExperiences: WorkExperienceWithFinancials[]
  recentEvents: CareerEvent[]
  salaryChart: Array<{
    date: string
    baseSalary: number
    totalComp: number
    company: string
    title: string
  }>
}

// Key metrics for dashboard cards
export interface DashboardMetrics {
  currentSalary: string
  careerGrowth: string
  totalExperience: string
  jobChanges: number
  averageTenure: string
  responseRate: string
  offerRate: string
  negotiationSuccess: string
  compoundGrowthRate: string
  promotionCount: number
}

/**
 * Get all dashboard data for a user
 */
export async function getCareerDashboardData(userId: string): Promise<CareerDashboardData> {
  try {
    // Execute all queries in parallel for better performance
    const [financial, progression, jobApplications, workExperiences, recentEvents, salaryChart] =
      await Promise.all([
        getFinancialMetrics(userId),
        getCareerProgressionSummary(userId),
        getJobApplicationMetrics(userId),
        getWorkExperiencesWithFinancials(userId),
        getRecentCareerEvents(userId, 10),
        getSalaryProgressionData(userId),
      ])

    return {
      financial,
      progression,
      jobApplications,
      workExperiences,
      recentEvents,
      salaryChart,
    }
  } catch (error) {
    console.error('Error fetching career dashboard data:', error)
    throw new Error('Failed to fetch career dashboard data')
  }
}

/**
 * Get key metrics for dashboard summary cards
 */
export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  try {
    const [financial, progression, jobApplications] = await Promise.all([
      getFinancialMetrics(userId),
      getCareerProgressionSummary(userId),
      getJobApplicationMetrics(userId),
    ])

    return {
      currentSalary: `$${centsToDollars(financial.currentSalary).toLocaleString()}`,
      careerGrowth: `${financial.totalCareerGrowth.toFixed(1)}%`,
      totalExperience: `${progression.totalExperience.toFixed(1)} years`,
      jobChanges: progression.jobChangeCount,
      averageTenure: `${progression.averageTenurePerJob.toFixed(1)} years`,
      responseRate: `${jobApplications.responseRate.toFixed(1)}%`,
      offerRate: `${jobApplications.offerRate.toFixed(1)}%`,
      negotiationSuccess: `${jobApplications.salaryMetrics.negotiationSuccessRate.toFixed(1)}%`,
      compoundGrowthRate: `${financial.compoundAnnualGrowthRate.toFixed(1)}%`,
      promotionCount: progression.promotionCount,
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    throw new Error('Failed to fetch dashboard metrics')
  }
}

/**
 * Get financial data formatted for charts
 */
export async function getFinancialChartData(userId: string) {
  try {
    const [financial, salaryProgression] = await Promise.all([
      getFinancialMetrics(userId),
      getSalaryProgressionData(userId),
    ])

    // Format salary progression for line chart
    const salaryTimeline = salaryProgression.map((point) => ({
      date: point.date,
      baseSalary: centsToDollars(point.baseSalary),
      totalComp: centsToDollars(point.totalComp),
      company: point.company,
      title: point.title,
    }))

    // Format salary history by year for bar chart
    const yearlyData = financial.salaryHistory.map((year) => ({
      year: year.year.toString(),
      baseSalary: centsToDollars(year.baseSalary),
      totalComp: centsToDollars(year.totalComp),
      bonuses: centsToDollars(year.bonuses),
      equity: centsToDollars(year.equityValue),
      company: year.company,
    }))

    // Format job change impact for waterfall chart
    const jobChangeData = financial.jobChangeImpact.map((change) => ({
      change: `${change.fromCompany} → ${change.toCompany}`,
      date: change.changeDate,
      salaryIncrease: centsToDollars(change.salaryIncrease),
      percentageIncrease: change.percentageIncrease.toFixed(1),
      totalCompIncrease: centsToDollars(change.totalCompIncrease),
    }))

    return {
      salaryTimeline,
      yearlyData,
      jobChangeData,
      currentSalary: centsToDollars(financial.currentSalary),
      totalGrowth: financial.totalCareerGrowth,
      cagr: financial.compoundAnnualGrowthRate,
    }
  } catch (error) {
    console.error('Error fetching financial chart data:', error)
    throw new Error('Failed to fetch financial chart data')
  }
}

/**
 * Get job application data formatted for charts
 */
export async function getJobApplicationChartData(userId: string) {
  try {
    const metrics = await getJobApplicationMetrics(userId)

    // Format conversion funnel data
    const conversionFunnel = [
      { stage: 'Applications', count: metrics.totalApplications, rate: 100 },
      {
        stage: 'Responses',
        count: Math.round((metrics.totalApplications * metrics.responseRate) / 100),
        rate: metrics.responseRate,
      },
      {
        stage: 'Interviews',
        count: Math.round((metrics.totalApplications * metrics.interviewRate) / 100),
        rate: metrics.interviewRate,
      },
      {
        stage: 'Offers',
        count: Math.round((metrics.totalApplications * metrics.offerRate) / 100),
        rate: metrics.offerRate,
      },
      {
        stage: 'Accepted',
        count: Math.round(
          (metrics.totalApplications * metrics.offerRate * metrics.acceptanceRate) / 10000
        ),
        rate: (metrics.offerRate * metrics.acceptanceRate) / 100,
      },
    ]

    // Format source effectiveness data
    const sourceData = metrics.sourceMetrics.map((source) => ({
      source: source.source,
      applications: source.count,
      responseRate: source.responseRate,
      offerRate: source.offerRate,
      effectiveness: (source.responseRate + source.offerRate) / 2, // Combined score
    }))

    // Format status breakdown for pie chart
    const statusData = metrics.statusBreakdown.map((status) => ({
      status: status.status,
      count: status.count,
      percentage: status.percentage,
    }))

    // Format timing data
    const timingData = {
      averageTimeToResponse: metrics.averageTimeToResponse,
      averageTimeToOffer: metrics.averageTimeToOffer,
      averageTimeToDecision: metrics.averageTimeToDecision,
    }

    return {
      conversionFunnel,
      sourceData,
      statusData,
      timingData,
      salaryMetrics: {
        averageOffered: centsToDollars(metrics.salaryMetrics.averageOffered),
        averageAccepted: centsToDollars(metrics.salaryMetrics.averageAccepted),
        negotiationSuccessRate: metrics.salaryMetrics.negotiationSuccessRate,
        averageNegotiationIncrease: metrics.salaryMetrics.averageNegotiationIncrease,
      },
    }
  } catch (error) {
    console.error('Error fetching job application chart data:', error)
    throw new Error('Failed to fetch job application chart data')
  }
}

/**
 * Get career progression data for timeline and level progression charts
 */
export async function getCareerProgressionChartData(userId: string) {
  try {
    const progression = await getCareerProgressionSummary(userId)

    // Format level progression for step chart
    const levelProgressionData = progression.levelProgression.map((level) => ({
      level: level.level,
      startDate: level.startDate,
      endDate: level.endDate,
      duration: level.duration,
      durationYears: (level.duration / 12).toFixed(1),
    }))

    // Format salary by year for growth chart
    const yearlyGrowthData = progression.salaryByYear.map((year) => ({
      year: year.year,
      salary: centsToDollars(year.salary),
      totalComp: centsToDollars(year.totalComp),
      company: year.company,
      title: year.title,
    }))

    // Calculate year-over-year growth
    const growthRates = []
    for (let i = 1; i < yearlyGrowthData.length; i++) {
      const current = yearlyGrowthData[i]
      const previous = yearlyGrowthData[i - 1]

      if (previous.salary > 0) {
        const growthRate = ((current.salary - previous.salary) / previous.salary) * 100
        growthRates.push({
          year: current.year,
          growthRate: growthRate.toFixed(1),
          salaryChange: current.salary - previous.salary,
        })
      }
    }

    return {
      levelProgressionData,
      yearlyGrowthData,
      growthRates,
      totalExperience: progression.totalExperience.toFixed(1),
      averageAnnualGrowth: progression.averageAnnualGrowth.toFixed(1),
      highestIncrease: {
        amount: centsToDollars(progression.highestSalaryIncrease.amount),
        percentage: progression.highestSalaryIncrease.percentage.toFixed(1),
        reason: progression.highestSalaryIncrease.reason,
        date: progression.highestSalaryIncrease.date,
      },
    }
  } catch (error) {
    console.error('Error fetching career progression chart data:', error)
    throw new Error('Failed to fetch career progression chart data')
  }
}

// Export utility functions
export { centsToDollars } from './queries'
