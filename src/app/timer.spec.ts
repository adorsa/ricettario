import { TestBed } from '@angular/core/testing';
import { Timer } from './timer';

describe('Timer', () => {
  let service: Timer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Timer);
  });

  afterEach(() => {
    service.activeTimers().forEach(timer => service.removeTimerOrHold(timer.id));
    TestBed.resetTestingModule();
    localStorage.removeItem('ricettario-timers');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should allow different timers on the same step and persist their deadlines', () => {
    const completed: string[] = [];
    const subscription = service.onItemCompleted.subscribe(({ stepId }) => completed.push(stepId));
    service.startCountdown('step-1', { minutes: 5, label: 'Pasta' });
    service.startCountdown('step-1', { minutes: 2, label: 'Salsa' });
    const firstTimerId = service.activeTimers()[0].id;

    service.releaseHoldOrComplete(firstTimerId);

    expect(service.activeTimers()).toHaveLength(1);
    expect(service.activeTimers()[0].stepId).toBe('step-1');
    expect(completed).toEqual([]);
    expect(JSON.parse(localStorage.getItem('ricettario-timers')!)).toHaveLength(1);
    subscription.unsubscribe();
  });

  it('should persist the remaining time when paused and set a new deadline when resumed', () => {
    service.startCountdown('step-1', { minutes: 5, label: 'Pasta' });
    const timerId = service.activeTimers()[0].id;

    service.pauseTimer(timerId);
    expect(service.activeTimers()[0].isRunning).toBe(false);
    expect(service.activeTimers()[0].expiresAt).toBeNull();

    service.resumeTimer(timerId);
    expect(service.activeTimers()[0].isRunning).toBe(true);
    expect(service.activeTimers()[0].expiresAt).toBeGreaterThan(Date.now());
  });

  it('should restore a running timer from its saved deadline', () => {
    const expiresAt = Date.now() + 120_000;
    localStorage.setItem('ricettario-timers', JSON.stringify([{
      id: JSON.stringify(['step-1', 'Pasta']),
      stepId: 'step-1',
      label: 'Pasta',
      type: 'COUNTDOWN',
      totalSeconds: 300,
      timeRemaining: 300,
      isRunning: true,
      expiresAt
    }]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Timer);

    expect(service.activeTimers()).toHaveLength(1);
    expect(service.activeTimers()[0].timeRemaining).toBe(120);
    expect(service.activeTimers()[0].isRunning).toBe(true);
  });

  it('should complete a timer early and emit its step when it is the last timer', () => {
    const completed: string[] = [];
    const subscription = service.onItemCompleted.subscribe(({ stepId }) => completed.push(stepId));
    service.startCountdown('step-1', { minutes: 5, label: 'Test timer' });
    const timerId = service.activeTimers()[0].id;

    service.releaseHoldOrComplete(timerId);

    expect(service.activeTimers()).toEqual([]);
    expect(completed).toEqual(['step-1']);
    subscription.unsubscribe();
  });
});
