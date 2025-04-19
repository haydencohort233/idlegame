import { create } from "zustand";
import { getItem } from "../utils/itemUtils";
import rocksData from "../data/rocks.json";
import treesData from "../data/trees.json";
import fishingSpotsData from "../data/fishingSpots.json";
import experienceData from "../data/experience.json";
import achievementsData from "../data/achievements.json";
import patches from "../data/patches.json";

// Build defaultFarmingPatches from patches.json.
const defaultFarmingPatches = {};
Object.entries(patches).forEach(([loc, data]) => {
  data.patches.forEach(patch => {
    defaultFarmingPatches[patch.id] = {
      location: loc,
      plantedCrop: {
        seedId: null,
        plantedAt: null,
        growthTime: null,
        cropYield: null,
        type: null
      }
    };
  });
});

const defaultState = {
  name: "Player",
  level: 1,
  exp: 0,
  gold: 0,
  stats: { 
    health: 10, 
    speed: 1,
    criticalChance: 10,
    criticalMultiplier: 1.5,
    accuracy: 100
  },
  currentHealth: 10,
  skills: { 
    mining:   { level: 1, exp: 0, totalExp: 0 }, 
    fishing:  { level: 1, exp: 0, totalExp: 0 }, 
    crafting: { level: 1, exp: 0, totalExp: 0 }, 
    agility:  { level: 1, exp: 0, totalExp: 0 },
    woodcutting: { level: 1, exp: 0, totalExp: 0 },
    farming:     { level: 1, exp: 0, totalExp: 0 },
    combat: {
      attack:   { level: 1, exp: 0, totalExp: 0 },
      strength: { level: 1, exp: 0, totalExp: 0 },
      defence:  { level: 1, exp: 0, totalExp: 0 },
      magic:    { level: 1, exp: 0, totalExp: 0 },
      ranged:   { level: 1, exp: 0, totalExp: 0 },
    }
  },
  inventory: [],
  inventoryCapacity: 30,
  bankInventory: [],
  bankCapacity: 10,
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
    ring: null,
    tool: null,
  },
  buildings: {},
  location: "lumbridge",
  unlockedLocations: ["lumbridge", "dark_forest"],
  visitedLocations: [],
  isTraveling: false,
  travelingto: null,
  travelStartTime: null,
  travelEndTime: null,
  timeElapsed: 0,
  lastActive: Date.now(),
  autoSaveInterval: 30000, // 30 seconds
  farmingPatches: defaultFarmingPatches,
  // Initialize achievements based on achievementsData
  achievements: Object.keys(achievementsData).reduce((acc, key) => {
    acc[key] = { progress: 0, completed: false, claimed: false };
    return acc;
  }, {}),
  enemyKillCounts: {},
  enemyCooldowns: {},
  // activeSkillTask will be stored as a serializable object:
  // { timerId, taskKey, taskData, startTime, interval }
  playerStats: {
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    totalItemsPurchased: 0,
    totalDeaths: 0,
    totalOresMined: 0,
    totalFishCaught: 0,
    totalLogsCut: 0,
    totalCropsHarvested: 0
  }
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
  achievements: savedState.achievements || defaultState.achievements,
  farmingPatches: { ...defaultState.farmingPatches, ...(savedState.farmingPatches || {}) },
  isTraveling: savedState.isTraveling || defaultState.isTraveling,
  travelingTo: savedState.travelingTo || defaultState.travelingTo,
  travelStartTime: savedState.travelStartTime || defaultState.travelStartTime,
  travelEndTime: savedState.travelEndTime || defaultState.travelEndTime,
  timeElapsed: savedState.timeElapsed || defaultState.timeElapsed,
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

  const defaultFarmingPatches = {};
  Object.entries(patches).forEach(([loc, data]) => {
    data.patches.forEach(patch => {
      defaultFarmingPatches[patch.id] = {
        location: loc,
        plantedCrop: {
          seedId: null,
          plantedAt: null,
          growthTime: null,
          cropYield: null,
          type: null
        }
      };
    });
  });  

  const woodcutTick = (state, tree) => {
    const currentWoodcutting = state.skills.woodcutting;
    const xpReward = tree.exp;
    const rewardId = tree.reward; // e.g., "oak_logs"
    const currentCount = state.resourceGatherCounts[rewardId] || 0;
    const updatedCounts = {
      ...state.resourceGatherCounts,
      [rewardId]: currentCount + 1,
    };
  
    let newExp = currentWoodcutting.exp + xpReward;
    let newTotalExp = (currentWoodcutting.totalExp || 0) + xpReward;
    let newLevel = currentWoodcutting.level;
    while (newTotalExp >= getExpThreshold(newLevel)) {
      newLevel++;
    }
    let newExpForCurrentLevel = newTotalExp - getExpThreshold(newLevel - 1);
  
    const rewardItem = getItem(tree.reward);
    let updatedInventory = [...state.inventory];
    if (rewardItem) {
      const existingItem = updatedInventory.find(i => i.id === rewardItem.id);
      if (existingItem) {
        existingItem.quantity = Math.min((existingItem.quantity || 0) + 1, 999);
      } else {
        updatedInventory.push({ ...rewardItem, quantity: 1 });
      }
    }

    const newPlayerStats = {
      ...state.playerStats,
      totalLogsCut: (state.playerStats.totalLogsCut || 0) + 1,
    };
  
    return {
      ...state,
      resourceGatherCounts: updatedCounts,
      inventory: updatedInventory,
      skills: {
        ...state.skills,
        woodcutting: {
          level: newLevel,
          exp: newExpForCurrentLevel,
          totalExp: newTotalExp,
        },
      },
      playerStats: newPlayerStats,
    };
  };  

  const fishTick = (state, spot) => {
    const currentFishing = state.skills.fishing;
    const xpReward = spot.exp; // XP per tick for fishing
    const rewardId = spot.reward; // e.g. "raw_tuna" or "raw_shark"
    const currentCount = state.resourceGatherCounts[rewardId] || 0;
    const updatedCounts = {
      ...state.resourceGatherCounts,
      [rewardId]: currentCount + 1,
    };
  
    let newExp = currentFishing.exp + xpReward;
    let newTotalExp = (currentFishing.totalExp || 0) + xpReward;
    let newLevel = currentFishing.level;
    while (newTotalExp >= getExpThreshold(newLevel)) {
      newLevel++;
    }
    let newExpForCurrentLevel = newTotalExp - getExpThreshold(newLevel - 1);
  
    // Award the fish resource
    const rewardItem = getItem(spot.reward);
    let updatedInventory = [...state.inventory];
    if (rewardItem) {
      const existingItem = updatedInventory.find(i => i.id === rewardItem.id);
      if (existingItem) {
        existingItem.quantity = Math.min((existingItem.quantity || 0) + 1, 999);
      } else {
        updatedInventory.push({ ...rewardItem, quantity: 1 });
      }
    }

    const newPlayerStats = {
      ...state.playerStats,
      totalFishCaught: (state.playerStats.totalFishCaught || 0) + 1,
    };

    const prevFishProgress = state.achievements.catch_100_fish?.progress || 0;
    const newFishProgress = prevFishProgress + 1;
    const fishCompleted = newFishProgress >= 100;
    const levelCompleted = newLevel >= 5;
    const newAchievements = {
      ...state.achievements,
      catch_100_fish: { progress: newFishProgress, completed: fishCompleted },
      reach_level_5_fishing: { progress: newLevel, completed: levelCompleted },
    };
  
    return {
      ...state,
      resourceGatherCounts: updatedCounts,
      inventory: updatedInventory,
      skills: {
        ...state.skills,
        fishing: {
          level: newLevel,
          exp: newExpForCurrentLevel,
          totalExp: newTotalExp,
        },
      },
      achievements: newAchievements,
      playerStats: newPlayerStats,
    };
  };

  const mineTick = (state, rock) => {
    const currentMining = state.skills.mining;
    const xpReward = rock.exp;
    const rewardId = rock.reward;
    const currentCount = state.resourceGatherCounts[rewardId] || 0;
    const updatedCounts = {
      ...state.resourceGatherCounts,
      [rewardId]: currentCount + 1,
    };
    
    let newExp = currentMining.exp + xpReward;
    let newTotalExp = (currentMining.totalExp || 0) + xpReward;
    
    let newLevel = currentMining.level;
    while (newTotalExp >= getExpThreshold(newLevel)) {
      newLevel++;
    }
    
    // Current XP resets to show progress within the current level.
    let newExpForCurrentLevel = newTotalExp - getExpThreshold(newLevel - 1);
    
    // Award the ore (resource)
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
    
    // Update playerStats: Increase totalOresMined by 1.
    const newPlayerStats = {
      ...state.playerStats,
      totalOresMined: (state.playerStats.totalOresMined || 0) + 1
    };
    
    // (Achievement updates as before, omitted here for brevity)
    const prevOreProgress = state.achievements.mine_100_ores?.progress || 0;
    const newOreProgress = prevOreProgress + 1;
    const oreCompleted = newOreProgress >= achievementsData.mine_100_ores.goal;
    const levelAchieved = newLevel;
    const levelCompleted = levelAchieved >= achievementsData.reach_level_5_mining.goal;
    
    const newAchievements = {
      ...state.achievements,
      mine_100_ores: { progress: newOreProgress, completed: oreCompleted },
      reach_level_5_mining: { progress: levelAchieved, completed: levelCompleted }
    };
    
    console.log("[mineTick] Updated achievements:", newAchievements);
    
    return {
      ...state,
      resourceGatherCounts: updatedCounts,
      inventory: updatedInventory,
      skills: {
        ...state.skills,
        mining: {
          level: newLevel,
          exp: newExpForCurrentLevel,
          totalExp: newTotalExp
        }
      },
      achievements: newAchievements,
      playerStats: newPlayerStats
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
    woodcutting: (taskData) => {
      const tree = treesData[taskData.treeId];
      return {
        onTick: (state) => woodcutTick(state, tree),
        condition: (state) => {
          // Ensure an axe is equipped with a woodcuttingSpeed property.
          if (!state.equipped.tool || !state.equipped.tool.woodcuttingSpeed) return false;
          if (state.inventory.length >= state.inventoryCapacity) return false;
          if (!tree.locations.includes(state.location.toLowerCase())) return false;
          return true;
        }
      };
    },    
    mining: (taskData) => {
      const rock = rocksData[taskData.rockId];
      return {
        onTick: (state) => mineTick(state, rock),
        condition: (state) => {
          // Ensure a pickaxe is equipped
          if (!state.equipped.tool || !state.equipped.tool.miningSpeed) return false;
          // Stop if inventory is full.
          if (state.inventory.length >= state.inventoryCapacity) return false;
          // Stop if the player is not in one of the rock's allowed locations.
          if (!rock.locations.includes(state.location.toLowerCase())) return false;
          return true;
        }
      };
    },    
    fishing: (taskData) => {
      const spot = fishingSpotsData[taskData.spotId];
      return {
        onTick: (state) => {
          // Check if a tool is required and ensure it is equipped.
          if (spot.requiredTool) {
            const isToolEquipped = Object.values(state.equipped).some(
              (item) => item && item.id === spot.requiredTool
            );
            if (!isToolEquipped) {
              console.warn(`Missing required tool: ${spot.requiredTool}`);
              return state;
            }
          }
          // Check if bait is required and remove one unit if available.
          if (spot.requiredBait) {
            const baitIndex = state.inventory.findIndex(
              (i) => i.id === spot.requiredBait
            );
            if (baitIndex === -1) {
              console.warn(`Missing required bait: ${spot.requiredBait}`);
              return state;
            } else {
              // Remove one bait unit.
              const updatedInventory = [...state.inventory];
              updatedInventory[baitIndex].quantity -= 1;
              if (updatedInventory[baitIndex].quantity <= 0) {
                updatedInventory.splice(baitIndex, 1);
              }
              state.inventory = updatedInventory;
            }
          }
          return fishTick(state, spot);
        },
        condition: (state) => {
          // Stop if inventory is full.
          if (state.inventory.length >= state.inventoryCapacity) return false;
          // Stop if the player is not in one of the spot’s allowed locations.
          if (!spot.locations.includes(state.location.toLowerCase())) return false;
          // Check required tool is equipped.
          if (spot.requiredTool) {
            const isToolEquipped = Object.values(state.equipped).some(
              (item) => item && item.id === spot.requiredTool
            );
            if (!isToolEquipped) return false;
          }
          // Check required bait is in the inventory.
          if (spot.requiredBait) {
            if (!state.inventory.some((i) => i.id === spot.requiredBait)) return false;
          }
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
      // Cancel any currently active task
      if (get().activeSkillTask) {
        get().stopSkillTask();
      }
      if (!taskMappings[taskKey] || typeof taskMappings[taskKey] !== "function") {
        console.warn(`No mapping for task key: ${taskKey}`);
        return;
      }
      const mapping = taskMappings[taskKey](taskData);
      const currentState = get();
    
      // For mining: check pickaxe and adjust the interval before checking generic conditions.
      if (taskKey === "mining") {
        const rock = rocksData[taskData.rockId];
        const pickaxe = currentState.equipped.tool;
        if (!pickaxe || !pickaxe.miningSpeed) {
          alert("You need a pickaxe to mine here!");
          return;
        }
        if (currentState.skills.mining.level < rock.level_req) {
          alert(`You need mining level ${rock.level_req} to mine ${rock.name}.`);
          return;
        }
        // Adjust interval: subtract the pickaxe's miningSpeed from the rock's base interval.
        const baseInterval = taskData.interval;
        const effectiveInterval = Math.max(baseInterval - pickaxe.miningSpeed, 1000);
        taskData.interval = effectiveInterval;
      }
    
      if (taskKey === "woodcutting") {
        const tree = treesData[taskData.treeId];
        const axe = currentState.equipped.tool; // Axes are assumed to be in the "tool" slot.
        if (!axe || !axe.woodcuttingSpeed) {
          alert("You need an axe to chop wood here!");
          return;
        }
        if (currentState.skills.woodcutting.level < tree.level_req) {
          alert(`You need woodcutting level ${tree.level_req} to chop ${tree.name}.`);
          return;
        }
        // Adjust interval: subtract the axe's woodcuttingSpeed from the tree's base interval.
        const baseInterval = taskData.interval;
        const effectiveInterval = Math.max(baseInterval - axe.woodcuttingSpeed, 1000);
        taskData.interval = effectiveInterval;
      }      

      // For fishing: check that required tool and bait are present.
      if (taskKey === "fishing") {
        const spot = fishingSpotsData[taskData.spotId];
        const isToolEquipped = Object.values(currentState.equipped).some(
          (item) => item && item.id === spot.requiredTool
        );
        if (!isToolEquipped) {
          alert(`You need a ${spot.requiredTool.replace("_", " ")} to fish here!`);
          return;
        }
        if (spot.requiredBait && !currentState.inventory.some(item => item.id === spot.requiredBait)) {
          alert(`You need ${spot.requiredBait.replace("_", " ")} to fish here!`);
          return;
        }
      }
    
      // Generic immediate condition check.
      if (mapping.condition && !mapping.condition(currentState)) {
        alert("Task conditions not met. Please check your requirements.");
        return;
      }
        
      // Conditions are met: start the timer.
      const timerId = setInterval(() => {
        // Check condition on each tick in case state changes mid-task.
        if (mapping.condition && !mapping.condition(get())) {
          clearInterval(timerId);
          set({ activeSkillTask: null });
          return;
        }
        set((state) => {
          const newState = mapping.onTick(state);
          // Update achievements conditionally based on taskKey
          if (taskKey === "mining") {
            usePlayerStore.getState().updateAchievement("mine_100_ores", 1);
            if (newState.skills.mining.level >= 5) {
              usePlayerStore.getState().updateAchievement("reach_level_5_mining", 0, newState.skills.mining.level);
            }
          } else if (taskKey === "fishing") {
            usePlayerStore.getState().updateAchievement("catch_100_fish", 1);
            if (newState.skills.fishing.level >= 5) {
              usePlayerStore.getState().updateAchievement("reach_level_5_fishing", 0, newState.skills.fishing.level);
            }
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
      // Calculate final gold amount with multipliers.
      let goldMultiplier = 1;
      Object.values(usePlayerStore.getState().equipped).forEach(item => {
        if (item?.gold_multiplier) {
          goldMultiplier *= item.gold_multiplier;
        }
      });
      const finalGold = Math.floor(amount * goldMultiplier);
      
      // Update gold and totalGoldEarned.
      set((state) => {
        const newGold = state.gold + finalGold;
        return { 
          gold: newGold,
          playerStats: {
            ...state.playerStats,
            totalGoldEarned: state.playerStats.totalGoldEarned + finalGold
          }
        };
      });
      saveState();
      
      // Update achievements (as before)
      usePlayerStore.getState().updateAchievement("earn_1000_gold", finalGold);
      usePlayerStore.getState().updateAchievement("earn_1000000_gold", finalGold);
    },    

    spendGold: (amount) => {
      set((state) => {
        const newGold = Math.max(state.gold - amount, 0);
        return { 
          gold: newGold,
          playerStats: {
            ...state.playerStats,
            totalGoldSpent: state.playerStats.totalGoldSpent + amount
          }
        };
      });
      saveState();
    },    

    travel: (newLocation) => {
      set({ location: newLocation, isTraveling: false, travelingTo: null, travelStartTime: null, travelEndTime: null, timeElapsed: 0 });
      saveState();
    },

    startTravel: (destinationId, duration) => {
      const startTime = Date.now();
      const endTime = startTime + duration * 1000;
      set({
        isTraveling: true,
        travelingTo: destinationId,
        travelStartTime: startTime,
        travelEndTime: endTime,
        timeElapsed: 0,
      });
      saveState();
    },

    updateTravelProgress: () => {
      if (get().isTraveling) {
        const now = Date.now();
        const elapsed = now - get().travelStartTime;
        set({ timeElapsed: elapsed });
        if (now >= get().travelEndTime) {
          get().travel(get().travelingTo); // Use the existing travel action to finalize
        }
      }
    },
    cancelTravel: () => set({
      isTraveling: false,
      travelingTo: null,
      travelStartTime: null,
      travelEndTime: null,
      timeElapsed: 0,
    }, false, 'cancelTravel'),

    handleOfflineEarnings: () => {
      const lastActive = get().lastActive;
      const elapsedTime = (Date.now() - lastActive) / 1000;
      const goldRate = 2;
      const totalGold = Math.floor(elapsedTime * goldRate);
      set({ gold: get().gold + totalGold, lastActive: Date.now() });
      saveState();
      return totalGold;
    },

    updatePlayerStats: (statKey, increment = 1) => {
      set((state) => ({
        playerStats: {
          ...state.playerStats,
          [statKey]: (state.playerStats[statKey] || 0) + increment
        }
      }));
      saveState();
    },    

    plantCrop: (patchId, cropData) => {
      set((state) => ({
        farmingPatches: {
          ...state.farmingPatches,
          [patchId]: {
            ...state.farmingPatches[patchId],
            plantedCrop: cropData
          }
        }
      }));
      saveState();
    },    
    
    harvestCrop: (patchId, expAward) => {
      set((state) => {
        const updatedPatches = {
          ...state.farmingPatches,
          [patchId]: {
            ...(state.farmingPatches[patchId] || {}),
            plantedCrop: {
              seedId: null,
              plantedAt: null,
              growthTime: null,
              cropYield: null,
              type: null
            }
          }
        };
    
        // Fixed experience gain
        const totalExpGained = expAward;
        const farmingSkill = state.skills.farming;
        let newTotalExp = farmingSkill.totalExp + totalExpGained;
        let newLevel = farmingSkill.level;
    
        // Level-up loop: Increase level if total exp exceeds the threshold.
        while (newTotalExp >= getExpThreshold(newLevel)) {
          newLevel++;
        }
        const newExpForCurrentLevel = newTotalExp - getExpThreshold(newLevel - 1);
    
        return {
          farmingPatches: updatedPatches,
          skills: {
            ...state.skills,
            farming: {
              level: newLevel,
              exp: newExpForCurrentLevel,
              totalExp: newTotalExp
            }
          },
          playerStats: {
            ...state.playerStats,
            totalCropsHarvested: state.playerStats.totalCropsHarvested + 1
          }
        };
      });
      saveState();
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
    
      // slots that can be equipped
      const validTypes = [
        "head", "neck", "back", "chest",
        "legs", "feet", "hands", "weapon",
        "shield", "ring", "tool"
      ];
      if (!validTypes.includes(item.type)) {
        console.error(`Invalid item type: ${item.type}`);
        return;
      }
    
      set((state) => {
        // take one from inventory
        const invEntry = state.inventory.find(i => i.id === item.id);
        if (!invEntry || invEntry.quantity <= 0) return state;
        const updatedInventory = state.inventory
          .map(i =>
            i.id === item.id
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
          .filter(i => i.quantity > 0);
    
        // unequip any existing in that slot
        const slot = item.type;
        const old = state.equipped[slot];
        if (old) {
          updatedInventory.push({ ...old, quantity: 1 });
        }
    
        // equip the new item
        const newEquipped = { ...state.equipped, [slot]: item };
        return {
          equipped: newEquipped,
          inventory: updatedInventory
        };
      });
    
      saveState();
    },       

    unequipItem: (slot) => {
      set((state) => {
        const validTypes = ["head", "neck", "chest", "legs", "feet", "hands", "weapon", "shield", "ring", "tool"];
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
    },
    // 1) Add this snippet inside your create(...) return block
    incrementResourceCount: (resourceId, amount = 1) => {
      set((state) => {
        const newCount = (state.resourceGatherCounts[resourceId] || 0) + amount;
        return {
          resourceGatherCounts: {
            ...state.resourceGatherCounts,
            [resourceId]: newCount,
          },
        };
      });
      saveState();
    },
    depositItem: (itemId, requestedAmount) => {
      set((state) => {
        // 1) Find the item in user’s inventory
        const invItem = state.inventory.find((i) => i.id === itemId);
        if (!invItem) {
          console.warn("Item not in inventory.");
          return state;
        }
    
        // 2) If requestedAmount > user’s quantity, clamp to their quantity
        const amountToDeposit = Math.min(requestedAmount, invItem.quantity);
    
        // 3) Check distinct item capacity: if the item is new to the bank, 
        //    and the bank is at capacity, block it.
        const bankItem = state.bankInventory.find((b) => b.id === itemId);
        const uniqueBankIds = new Set(state.bankInventory.map((b) => b.id));
        const alreadyInBank = !!bankItem; // boolean
        if (!alreadyInBank && uniqueBankIds.size >= state.bankCapacity) {
          alert("Bank is full (max distinct items).");
          return state; // no changes
        }
    
        // 4) Actually remove from inventory
        const updatedInventory = [...state.inventory].map((i) => {
          if (i.id === itemId) {
            return { ...i, quantity: i.quantity - amountToDeposit };
          }
          return i;
        }).filter((i) => i.quantity > 0);
    
        // 5) Add to bank
        let updatedBank = [...state.bankInventory];
        if (bankItem) {
          bankItem.quantity += amountToDeposit;
        } else {
          updatedBank.push({ id: itemId, quantity: amountToDeposit });
        }
    
        return {
          inventory: updatedInventory,
          bankInventory: updatedBank,
        };
      });
      saveState();
    },    
    
    withdrawItem: (itemId, requestedAmount) => {
      set((state) => {
        const bankItem = state.bankInventory.find((b) => b.id === itemId);
        if (!bankItem) {
          console.warn("Item not in bank.");
          return state;
        }
    
        // If user requests more than the bank has, clamp to the bank’s quantity
        const amountToWithdraw = Math.min(requestedAmount, bankItem.quantity);
    
        // Remove from bank
        const updatedBank = [...state.bankInventory].map((b) => {
          if (b.id === itemId) {
            return { ...b, quantity: b.quantity - amountToWithdraw };
          }
          return b;
        }).filter((b) => b.quantity > 0);
    
        // Add to inventory
        let updatedInventory = [...state.inventory];
        const invItem = updatedInventory.find((i) => i.id === itemId);
        if (invItem) {
          invItem.quantity += amountToWithdraw;
        } else {
          updatedInventory.push({ id: itemId, quantity: amountToWithdraw });
        }
    
        return {
          bankInventory: updatedBank,
          inventory: updatedInventory,
        };
      });
      saveState();
    },
    
    expandBankCapacity: (extraSlots) => {
      set((state) => ({
        bankCapacity: state.bankCapacity + extraSlots
      }));
      saveState();
    },
    
    unlockLocation: (locationId) => {
      set((state) => ({
        unlockedLocations: [...new Set([...state.unlockedLocations, locationId])]
      }));
      saveState();
    },

    incrementEnemyKill: (enemyId) => set((state) => {
      const currentCount = state.enemyKillCounts[enemyId] || 0;
      return { enemyKillCounts: { ...state.enemyKillCounts, [enemyId]: currentCount + 1 } };
    }),

    setEnemyCooldown: (enemyId, cooldownMs) => set((state) => {
      const cooldownTime = Date.now() + cooldownMs;
      return { enemyCooldowns: { ...state.enemyCooldowns, [enemyId]: cooldownTime } };
    }),

    regenerateHealth: () =>
      set((state) => ({
        currentHealth:
          state.currentHealth < state.stats.health
            ? Math.min(state.currentHealth + 1, state.stats.health)
            : state.currentHealth,
      }))
  };
});

if (usePlayerStore.getState().initializeAutoSave) {
  usePlayerStore.getState().initializeAutoSave();
}

export default usePlayerStore;
