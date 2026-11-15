const count = (state, key) => Number(state?.modules?.counts?.[key] || 0)
const percent = (value) => `${Math.max(0, Math.min(100, Math.round(Number(value) || 0)))}%`

export function buildMentorFallback(question, state = {}) {
  const q = String(question || '').toLowerCase()
  const solar = count(state, 'solar')
  const reactor = count(state, 'reactor')
  const farm = count(state, 'farm')
  const recycler = count(state, 'recycler')
  const shield = count(state, 'shield')
  const gym = count(state, 'gym')
  const snacks = count(state, 'snacks')
  const generated = Number(state?.power?.generated || 0)
  const used = Number(state?.power?.consumed || 0)
  const balance = Number(state?.power?.balance || 0)
  const payloadLeft = Number(state?.payload?.remainingKg || 0)
  const budgetLeft = Number(state?.budget?.remainingM || 0)
  const solarStorm = Number(state?.mission?.sol) >= 8 && Number(state?.mission?.sol) <= 12
  const intro = state?.mission?.sol
    ? `At Sol ${state.mission.sol}, your crew is at ${percent(state?.crew?.health)} health and ${percent(state?.crew?.morale)} morale. `
    : `Your outpost has ${payloadLeft.toLocaleString()} kg and $${budgetLeft}M remaining. `

  if (/radiat|shield|flare/.test(q)) {
    return `${intro}Your radiation meter is ${percent(state?.radiation?.shielding)}. In this game, shielding below 50% means the crew loses 60 health points during the Sol 16 flare. Each Regolith Shield adds 50%, and placing one next to Crew Quarters adds a 15% adjacency bonus (up to 100%). Consider adding a shield if you have ${payloadLeft.toLocaleString()} kg and $${budgetLeft}M available.`
  }
  if (/power|electric|reactor|solar|storm/.test(q)) {
    const stormNote = solarStorm ? `The Sol ${state.mission.sol} dust storm is active: solar output is reduced by 70% until Sol 12. ` : 'A scheduled dust storm reduces solar output by 70% for five sols. '
    const deficit = balance < 0 ? `Your current balance is ${balance} power per day (${generated} generated, ${used} used), so stored power is being spent. ` : `Your current balance is +${balance} power per day (${generated} generated, ${used} used). `
    return `${intro}${deficit}${stormNote}A Nuclear Micro-Reactor generates 90 power per day and is unaffected by dust storms; Solar Arrays generate 40 each in clear conditions. You could add a reactor or another array, or reduce power-using modules. I can explain the trade-off, but I won't change your design.`
  }
  if (/water|oxygen|food|farm|hydroponic|recycl/.test(q)) {
    return `${intro}Your build has ${farm} Hydroponic Farm${farm === 1 ? '' : 's'} and ${recycler} Water Recycler${recycler === 1 ? '' : 's'}. In the game's learning meters, farms add food and oxygen support, while a recycler adds water support and uses 15 power per day. Your current life-support readiness is ${percent(state?.lifeSupport?.readiness)}. Adding either module helps its matching supply, but check that your power balance can support it.`
  }
  if (/exercise|gym|muscle|health|morale|snack|cabin/.test(q)) {
    return `${intro}${gym ? 'Your Zero-G Gym is packed; it prevents the 40-point health penalty at Sol 23.' : 'A Zero-G Gym prevents a 40-point crew-health loss at Sol 23.'} ${snacks ? 'Your Snack & Entertainment Vault is packed; it prevents a 40-point morale loss.' : 'A Snack & Entertainment Vault prevents a 40-point morale loss at Sol 23.'} Astronauts exercise during spaceflight because reduced loading can weaken muscles and bones.`
  }
  if (/payload|budget|suitable|improv|recommend|build|configuration/.test(q)) {
    const suggestions = []
    if (balance < 0) suggestions.push('balance power by adding generation or reducing demand')
    if (Number(state?.radiation?.shielding) < 50) suggestions.push('reach at least 50% radiation shielding')
    if (!farm || !recycler) suggestions.push('add farm and water-recycling support')
    if (!gym) suggestions.push('pack a Zero-G Gym for the Sol 23 health check')
    const nextStep = suggestions.length ? suggestions[0] : 'keep spare mass and budget for a flexible design'
    return `${intro}The current build uses ${Number(state?.payload?.usedKg || 0).toLocaleString()} / ${Number(state?.payload?.limitKg || 10000).toLocaleString()} kg and $${state?.budget?.usedM || 0}M / $${state?.budget?.limitM || 100}M. A useful next step is to ${nextStep}. You still have ${payloadLeft.toLocaleString()} kg and $${budgetLeft}M to work with.`
  }
  const event = state?.mission?.environmentalEvent ? ` Current event: ${state.mission.environmentalEvent}.` : ''
  return `${intro}I can help you reason about power, life support, radiation shielding, exercise, or the mission budget.${event} Right now you have ${solar + reactor} power generators, ${farm} farm(s), ${recycler} recycler(s), and ${shield} radiation shield(s). What system would you like to improve?`
}
