// VSL Funnel Benchmarks - Worst Case Scenarios (Break-even thresholds)
// Below these = RED (losing money / needs attention)
// At or above = GREEN (acceptable performance)

export const BENCHMARKS = {
  // Financial
  roas: 2.52,              // ROAS below this = losing money
  cpa: 1389,               // CPA above this = too expensive
  cashPerSale: 3500,       // Target cash per sale

  // Funnel Conversion Rates (as decimals)
  showRate: 0.24,          // Show rate below 24% = lead quality issue
  closeRate: 0.30,         // Close rate below 30% = sales issue

  // Cost Per Stage
  costPerBooking: 100,     // Cost per booking above $100 = ad efficiency issue
  costPerShow: 150,        // Derived: ~$100 / 0.75 show rate ≈ $133, using $150 as buffer
  costPerApp: 50,          // Reasonable benchmark for cost per application

  // Ad Spend (for context)
  minAdSpend: 7500,        // Minimum monthly spend for model to work
};

// DM Funnel Benchmarks - Industry standards for high-ticket DM outreach
export const DM_BENCHMARKS = {
  // Conversion rates (as decimals)
  responseRate: 0.15,       // 15% DM to response - good
  responseRateWarning: 0.10, // 10% - warning threshold
  conversationRate: 0.50,   // 50% response to conversation - good
  conversationRateWarning: 0.30, // 30% - warning threshold
  bookingRate: 0.20,        // 20% conversation to booking - good
  bookingRateWarning: 0.10, // 10% - warning threshold
  overallRate: 0.015,       // 1.5% DM to booking (end-to-end) - good
  overallRateWarning: 0.008, // 0.8% - warning threshold
};

// DM Benchmark helper - returns "green" | "yellow" | "red"
export function getDMRateStatus(
  rate: number, // as decimal (e.g., 0.15 for 15%)
  goodThreshold: number,
  warningThreshold: number
): "green" | "yellow" | "red" {
  if (rate >= goodThreshold) return "green";
  if (rate >= warningThreshold) return "yellow";
  return "red";
}

// Helper functions to check if a metric is healthy
export function isRoasHealthy(roas: number): boolean {
  return roas >= BENCHMARKS.roas;
}

export function isCpaHealthy(cpa: number): boolean {
  return cpa <= BENCHMARKS.cpa;
}

export function isShowRateHealthy(rate: number): boolean {
  return rate >= BENCHMARKS.showRate * 100; // Convert to percentage
}

export function isCloseRateHealthy(rate: number): boolean {
  return rate >= BENCHMARKS.closeRate * 100; // Convert to percentage
}

export function isCostPerBookingHealthy(cost: number): boolean {
  return cost <= BENCHMARKS.costPerBooking;
}

// Get status color based on metric health
export function getMetricStatus(
  value: number,
  benchmark: number,
  lowerIsBetter: boolean = false
): "green" | "red" | "neutral" {
  if (value === 0) return "neutral";

  if (lowerIsBetter) {
    return value <= benchmark ? "green" : "red";
  }
  return value >= benchmark ? "green" : "red";
}
