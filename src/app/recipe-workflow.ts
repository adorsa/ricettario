import { Service, inject, signal, computed } from '@angular/core';
import { RecipeStep, StepWorkflowStatus } from './recipe.model';
import { Timer } from './timer';
import { ActiveRecipe } from './active-recipe';

@Service()
export class RecipeWorkflow {
  private timer = inject(Timer);
  private activeRecipe = inject(ActiveRecipe);

  completedStepIds = signal<string[]>([]);
  
  stepStatuses = computed(() => {
    const recipe = this.activeRecipe.recipe();
    if (!recipe) return {};

    const completed = this.completedStepIds();
    const activeSuspends = this.timer.activeTimers();
    const statuses: { [stepId: string]: StepWorkflowStatus } = {};

    for (const step of recipe.steps) {
      if (completed.includes(step.id)) {
        statuses[step.id] = 'COMPLETED';
        continue;
      }

      const isSuspended = activeSuspends.some(t => t.id === step.id);
      if (isSuspended) {
        statuses[step.id] = 'PENDING';
        continue;
      }

      const isUnlocked = this.checkDependencies(step, completed);
      statuses[step.id] = isUnlocked ? 'READY' : 'LOCKED';
    }

    return statuses;
  });

  availableSteps = computed(() => {
    const recipe = this.activeRecipe.recipe();
    if (!recipe) return [];
    const statuses = this.stepStatuses();
    return recipe.steps.filter(step => statuses[step.id] === 'READY');
  });

  currentWorkflowStep = computed<RecipeStep | null>(() => {
    const available = this.availableSteps();
    return available.length > 0 ? available[0] : null;
  });

  isIdleTime = computed(() => {
    const recipe = this.activeRecipe.recipe();
    if (!recipe) return false;

    const statuses = this.stepStatuses();
    const totalSteps = recipe.steps.length;
    
    const completedCount = recipe.steps.filter(s => statuses[s.id] === 'COMPLETED').length;
    const pendingCount = recipe.steps.filter(s => statuses[s.id] === 'PENDING').length;

    return completedCount < totalSteps && this.availableSteps().length === 0 && pendingCount > 0;
  });

  constructor() {
    this.timer.onItemCompleted.subscribe(({ stepId }) => {
      this.markStepAsCompleted(stepId);
    });
  }

  initWorkflow() {
    this.completedStepIds.set([]);
  }

  markStepAsCompleted(stepId: string) {
    this.timer.removeTimerOrHold(stepId);
    this.completedStepIds.update(ids => {
      if (!ids.includes(stepId)) {
        return [...ids, stepId];
      }
      return ids;
    });
  }

  private checkDependencies(step: RecipeStep, completedIds: string[]): boolean {
    if (!step.dependencies || step.dependencies.length === 0) return true;

    return step.dependencies.every(dep => {
      if (dep.includes(':rem<=')) {
        const [targetStepId, condition] = dep.split(':rem<=');
        const thresholdMinutes = parseInt(condition, 10);
        
        const minutesLeft = this.timer.getTimeRemainingMinutes(targetStepId);
        
        if (minutesLeft >= 0 && minutesLeft <= thresholdMinutes) {
          return true;
        }
        return false;
      }

      return completedIds.includes(dep);
    });
  }
}