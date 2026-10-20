import { TestBed } from '@angular/core/testing';
import { Timer } from './timer';

describe('Timer', () => {
  let service: Timer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Timer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should complete a countdown early and emit its completion event', () => {
    const completed: string[] = [];
    const subscription = service.onItemCompleted.subscribe(({ stepId }) => completed.push(stepId));
    service.startCountdown('step-1', 5, 'Test timer');

    service.releaseHoldOrComplete('step-1');

    expect(service.activeTimers()).toEqual([]);
    expect(completed).toEqual(['step-1']);
    subscription.unsubscribe();
  });
});
