export const coreRandom = (max: number): number => {
  if (max <= 0) return 0;
  return Math.floor(Math.random() * max);
};

export const coreSpreadRolls = (quantity: number, sides: number): number[] => {
  const rolls: number[] = [];
  if (quantity < 0) return rolls; // Should not happen if validated
  for (let i = 0; i < quantity; i++) {
    rolls.push(coreRandom(sides) + 1);
  }
  return rolls;
};
