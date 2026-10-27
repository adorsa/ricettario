import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { RecipeWorkflow } from './recipe-workflow';
import { Timer } from './timer';
import { ActiveRecipe } from './active-recipe';
import { Supabase } from './supabase';

describe('RecipeWorkflow', () => {
  let service: RecipeWorkflow;
  let completedSteps: Subject<{ stepId: string }>;
  let recipe: ReturnType<typeof signal<any>>;

  beforeEach(() => {
    localStorage.removeItem('ricettario-workflow:user-1');
    completedSteps = new Subject();
    recipe = signal({
      id: 'recipe-1',
      steps: [
        { id: 'step-1', text: 'First', dependencies: [] },
        { id: 'step-2', text: 'Second', dependencies: ['step-1'] }
      ]
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Timer,
          useValue: {
            activeTimers: () => [],
            onItemCompleted: completedSteps.asObservable(),
            removeTimersForStep: vi.fn(),
            checkExpiredTimersForSteps: vi.fn()
          }
        },
        { provide: ActiveRecipe, useValue: { recipe: () => recipe() } },
        { provide: Supabase, useValue: {} }
      ]
    });
    service = TestBed.inject(RecipeWorkflow);
  });

  afterEach(() => {
    service.clearWorkflow();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('restores a workflow only for the matching user', () => {
    service.startWorkflow('recipe-1', 'user-1');

    expect(service.restoreWorkflow('user-2')).toBeNull();
    expect(service.restoreWorkflow('user-1')).toBe('recipe-1');
  });

  it('advances after a timer completes a step and clears the final workflow', () => {
    service.startWorkflow('recipe-1', 'user-1');
    service.ensureWorkflow('recipe-1', 'user-1', ['step-1', 'step-2']);

    completedSteps.next({ stepId: 'step-1' });
    expect(service.currentWorkflowStep()?.id).toBe('step-2');
    expect(localStorage.getItem('ricettario-workflow:user-1')).not.toBeNull();

    completedSteps.next({ stepId: 'step-2' });
    expect(localStorage.getItem('ricettario-workflow:user-1')).toBeNull();
  });
});
