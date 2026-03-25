export function buildScanSummary(pages) {
  let totalViolations = 0;
  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  let accessibilityTotal = 0;
  let accessibilityCount = 0;

  for (const page of pages) {
    const violations = page.axe?.violations || [];

    for (const v of violations) {
      const nodeCount = v.nodes?.length || 0;
      totalViolations += nodeCount;

      switch (v.impact) {
        case "critical":
          criticalCount += nodeCount;
          break;
        case "serious":
          seriousCount += nodeCount;
          break;
        case "moderate":
          moderateCount += nodeCount;
          break;
        case "minor":
          minorCount += nodeCount;
          break;
        default:
          break;
      }
    }

    const lhAccessibility = page.lighthouse?.accessibility;
    if (typeof lhAccessibility === "number") {
      accessibilityTotal += lhAccessibility;
      accessibilityCount += 1;
    }
  }

  const avgAccessibilityScore = accessibilityCount
    ? Math.round(accessibilityTotal / accessibilityCount)
    : null;

  return {
    pagesScanned: pages.length,
    totalViolations,
    criticalCount,
    seriousCount,
    moderateCount,
    minorCount,
    avgAccessibilityScore
  };
}