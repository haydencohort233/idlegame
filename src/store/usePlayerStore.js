// src/store/usePlayerStore.js
import { create } from "zustand";
import { getItem } from "../utils/itemUtils";
import rocksData from "../data/rocks.json";
import experienceData from "../data/experience.json";
import achievementsData from "../data/achievements.json";

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
    mining: { level: 1, exp: 0, totalExp: 0 }, 
    fishing: { level: 1, exp: 0, totalExp: 0 }, 
    crafting: { level: 1, exp: 0, totalExp: 0 }, 
    agility: { level: 1, exp: 0, totalExp: 0 } 
  },
  inventory: [],
  inventoryCapacity: 30,
  resourceGatherCounts: {},
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
    ring: null
  },
  buildings: {},
  location: "lumbridge",
  visitedLocations: [],
  lastActive: Date.now(),
  autoSaveInterval: 30000, // 30 seconds
  // Initialize achievements based on achievementsData
  achievements: Object.keys(achievementsData).reduce((acc, key) => {
    acc[key] = { progress: 0, completed: false, claimed: false };
    return acc;
  }, {})
  // activeSkillTask will be stored as a serializable object:
  // { timerId, taskKey, taskData, startTime, interval }
};

const savedState = JSON.parse(localStorage.getItem("playerState")) || {};

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
    ...(savedState.stats || {})
  },
  skills: mergedSkills,
  achievements: savedState.achievements || defaultState.achievements
};

const usePlayerStore = create((set, get) => {
  // Save state to localStorage, stripping non-serializable parts
  const saveState = () => {
    const { activeSkillTask, ...stateToSave } = get();
    // Store a serializable version of activeSkillTask (exclude timerId)
    const serializableTask = activeSkillTask
      ? { ...activeSkillTask, timerId: undefined }
      : null;
    const stateWithTask = { ...stateToSave, activeSkillTask: serializableTask };
    localStorage.setItem("playerState", JSON.stringify(stateWithTask));
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

  const getExpThreshold = (level) => {
    return experienceData[level] || (level * 1000); // Fallback if level is missing
  };

  const mineTick = (state, rock) => {
    const currentMining = state.skills.mining;
    const xpReward = rock.exp; // XP per tick
  
    let newExp = currentMining.exp + xpReward;
    let newTotalExp = (currentMining.totalExp || 0) + xpReward; // Never resets
  
    let newLevel = currentMining.level;
  
    // Level up while total XP meets the threshold.
    while (newTotalExp >= getExpThreshold(newLevel)) {
      newLevel++;
    }
  
    // Current XP resets to show progress within the current level.
    let newExpForCurrentLevel = newTotalExp - getExpThreshold(newLevel - 1);
  
    // Award the ore (resource)
    const rewardItem = getItem(rock.reward);
    let updatedInventory = [...state.inventory];
    if (rewardItem) {
      const existingItem = updatedInventory.find((i) => i.id === rewardItem.id);
      if (existingItem) {
        existingItem.quantity = Math.min((existingItem.quantity || 0) + 1, 999);
      } else {
        updatedInventory.push({ ...rewardItem, quantity: 1 });
      }
    }
  
    // Update achievements inline:
    const prevOreProgress = state.achievements.mine_100_ores?.progress || 0;
    const newOreProgress = prevOreProgress + 1;
    const oreCompleted = newOreProgress >= achievementsData.mine_100_ores.goal;
  
    // For reach_level_5_mining, we simply use the new level.
    const levelAchieved = newLevel;
    const levelCompleted = levelAchieved >= achievementsData.reach_level_5_mining.goal;
  
    const newAchievements = {
      ...state.achievements,
      mine_100_ores: {
        progress: newOreProgress,
        completed: oreCompleted,
      },
      reach_level_5_mining: {
        progress: levelAchieved,
        completed: levelCompleted,
      },
    };
  
    console.log("[mineTick] Updated achievements:", newAchievements);
  
    return {
      ...state,
      inventory: updatedInventory,
      skills: {
        ...state.skills,
        mining: {
          level: newLevel,
          exp: newExpForCurrentLevel,
          totalExp: newTotalExp,
        },
      },
      achievements: newAchievements,
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
      let newTotalExp = (playerMining.totalExp || 0) + rock.exp;
      let newLevel = playerMining.level;
      while (newTotalExp >= getExpThreshold(newLevel)) {
        newLevel++;
      }
      let newExpForCurrentLevel = newTotalExp - getExpThreshold(newLevel - 1);
      
      // Update achievements for one-off mining:
      usePlayerStore.getState().updateAchievement("mine_100_ores", 1);
      if (newLevel >= 5) {
        usePlayerStore.getState().updateAchievement("reach_level_5_mining", 0, newLevel);
      }
      
      state.addItem(rock.reward);
      return {
        skills: {
          ...state.skills,
          mining: {
            level: newLevel,
            exp: newExpForCurrentLevel,
            totalExp: newTotalExp
          }
        }
      };
    });
    saveState();
  };  

  // TASK MAPPINGS:
  // Given a taskKey and taskData, return the onTick and condition functions.
  // For "mining", taskData should include at least:
  //    { rockId: "copper_rock", interval: 5000 }
  const taskMappings = {
    mining: (taskData) => {
      const rock = rocksData[taskData.rockId];
      return {
        onTick: (state) => mineTick(state, rock),
        condition: (state) => {
          // Stop if inventory is full
          if (state.inventory.length >= state.inventoryCapacity) return false;
          // Stop if the player is not in one of the rock's allowed locations
          if (!rock.locations.includes(state.location.toLowerCase())) return false;
          return true;
        }
      };
    }
    // Add other skills here
  };

  // ACHIEVEMENT UPDATE FUNCTION
  const updateAchievement = (id, increment = 1, customValue = null) => {
    set((state) => {
      if (!state.achievements[id] || state.achievements[id].completed) {
        //console.log(`[Achievement] ${id} already completed or not found.`);
        return {}; // no update
      }
      const achievementDef = achievementsData[id];
      let progress = state.achievements[id].progress;
      
      //console.log(
      //  `[Achievement] Before update: ${id} progress: ${progress}, increment: ${increment}, customValue: ${customValue}`
      //);
      
      switch (achievementDef.progressType) {
        case "counter":
          progress += increment;
          break;
        case "level":
          if (customValue !== null) progress = customValue;
          break;
        case "unique":
          progress += 1;
          break;
        case "specific":
          if (customValue === achievementDef.goal) {
            progress = 1;
          }
          break;
        default:
          break;
      }
      
      const goalValue =
        typeof achievementDef.goal === "number" ? achievementDef.goal : 1;
      const completed = progress >= goalValue;
      
      //console.log(
      //  `[Achievement] After update: ${id} progress: ${progress}, completed: ${completed}`
      //);
      
      if (completed) {
        console.log(`[Achievement] ${id} completed! Reward:`, achievementDef.reward);
        // Optionally trigger reward logic here.
      }
      
      // Return a partial update that merges with the existing state.
      return {
        achievements: {
          ...state.achievements,
          [id]: { progress, completed }
        }
      };
    });
    saveState();
  };  

    // Create default achievements from achievementsData
  const defaultAchievements = Object.keys(achievementsData).reduce((acc, key) => {
    acc[key] = { progress: 0, completed: false };
    return acc;
  }, {});

  // Merge saved achievements with the default ones.
  // Any saved achievement values override the defaults.
  const mergedAchievements = { 
    ...defaultAchievements, 
    ...(savedState.achievements || {}) 
  };

  const mergedState = {
    ...defaultState,
    ...savedState,
    stats: {
      ...defaultState.stats,
      ...(savedState.stats || {})
    },
    skills: mergedSkills,
    achievements: mergedAchievements
  };

  return {
    ...mergedState,
    calculateTotalStats,
    mineTick,
    mineRock,
    updateAchievement,
    // Start a skill task using a serializable taskKey and taskData.
    startSkillTask: (taskKey, taskData) => {
      if (get().activeSkillTask) return; // Only one active task at a time.
      if (!taskMappings[taskKey] || typeof taskMappings[taskKey] !== "function") {
        console.warn(`No mapping for task key: ${taskKey}`);
        return;
      }
      const mapping = taskMappings[taskKey](taskData);
      const timerId = setInterval(() => {
        if (mapping.condition && !mapping.condition(get())) {
          clearInterval(timerId);
          set({ activeSkillTask: null });
          return;
        }
        set((state) => {
          const newState = mapping.onTick(state);
          // Update achievements after each tick:
          usePlayerStore.getState().updateAchievement("mine_100_ores", 1);
          if (newState.skills.mining.level >= 5) {
            usePlayerStore.getState().updateAchievement("reach_level_5_mining", 0, newState.skills.mining.level);
          }
          return {
            ...newState,
            activeSkillTask: { ...state.activeSkillTask, startTime: Date.now() }
          };
        });
        saveState();
      }, taskData.interval);
      set({ activeSkillTask: { timerId, taskKey, taskData, startTime: Date.now(), interval: taskData.interval } });
    },    

    stopSkillTask: () => {
      const activeTask = get().activeSkillTask;
      if (activeTask) {
        clearInterval(activeTask.timerId);
        set({ activeSkillTask: null });
      }
    },

    handleOfflineSkillProgression: () => {
      const activeTask = get().activeSkillTask;
      if (!activeTask) return;
      if (!activeTask.taskKey || typeof taskMappings[activeTask.taskKey] !== "function") {
        console.warn(`No valid mapping for task key: ${activeTask.taskKey}. Clearing active task.`);
        if (activeTask.timerId) clearInterval(activeTask.timerId);
        set({ activeSkillTask: null });
        return;
      }
      const mapping = taskMappings[activeTask.taskKey](activeTask.taskData);
      const now = Date.now();
      const elapsed = now - activeTask.startTime;
      const maxDuration = 12 * 60 * 60 * 1000; // 12 hours in ms.
      const effectiveElapsed = Math.min(elapsed, maxDuration);
      const ticks = Math.floor(effectiveElapsed / activeTask.interval);
      let newState = get();
      for (let i = 0; i < ticks; i++) {
        newState = mapping.onTick(newState);
        if (mapping.condition && !mapping.condition(newState)) {
          if (activeTask.timerId) clearInterval(activeTask.timerId);
          newState.activeSkillTask = null;
          break;
        }
      }
      if (newState.activeSkillTask) {
        newState.activeSkillTask.startTime = now;
        if (!newState.activeSkillTask.timerId) {
          const timerId = setInterval(() => {
            if (mapping.condition && !mapping.condition(get())) {
              clearInterval(timerId);
              set({ activeSkillTask: null });
              return;
            }
            set((state) => {
              const updatedState = mapping.onTick(state);
              return {
                ...updatedState,
                activeSkillTask: { ...state.activeSkillTask, startTime: Date.now() }
              };
            });
            saveState();
          }, newState.activeSkillTask.interval);
          newState.activeSkillTask.timerId = timerId;
        }
      }
      set(newState);
      saveState();
      return ticks;
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
      // Calculate final gold amount first:
      let goldMultiplier = 1;
      Object.values(usePlayerStore.getState().equipped).forEach(item => {
        if (item?.gold_multiplier) {
          goldMultiplier *= item.gold_multiplier;
        }
      });
      const finalGold = Math.floor(amount * goldMultiplier);
    
      // Now update gold in the state
      set((state) => {
        const newGold = state.gold + finalGold;
        return { gold: newGold };
      });
      saveState();
    
      // Now update achievements outside of the set callback:
      usePlayerStore.getState().updateAchievement("earn_1000_gold", finalGold);
      usePlayerStore.getState().updateAchievement("earn_1000000_gold", finalGold);
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
      const totalGold = Math.floor(elapsedTime * goldRate);
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
        const updatedInventory = state.inventory
          .map(i => i.id === item.id ? { ...i, quantity: Math.max((i.quantity || 1) - 1, 0) } : i)
          .filter(i => i.quantity > 0);
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
      const validTypes = ["head", "neck", "back", "chest", "legs", "feet", "hands", "weapon", "shield", "ring"];
      if (validTypes.includes(item.type)) {
        set((state) => {
          const inventoryItem = state.inventory.find(i => i.id === item.id);
          if (!inventoryItem || inventoryItem.quantity <= 0) return state;
          let updatedInventory = state.inventory
            .map(i => i.id === item.id ? { ...i, quantity: Math.max((i.quantity || 1) - 1, 0) } : i)
            .filter(i => i.quantity > 0);
          const previousItem = state.equipped[item.type];
          if (previousItem) {
            updatedInventory.push({ ...previousItem, quantity: 1 });
          }
          const newEquipped = { ...state.equipped, [item.type]: item };
          const newStats = calculateTotalStats(newEquipped);
          return { equipped: newEquipped, inventory: updatedInventory, stats: newStats };
        });
        saveState();
      } else {
        console.error(`Invalid item type: ${item.type}`);
      }
    },

    unequipItem: (slot) => {
      set((state) => {
        const validTypes = ["head", "neck", "chest", "legs", "feet", "hands", "weapon", "shield", "ring"];
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
        return { equipped: newEquipped, inventory: updatedInventory, stats: newStats };
      });
      saveState();
    },

    claimAchievementReward: (id) => {
      set((state) => {
        if (
          !state.achievements[id] ||
          !state.achievements[id].completed ||
          state.achievements[id].claimed
        ) {
          console.log(`Achievement ${id} cannot be claimed.`);
          return {};
        }
        const achievementDef = achievementsData[id];
        // Grant the reward based on its type
        if (achievementDef.reward.gold) {
          state.gold += achievementDef.reward.gold;
        }
        if (achievementDef.reward.exp) {
          state.exp += achievementDef.reward.exp;
          // Alternatively, you might add this to a specific skill's XP.
        }
        if (achievementDef.reward.item) {
          // For demonstration, add the item to inventory.
          state.inventory.push({ id: achievementDef.reward.item, quantity: 1 });
        }
        console.log(`Reward for ${id} claimed!`, achievementDef.reward);
        return {
          achievements: {
            ...state.achievements,
            [id]: { ...state.achievements[id], claimed: true }
          }
        };
      });
      saveState();
    }
    // Add more here    
  };
});

if (usePlayerStore.getState().initializeAutoSave) {
  usePlayerStore.getState().initializeAutoSave();
}

export default usePlayerStore;
