import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Timer } from './timer';
import { Supabase } from './supabase';

describe('Timer', () => {
  let service: Timer;
  let currentUser: ReturnType<typeof signal<{ id: string } | null>>;

  beforeEach(() => {
    currentUser = signal<{ id: string } | null>({ id: 'user-1' });
    TestBed.configureTestingModule({
      providers: [{
        provide: Supabase,
        useValue: { currentUser: () => currentUser(), authReady: () => true }
      }]
    });
    service = TestBed.inject(Timer);
  });

  afterEach(() => {
    vi.useRealTimers();
    service.activeTimers().forEach(timer => service.removeTimerOrHold(timer.id));
    TestBed.resetTestingModule();
    localStorage.removeItem('ricettario-timers:user-1');
    localStorage.removeItem('ricettario-timers:user-2');
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
    expect(JSON.parse(localStorage.getItem('ricettario-timers:user-1')!)).toHaveLength(1);
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
    localStorage.setItem('ricettario-timers:user-1', JSON.stringify([{
      id: JSON.stringify(['user-1', 'step-1', 'Pasta']),
      userId: 'user-1',
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

  it('should report a timer that expired while the app was closed', () => {
    localStorage.setItem('ricettario-timers:user-1', JSON.stringify([{
      id: JSON.stringify(['user-1', 'step-1', 'Pasta']),
      userId: 'user-1',
      stepId: 'step-1',
      label: 'Pasta',
      type: 'COUNTDOWN',
      totalSeconds: 60,
      timeRemaining: 60,
      isRunning: true,
      expiresAt: Date.now() - 1000
    }]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Timer);
    const completed: string[] = [];
    const subscription = service.onItemCompleted.subscribe(({ stepId }) => completed.push(stepId));

    service.checkExpiredTimersForSteps(['step-1']);

    expect(service.activeTimers()[0].timeRemaining).toBe(0);
    expect(completed).toEqual(['step-1']);
    subscription.unsubscribe();
  });

  it('should isolate in-memory and persisted timers when the authenticated user changes', async () => {
    service.startCountdown('step-1', { minutes: 5, label: 'Pasta' });
    const userOneTimer = localStorage.getItem('ricettario-timers:user-1');

    currentUser.set({ id: 'user-2' });
    await TestBed.whenStable();

    expect(service.activeTimers()).toEqual([]);
    expect(localStorage.getItem('ricettario-timers:user-1')).toBe(userOneTimer);
    service.startCountdown('step-2', { minutes: 2, label: 'Salsa' });

    expect(JSON.parse(localStorage.getItem('ricettario-timers:user-2')!)[0].userId).toBe('user-2');
    expect(JSON.parse(localStorage.getItem('ricettario-timers:user-1')!)[0].userId).toBe('user-1');
  });

  it('should emit completion automatically when a countdown deadline passes', () => {
    vi.useFakeTimers();
    const completed: string[] = [];
    const subscription = service.onItemCompleted.subscribe(({ stepId }) => completed.push(stepId));
    service.startCountdown('step-1', { minutes: 1, label: 'Pasta' });

    vi.setSystemTime(new Date(Date.now() + 60_000));
    vi.advanceTimersByTime(1000);

    expect(completed).toEqual(['step-1']);
    expect(service.activeTimers()[0].timeRemaining).toBe(0);
    subscription.unsubscribe();
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
