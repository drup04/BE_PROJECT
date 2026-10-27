/**
 * Deterministic Financial Arithmetic Functions
 * Reconciles numbers down to the exact rupee and percentage point.
 */

function formatRupees(amount) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const amountStr = absAmount.toString();

  if (amountStr.length <= 3) {
    return `${isNegative ? '-' : ''}₹${amountStr}`;
  }

  const lastThree = amountStr.substring(amountStr.length - 3);
  const otherNumbers = amountStr.substring(0, amountStr.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNegative ? '-' : ''}₹${formattedOther},${lastThree}`;
}

function formatLakhs(amount, decimals = 1) {
  const isNegative = amount < 0;
  const absLakhs = Math.abs(amount) / 100000;
  return `${isNegative ? '-' : ''}₹${absLakhs.toFixed(decimals)}L`;
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) return 0;
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10;
}

function calculateMarginPercent(revenue, profit) {
  if (revenue === 0) return 0;
  const margin = (profit / revenue) * 100;
  return Math.round(margin * 10) / 10;
}

function calculateQuotationTotals(input) {
  const lines = Array.isArray(input.lines) ? input.lines : [];
  const subtotal = lines.reduce((sum, line) => {
    const qty = Math.max(0, Number(line.quantity) || 0);
    const price = Math.max(0, Number(line.unitPrice) || 0);
    return sum + Math.round(qty * price);
  }, 0);

  const safeDiscount = Math.min(100, Math.max(0, Number(input.discountPercent) || 0));
  const discountAmount = Math.round(subtotal * (safeDiscount / 100));
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const safeGst = Math.max(0, Number(input.gstRate) !== undefined ? Number(input.gstRate) : 18);
  const gstAmount = Math.round(taxableAmount * (safeGst / 100));
  const grandTotal = taxableAmount + gstAmount;

  return {
    subtotal,
    discountPercent: safeDiscount,
    discountAmount,
    taxableAmount,
    gstRate: safeGst,
    gstAmount,
    grandTotal,
  };
}

function calculateFinancialPeriodSummary(invoices, expenses, period, periodName) {
  const periodInvoices = invoices.filter((inv) => inv.period === period);
  const periodExpenses = expenses.filter((exp) => exp.period === period);

  const revenue = periodInvoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);

  const rawMaterials = periodExpenses
    .filter((e) => e.category === 'raw_materials')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const directLabor = periodExpenses
    .filter((e) => e.category === 'direct_labor')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const factoryOverhead = periodExpenses
    .filter((e) => e.category === 'factory_overhead')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const adminSales = periodExpenses
    .filter((e) => e.category === 'admin_sales')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalExpenses = rawMaterials + directLabor + factoryOverhead + adminSales;
  const operatingProfit = revenue - totalExpenses;
  const operatingMarginPercent = calculateMarginPercent(revenue, operatingProfit);

  return {
    periodName,
    revenue,
    rawMaterials,
    directLabor,
    factoryOverhead,
    adminSales,
    totalExpenses,
    operatingProfit,
    operatingMarginPercent,
  };
}

function calculateReceivablesAging(invoices) {
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let overdueCount = 0;
  let currentPending = 0;

  const brackets = {
    bracket1_30: 0,
    bracket31_60: 0,
    bracket61_90: 0,
    bracket90Plus: 0,
  };

  invoices.forEach((inv) => {
    if (inv.status === 'paid') return;

    const balanceDue = Number(inv.balanceDue || 0);
    const daysOverdue = Number(inv.daysOverdue || 0);

    totalOutstanding += balanceDue;

    if (inv.status === 'overdue' || daysOverdue > 0) {
      totalOverdue += balanceDue;
      overdueCount += 1;

      if (daysOverdue <= 30) {
        brackets.bracket1_30 += balanceDue;
      } else if (daysOverdue <= 60) {
        brackets.bracket31_60 += balanceDue;
      } else if (daysOverdue <= 90) {
        brackets.bracket61_90 += balanceDue;
      } else {
        brackets.bracket90Plus += balanceDue;
      }
    } else {
      currentPending += balanceDue;
    }
  });

  return {
    totalOutstanding,
    totalOverdue,
    overdueCount,
    currentPending,
    brackets,
  };
}

module.exports = {
  formatRupees,
  formatLakhs,
  calculatePercentageChange,
  calculateMarginPercent,
  calculateQuotationTotals,
  calculateFinancialPeriodSummary,
  calculateReceivablesAging,
};
