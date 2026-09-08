export const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro", "Jan (ano+1)", "Fev (ano+1)", "Mar (ano+1)", "Abr (ano+1)", "Mai (ano+1)", "Jun (ano+1)", "Jul (ano+1)", "Ago (ano+1)", "Set (ano+1)", "Out (ano+1)", "Nov (ano+1)", "Dez (ano+1)"];

const n = value => Number(value) || 0;
const roundUp = value => Math.ceil(Math.max(0, value));
const baseYear = state => Number(state.settings.baseYear || state.settings.year);

export function plannedTicket(executive, businessLines) {
  const neededSales = businessLines.reduce((sum, line) => {
    const mix = n(executive.mix?.[line.id]);
    return sum + (line.ticket > 0 ? executive.annualTarget * mix / line.ticket : 0);
  }, 0);
  return neededSales > 0 ? executive.annualTarget / neededSales : 0;
}

export function monthlyTargets(executive) {
  const targets = Array(24).fill(0);
  for (let quarter = 0; quarter < 4; quarter += 1) {
    const start = quarter * 3;
    const denominator = [start, start + 1, start + 2].reduce((sum, index) => {
      const month = index + 1;
      const active = month >= executive.startMonth && month <= executive.endMonth;
      return sum + (active ? n(executive.monthWeights[index]) : 0);
    }, 0);
    for (let index = start; index < start + 3; index += 1) {
      const month = index + 1;
      const active = month >= executive.startMonth && month <= executive.endMonth;
      targets[index] = active && denominator > 0
        ? executive.annualTarget * n(executive.quarterShares[quarter]) * n(executive.monthWeights[index]) / denominator
        : 0;
    }
  }
  const provisional = Math.round((executive.annualTarget / 12) / 1000) * 1000;
  for (let index = 12; index < 23; index += 1) targets[index] = provisional;
  targets[23] = Math.max(0, executive.annualTarget - provisional * 11);
  return targets;
}

export function inputEntry(state, executiveId, month, year = Number(state.settings.year)) {
  return state.managementEntries.find(item => item.executiveId === executiveId && Number(item.month) === month && Number(item.year ?? baseYear(state)) === year) || {
    executiveId, year, month, pipeline: 0, strong: 0, commit: 0, wonValue: 0,
    managerAdjustment: 0, wonQty: 0, lostValue: 0, lostQty: 0,
    activeAccounts: 0, lastReview: "",
  };
}

export function commitmentEntry(state, executiveId, month, year = Number(state.settings.year)) {
  return state.commitments.find(item => item.executiveId === executiveId && Number(item.month) === month && Number(item.year ?? baseYear(state)) === year) || {
    executiveId, year, month, committedProspects: 0, committedOpportunities: 0,
    actualProspects: 0, actualOpportunities: 0,
  };
}

export function calculateExecutive(state, executive) {
  const targets = monthlyTargets(executive);
  const ticket = plannedTicket(executive, state.businessLines);
  const weights = state.params.stageWeights;
  let previousSurplus = 0;
  const rows = [];

  for (let index = 0; index < 24; index += 1) {
    const month = index + 1;
    const year = baseYear(state) + Math.floor(index / 12);
    const monthOfYear = index % 12 + 1;
    const input = inputEntry(state, executive.id, monthOfYear, year);
    const target = targets[index];
    const pipeline = n(input.pipeline);
    const strong = n(input.strong);
    const commit = n(input.commit);
    const wonValue = n(input.wonValue);
    const wonQty = n(input.wonQty);
    const lostValue = n(input.lostValue);
    const lostQty = n(input.lostQty);
    const adjustment = n(input.managerAdjustment);
    const openPipeline = pipeline + strong + commit;
    const weightedPipeline = pipeline * n(weights.pipeline) + strong * n(weights.strong) + commit * n(weights.commit);
    const covered = wonValue + weightedPipeline;
    const objective = Math.max(0, target + adjustment);
    const carryIn = index === 0 || index === 12 ? 0 : previousSurplus;
    const availableCoverage = covered + carryIn;
    const surplus = Math.max(0, availableCoverage - objective);
    previousSurplus = surplus;
    const gapManager = Math.max(0, objective - availableCoverage);
    const gapOfficial = Math.max(0, target - covered);
    const gapWithCoverage = Math.max(0, target - availableCoverage);
    const cashGap = Math.max(0, objective - wonValue);
    const consistency = [];
    if ((wonValue > 0 && wonQty === 0) || (wonQty > 0 && wonValue === 0)) consistency.push("Won valor × qtd");
    if ((lostValue > 0 && lostQty === 0) || (lostQty > 0 && lostValue === 0)) consistency.push("Lost valor × qtd");
    if ([pipeline, strong, commit, wonValue, wonQty, lostValue, lostQty, n(input.activeAccounts)].some(value => value < 0)) consistency.push("Valor negativo");
    if (n(input.activeAccounts) > n(executive.totalAccounts)) consistency.push("Contas > carteira");

    rows.push({
      executiveId: executive.id,
      executiveName: executive.name,
      month,
      year,
      monthOfYear,
      target,
      plannedSales: ticket > 0 ? target / ticket : 0,
      salesMissing: ticket > 0 ? gapWithCoverage / ticket : 0,
      pipeline, strong, commit, openPipeline, weightedPipeline, wonValue,
      covered, adjustment, objective, gapManager, gapOfficial, cashGap,
      funnelToCashGap: cashGap === 0 ? null : openPipeline / cashGap,
      wonQty, lostValue, lostQty,
      winRate: wonQty + lostQty > 0 ? wonQty / (wonQty + lostQty) : null,
      realizedTicket: wonQty > 0 ? wonValue / wonQty : null,
      carryIn, availableCoverage, surplus, gapWithCoverage,
      sufficient: availableCoverage >= target,
      attainment: objective > 0 ? wonValue / objective : null,
      activeAccounts: n(input.activeAccounts),
      lastReview: input.lastReview || "",
      consistency: consistency.length ? consistency.join("; ") : "OK",
    });
  }
  return { executive, ticket, targets, rows };
}

export function calculateModel(state) {
  const executives = state.executives.map(executive => calculateExecutive(state, executive));
  const allRows = executives.flatMap(item => item.rows);
  const ref = Number(state.settings.referenceMonth);
  const selectedYear = Number(state.settings.year);
  const selectedId = state.settings.selectedExecutiveId;
  const selectedRows = selectedId ? allRows.filter(row => row.executiveId === selectedId) : allRows;
  const horizon = Number(state.params.panelHorizon) || 12;
  const inYear = selectedRows.filter(row => row.year === selectedYear && row.monthOfYear <= horizon);
  const ytd = inYear.filter(row => row.monthOfYear <= ref);
  const future = inYear.filter(row => row.monthOfYear >= ref);
  const totalTarget = inYear.reduce((sum, row) => sum + row.target, 0);
  const ytdTarget = ytd.reduce((sum, row) => sum + row.target, 0);
  const wonYtd = ytd.reduce((sum, row) => sum + row.wonValue, 0);
  const wonYear = inYear.reduce((sum, row) => sum + row.wonValue, 0);
  const forecastIncrement = future.reduce((sum, row) => sum + row.strong * state.params.stageWeights.strong + row.commit * state.params.stageWeights.commit, 0);
  const forecast = wonYear + forecastIncrement;
  const totalObjective = inYear.reduce((sum, row) => sum + row.objective, 0);
  const cashBalance = Math.max(0, totalObjective - wonYear);
  const openBacklog = future.reduce((sum, row) => sum + row.openPipeline, 0);
  const activeAccounts = selectedRows.filter(row => row.year === selectedYear && row.monthOfYear === ref).reduce((sum, row) => sum + row.activeAccounts, 0);
  const totalAccounts = state.executives.filter(e => !selectedId || e.id === selectedId).reduce((sum, e) => sum + n(e.totalAccounts), 0);

  const team = executives.map(item => {
    const rows = item.rows.filter(row => row.year === selectedYear && row.monthOfYear <= horizon);
    const ytdRows = rows.filter(row => row.monthOfYear <= ref);
    const refRow = rows.find(row => row.monthOfYear === ref);
    const futureRows = rows.filter(row => row.monthOfYear >= ref);
    const targetYtd = ytdRows.reduce((sum, row) => sum + row.target, 0);
    const won = ytdRows.reduce((sum, row) => sum + row.wonValue, 0);
    const wonQty = ytdRows.reduce((sum, row) => sum + row.wonQty, 0);
    const lostQty = ytdRows.reduce((sum, row) => sum + row.lostQty, 0);
    const open = futureRows.reduce((sum, row) => sum + row.openPipeline, 0);
    const objectiveYear = rows.reduce((sum, row) => sum + row.objective, 0);
    const wonYearExec = rows.reduce((sum, row) => sum + row.wonValue, 0);
    const cashGapYear = Math.max(0, objectiveYear - wonYearExec);
    const commitment = commitmentEntry(state, item.executive.id, ref, selectedYear);
    const forecastIncrement = futureRows.reduce((sum, row) => sum + row.strong * state.params.stageWeights.strong + row.commit * state.params.stageWeights.commit, 0);
    const forecast = wonYearExec + forecastIncrement;
    return {
      id: item.executive.id,
      name: item.executive.name,
      targetYtd,
      wonYtd: won,
      attainment: targetYtd > 0 ? won / targetYtd : null,
      ticketPlanned: item.ticket,
      ticketRealized: wonQty > 0 ? won / wonQty : null,
      salesQtyAttainment: ytdRows.reduce((sum, row) => sum + row.plannedSales, 0) > 0 ? wonQty / ytdRows.reduce((sum, row) => sum + row.plannedSales, 0) : null,
      winRate: wonQty + lostQty > 0 ? wonQty / (wonQty + lostQty) : null,
      coverage: item.executive.totalAccounts > 0 ? (refRow?.activeAccounts || 0) / item.executive.totalAccounts : null,
      funnelMultiple: cashGapYear > 0 ? open / cashGapYear : null,
      forecast,
      gapProjected: Math.max(0, objectiveYear - forecast),
      prospectAttainment: n(commitment.committedProspects) > 0 ? n(commitment.actualProspects) / n(commitment.committedProspects) : null,
      opportunityAttainment: n(commitment.committedOpportunities) > 0 ? n(commitment.actualOpportunities) / n(commitment.committedOpportunities) : null,
      lastReview: refRow?.lastReview || "",
      refRow,
    };
  });

  return {
    executives,
    allRows,
    team,
    dashboard: {
      ytdTarget, wonYtd,
      attainment: ytdTarget > 0 ? wonYtd / ytdTarget : null,
      forecast,
      projectedGap: Math.max(0, totalTarget - forecast),
      openBacklog,
      funnelMultiple: cashBalance > 0 ? openBacklog / cashBalance : null,
      coverage: totalAccounts > 0 ? activeAccounts / totalAccounts : null,
      activeAccounts, totalAccounts, totalTarget,
    },
  };
}

export function actionPlan(state, model, executiveId) {
  const ref = Number(state.settings.referenceMonth);
  const selectedYear = Number(state.settings.year);
  const item = model.executives.find(entry => entry.executive.id === executiveId);
  if (!item) return null;
  const current = item.rows.find(row => row.year === selectedYear && row.monthOfYear === ref);
  const futureMonth = current ? current.month + 3 : ref + 3;
  const future = item.rows.find(row => row.month === futureMonth);
  const profile = state.params.profiles[state.params.activeProfile];
  const futureBaseGap = future ? Math.max(0, future.target - future.wonValue - future.weightedPipeline) : 0;
  const totalNeed = futureBaseGap + (current?.gapWithCoverage || 0);
  const m3 = n(state.params.cycle.m3);
  const rawRevenue = m3 > 0 ? totalNeed / m3 : 0;
  const revenueNeeded = rawRevenue < item.ticket * n(state.params.materiality) ? 0 : rawRevenue;
  const sales = item.ticket > 0 ? revenueNeeded / item.ticket : 0;
  const opportunities = n(profile.winRate) > 0 ? sales / n(profile.winRate) : 0;
  const prospects = n(profile.prospectConversion) > 0 ? opportunities / n(profile.prospectConversion) : 0;
  const commitment = commitmentEntry(state, item.executive.id, ref, selectedYear);
  const floorOpp = state.params.applyFloor && n(profile.winRate) > 0 ? roundUp((current?.plannedSales || 0) * n(state.params.floorFactor) / n(profile.winRate)) : 0;
  const floorProspects = state.params.applyFloor && n(profile.prospectConversion) > 0 ? roundUp(floorOpp / n(profile.prospectConversion)) : 0;
  const recommendedOpp = Math.min(Math.max(floorOpp, n(commitment.actualOpportunities) + roundUp(opportunities)), n(state.params.maxMonthlyOpportunities));
  const recommendedProspects = Math.min(Math.max(floorProspects, n(commitment.actualProspects) + roundUp(prospects)), n(state.params.maxMonthlyProspects));
  return {
    executive: item.executive,
    current,
    future,
    futureMonth,
    futureBaseGap,
    totalNeed,
    revenueNeeded,
    sales,
    opportunities,
    prospects,
    expectedM2: revenueNeeded * n(state.params.cycle.m2),
    expectedM3: revenueNeeded * n(state.params.cycle.m3),
    expectedM4: revenueNeeded * n(state.params.cycle.m4),
    floorOpp,
    floorProspects,
    recommendedOpp,
    recommendedProspects,
    commitment,
    triggered: revenueNeeded > 0,
  };
}
