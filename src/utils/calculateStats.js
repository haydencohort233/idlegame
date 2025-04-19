export function calculateCombatTotals(combatSkills, equippedItems) {
  const totals = {
    attack:   combatSkills.attack.level,
    strength: combatSkills.strength.level,
    defence:  combatSkills.defence.level,
    magic:    combatSkills.magic.level,
    ranged:   combatSkills.ranged.level,
  };

  equippedItems.forEach(item => {
    if (!item) return;   // ← skip null/undefined
    if (item.attack_bonus)   totals.attack   += item.attack_bonus;
    if (item.strength_bonus) totals.strength += item.strength_bonus;
    if (item.defence_bonus)  totals.defence  += item.defence_bonus;
    if (item.magic_bonus)    totals.magic    += item.magic_bonus;
    if (item.ranged_bonus)   totals.ranged   += item.ranged_bonus;
  });

  return totals;
}
