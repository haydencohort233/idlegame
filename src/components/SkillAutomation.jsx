// A generic function to start a skill task.
export function startSkillTask(taskDefinition, storeSet, storeGet, saveState) {
    // Store the start time for offline calculation if needed.
    const startTime = Date.now();
    
    // Start a timer with the specified interval.
    const timerId = setInterval(() => {
      // Check the condition. If false (e.g., inventory is full), stop the task.
      if (taskDefinition.condition && !taskDefinition.condition(storeGet())) {
        clearInterval(timerId);
        return;
      }
      // Execute the tick callback to update state.
      storeSet((state) => taskDefinition.onTick(state));
      saveState();
    }, taskDefinition.interval);
  
    return { timerId, startTime };
  }
  