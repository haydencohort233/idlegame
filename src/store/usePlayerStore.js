import { create } from "zustand";
import { getItem } from "../utils/itemUtils";

const defaultState = {
  name: "Player",
  level: 1,
  exp: 0,
  gold: 0,
  stats: { 
    attack: 1, 
    defence: 1, 
    magic: 1, 
    health: 10 
  },
  skills: { 
    mining: { level: 1, exp: 0 }, 
    fishing: { level: 1, exp: 0 }, 
    crafting: { level: 1, exp: 0 }, 
    agility: { level: 1, exp: 0 }, 
  },
  inventory: [],
  equipped: {
    head: null,
    neck: null,
    back: null,
    chest: null,
    legs: null,
    feet: null,
    hands: null,
    weapon: null,
    shield: null,
    ring: null,
  },
  buildings: {},
  location: "Lumbridge",
  lastActive: Date.now(),
  autoSaveInterval: 30000, // 30 seconds
};

const savedState = JSON.parse(localStorage.getItem("playerState")) || {};

// Deep merge for skills to ensure structure
const mergedSkills = Object.keys(defaultState.skills).reduce((acc, key) => {
  if (savedState.skills && typeof savedState.skills[key] === "object" && savedState.skills[key] !== null) {
    acc[key] = { ...defaultState.skills[key], ...savedState.skills[key] };
  } else {
    acc[key] = defaultState.skills[key];
  }
  return acc;
}, {});

const mergedState = {
  ...defaultState,
  ...savedState,
  stats: {
    ...defaultState.stats,
    ...(savedState.stats || {}),
  },
  skills: mergedSkills,
};

const usePlayerStore = create((set, get) => {
  const saveState = () => {
    localStorage.setItem("playerState", JSON.stringify(get()));
  };

  const calculateTotalStats = (equipped) => {
    let newStats = { attack: 1, defence: 1, magic: 1, health: 10 };
    Object.values(equipped).forEach(item => {
      if (item) {
        if (item.attack_bonus) newStats.attack += item.attack_bonus;
        if (item.defence_bonus) newStats.defence += item.defence_bonus;
        if (item.magic_bonus) newStats.magic += item.magic_bonus;
        if (item.health_bonus) newStats.health += item.health_bonus;
      }
    });
    return newStats;
  };

  const getExpThreshold = (level) => level * 1000;

  // mineTick performs one tick for mining using the rock's defined exp and reward.
  const mineTick = (state, rock) => {
    const currentMining = state.skills.mining;
    const expGain = rock.exp; // Use the rock's defined exp gain
    let newExp = currentMining.exp + expGain;
    let newLevel = currentMining.level;
    while (newExp >= getExpThreshold(newLevel)) {
      newExp -= getExpThreshold(newLevel);
      newLevel++;
    }
    // Update inventory with the rock's reward item directly
    const rewardItem = getItem(rock.reward);
    let updatedInventory = [...state.inventory];
    if (rewardItem) {
      const existingItem = updatedInventory.find(i => i.id === rewardItem.id);
      if (existingItem) {
        existingItem.quantity = Math.min((existingItem.quantity || 0) + 1, 999);
      } else {
        updatedInventory.push({ ...rewardItem, quantity: 1 });
      }
    }
    return {
      ...state,
      inventory: updatedInventory,
      skills: {
        ...state.skills,
        mining: {
          level: newLevel,
          exp: newExp,
        },
      },
    };
  };  

  // mineRock: one-off mining action using a given rock.
  const mineRock = (rock, playerMining) => {
    set((state) => {
      if (playerMining.level < rock.level_req) {
        console.warn(`You need mining level ${rock.level_req} to mine ${rock.name}.`);
        return state;
      }
      let newExp = playerMining.exp + rock.exp;
      let newLevel = playerMining.level;
      while (newExp >= getExpThreshold(newLevel)) {
        newExp -= getExpThreshold(newLevel);
        newLevel++;
      }
      state.addItem(rock.reward);
      return {
        skills: {
          ...state.skills,
          mining: {
            level: newLevel,
            exp: newExp,
          },
        },
      };
    });
    saveState();
  };

  // Generic skill automation functions.
  // activeSkillTask will hold: { timerId, startTime, taskDefinition }
  // taskDefinition includes: { interval, onTick, condition }
  return {
    ...mergedState,
    calculateTotalStats,
    mineTick, // make sure mineTick is available
    mineRock,

    startSkillTask: (taskDefinition) => {
      if (get().activeSkillTask) return; // Only one active task at a time
      const timerId = setInterval(() => {
        if (taskDefinition.condition && !taskDefinition.condition(get())) {
          clearInterval(timerId);
          set({ activeSkillTask: null });
          return;
        }
        // Execute the tick callback and update the start time.
        set((state) => {
          const newState = taskDefinition.onTick(state);
          return {
            ...newState,
            activeSkillTask: { ...state.activeSkillTask, startTime: Date.now() },
          };
        });
        saveState();
      }, taskDefinition.interval);
      set({ activeSkillTask: { timerId, startTime: Date.now(), taskDefinition } });
    },

    stopSkillTask: () => {
      const activeTask = get().activeSkillTask;
      if (activeTask) {
        clearInterval(activeTask.timerId);
        set({ activeSkillTask: null });
      }
    },

    setAutoSaveInterval: (newInterval) => {
      set((state) => {
        clearInterval(state.autoSaveTimer);
        const newTimer = setInterval(() => {
          saveState();
        }, newInterval);
        return { autoSaveInterval: newInterval, autoSaveTimer: newTimer };
      });
    },

    initializeAutoSave: () => {
      set((state) => {
        clearInterval(state.autoSaveTimer);
        const newTimer = setInterval(() => {
          saveState();
        }, state.autoSaveInterval);
        return { autoSaveTimer: newTimer };
      });
    },

    clearAutoSave: () => {
      set((state) => {
        clearInterval(state.autoSaveTimer);
        return { autoSaveTimer: null };
      });
    },

    gainGold: (amount) => {
      set((state) => {
        let goldMultiplier = 1;
        Object.values(state.equipped).forEach(item => {
          if (item?.gold_multiplier) {
            goldMultiplier *= item.gold_multiplier;
          }
        });
        const finalGold = Math.floor(amount * goldMultiplier);
        const newGold = state.gold + finalGold;
        saveState();
        return { gold: newGold };
      });
    },

    spendGold: (amount) => {
      set((state) => {
        const newGold = Math.max(state.gold - amount, 0);
        saveState();
        return { gold: newGold };
      });
    },

    travel: (newLocation) => {
      set({ location: newLocation });
      saveState();
    },

    handleOfflineEarnings: () => {
      const lastActive = get().lastActive;
      const elapsedTime = (Date.now() - lastActive) / 1000;
      const goldRate = 2;
      let modifier = 1;
      if (get().location === "Mining Town") modifier *= 1.5;
      const totalGold = Math.floor(elapsedTime * goldRate * modifier);
      set({ gold: get().gold + totalGold, lastActive: Date.now() });
      saveState();
      return totalGold;
    },

    addItem: (itemId) => {
      const item = getItem(itemId);
      if (item) {
        set((state) => {
          let updatedInventory = [...state.inventory];
          const existingItem = updatedInventory.find(i => i.id === item.id);
          if (existingItem) {
            existingItem.quantity = Math.min((existingItem.quantity || 0) + 1, 999);
          } else {
            updatedInventory.push({ ...item, quantity: 1 });
          }
          return { inventory: updatedInventory };
        });
        saveState();
      }
    },

    removeItem: (itemId) => {
      const item = getItem(itemId);
      if (!item) {
        console.error(`Item with ID "${itemId}" not found.`);
        return;
      }
      set((state) => {
        const updatedInventory = state.inventory.map(i =>
          i.id === item.id ? { ...i, quantity: Math.max((i.quantity || 1) - 1, 0) } : i
        ).filter(i => i.quantity > 0);
        return { inventory: updatedInventory };
      });
      saveState();
    },

    equipItem: (itemId) => {
      const item = getItem(itemId);
      if (!item) {
        console.error(`Item with ID "${itemId}" not found.`);
        return;
      }
      const validTypes = [
        "head", "neck", "back", "chest", "legs", "feet", "hands", "weapon", "shield", "ring"
      ];
      if (validTypes.includes(item.type)) {
        set((state) => {
          const inventoryItem = state.inventory.find(i => i.id === item.id);
          if (!inventoryItem || inventoryItem.quantity <= 0) return state;
          let updatedInventory = state.inventory.map(i =>
            i.id === item.id ? { ...i, quantity: Math.max((i.quantity || 1) - 1, 0) } : i
          ).filter(i => i.quantity > 0);
          const previousItem = state.equipped[item.type];
          if (previousItem) {
            updatedInventory.push({ ...previousItem, quantity: 1 });
          }
          const newEquipped = { ...state.equipped, [item.type]: item };
          const newStats = calculateTotalStats(newEquipped);
          return {
            equipped: newEquipped,
            inventory: updatedInventory,
            stats: newStats,
          };
        });
        saveState();
      } else {
        console.error(`Invalid item type: ${item.type}`);
      }
    },

    unequipItem: (slot) => {
      set((state) => {
        const validTypes = [
          "head", "neck", "chest", "legs", "feet", "hands", "weapon", "shield", "ring"
        ];
        if (!validTypes.includes(slot)) return state;
        const equippedItem = state.equipped[slot];
        if (!equippedItem) return state;
        let updatedInventory = [...state.inventory];
        const existingItem = updatedInventory.find(i => i.id === equippedItem.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          updatedInventory.push({ ...equippedItem, quantity: 1 });
        }
        const newEquipped = { ...state.equipped, [slot]: null };
        const newStats = calculateTotalStats(newEquipped);
        return {
          equipped: newEquipped,
          inventory: updatedInventory,
          stats: newStats,
        };
      });
      saveState();
    },
  };
});

usePlayerStore.getState().initializeAutoSave();

export default usePlayerStore;
