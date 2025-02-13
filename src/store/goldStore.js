import create from 'zustand';

// A minimal store that only manages gold.
const useGoldStore = create((set) => ({
  gold: 0,

  // Increases gold based on the given amount and an optional multiplier.
  gainGold: (amount, multiplier = 1) =>
    set((state) => ({ gold: state.gold + Math.floor(amount * multiplier) })),

  // Decreases gold, making sure it doesn’t drop below 0.
  spendGold: (amount) =>
    set((state) => ({ gold: Math.max(state.gold - amount, 0) })),
}));

export default useGoldStore;
