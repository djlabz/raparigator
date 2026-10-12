export function isEarningsSimulatorEnabled() {
  return process.env.NEXT_PUBLIC_FINANCIAL_SIMULATOR_ENABLED !== "false";
}
