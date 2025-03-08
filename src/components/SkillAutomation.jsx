export function startSkillTask(taskDefinition, storeSet, storeGet, saveState) {
  // Check the condition immediately
  if (taskDefinition.condition && !taskDefinition.condition(storeGet())) {
    // Instead of starting a timer, alert the player with an appropriate message.
    // You might customize this message based on the specific condition in your taskDefinition.
    alert("Cannot start task: conditions not met (e.g., you need a Fishing Rod or level 5 fishing).");
    return null;
  }
  
  // Store the start time for offline calculation if needed.
  const startTime = Date.now();
  
  // Start a timer with the specified interval.
  const timerId = setInterval(() => {
    // Check the condition on every tick just in case something changes mid-task.
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
