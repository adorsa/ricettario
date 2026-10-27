import { signal, computed, Service, inject, effect } from '@angular/core';
import { Subject } from 'rxjs';
import { I18n } from './i18n/i18n';
import { StepTimer } from './timer.model';
import { Supabase } from './supabase';

const STORAGE_PREFIX = 'ricettario-timers:';

export interface ActiveTimer {
  id: string;
  userId: string | null;
  stepId: string;
  label: string;
  type: 'COUNTDOWN' | 'ON_HOLD';
  totalSeconds: number;
  timeRemaining: number;
  isRunning: boolean;
  expiresAt: number | null;
  intervalId: any;
}

@Service()
export class Timer {
  private i18n = inject(I18n);
  private supabase = inject(Supabase);
  private activeTimersSignal = signal<ActiveTimer[]>([]);
  private activeUserId: string | null = null;

  activeTimers = computed(() => this.activeTimersSignal());

  private onItemCompletedSubject = new Subject<{ stepId: string }>();
  onItemCompleted = this.onItemCompletedSubject.asObservable();
  private readonly onVisibilityChange = () => {
    if (document.hidden) return;
    this.activeTimersSignal()
      .filter(timer => timer.type === 'COUNTDOWN' && timer.isRunning)
      .forEach(timer => this.tick(timer.id));
  };
  private userEffect = effect(() => {
    if (this.supabase.authReady()) {
      this.activateUser(this.supabase.currentUser()?.id ?? null);
    }
  });

  constructor() {
    if (this.supabase.authReady()) {
      this.activateUser(this.supabase.currentUser()?.id ?? null);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  startCountdown(stepId: string, stepTimer: StepTimer) {
    const label = stepTimer.label || this.i18n.t('timer.defaultLabel');
    const userId = this.activeUserId;
    const id = this.getTimerId(userId, stepId, label);
    const totalSeconds = stepTimer.minutes * 60;
    this.removeTimerOrHold(id);
    const newTimer: ActiveTimer = {
      id,
      userId,
      stepId,
      label,
      type: 'COUNTDOWN',
      totalSeconds,
      timeRemaining: totalSeconds,
      isRunning: true,
      expiresAt: Date.now() + totalSeconds * 1000,
      intervalId: null
    };

    newTimer.intervalId = setInterval(() => {
      this.tick(id);
    }, 1000);

    this.activeTimersSignal.update(timers => [...timers, newTimer]);
    this.persistTimers();
  }

  putOnHold(stepId: string, label: string) {
    const timerLabel = label || this.i18n.t('timer.onHold');
    const userId = this.activeUserId;
    const id = this.getTimerId(userId, stepId, timerLabel);
    this.removeTimerOrHold(id);

    const newHoldItem: ActiveTimer = {
      id,
      userId,
      stepId,
      label: timerLabel,
      type: 'ON_HOLD',
      totalSeconds: 0,
      timeRemaining: 0,
      isRunning: false,
      expiresAt: null,
      intervalId: null
    };

    this.activeTimersSignal.update(timers => [...timers, newHoldItem]);
    this.persistTimers();
  }

  private tick(id: string) {
    let expiredStepId: string | null = null;
    this.activeTimersSignal.update(timers => timers.map(timer => {
      if (timer.id !== id || timer.type !== 'COUNTDOWN' || !timer.isRunning || timer.expiresAt === null) {
        return timer;
      }

      const timeRemaining = Math.max(0, Math.ceil((timer.expiresAt - Date.now()) / 1000));
      if (timeRemaining === 0) {
        clearInterval(timer.intervalId);
        expiredStepId = timer.stepId;
        this.playAlarm();
        return { ...timer, timeRemaining, isRunning: false, intervalId: null };
      }

      return { ...timer, timeRemaining };
    }));

    if (expiredStepId) {
      this.persistTimers();
      this.completeStepIfTimersAreDone(expiredStepId);
    }
  }

  releaseHoldOrComplete(timerId: string) {
    const timer = this.activeTimersSignal().find(item => item.id === timerId);
    if (!timer) return;

    this.removeTimerOrHold(timerId);
    this.completeStepIfTimersAreDone(timer.stepId);
  }

  pauseTimer(timerId: string) {
    let expiredStepId: string | null = null;
    this.activeTimersSignal.update(timers => timers.map(timer => {
      if (timer.id !== timerId || timer.type !== 'COUNTDOWN' || !timer.isRunning) return timer;

      clearInterval(timer.intervalId);
      const timeRemaining = timer.expiresAt === null
        ? timer.timeRemaining
        : Math.max(0, Math.ceil((timer.expiresAt - Date.now()) / 1000));
      if (timeRemaining === 0) expiredStepId = timer.stepId;
      return { ...timer, timeRemaining, isRunning: false, expiresAt: null, intervalId: null };
    }));
    this.persistTimers();
    if (expiredStepId) this.completeStepIfTimersAreDone(expiredStepId);
  }

  resumeTimer(timerId: string) {
    this.activeTimersSignal.update(timers => timers.map(timer => {
      if (timer.id !== timerId || timer.type !== 'COUNTDOWN' || timer.isRunning || timer.timeRemaining <= 0) {
        return timer;
      }

      const expiresAt = Date.now() + timer.timeRemaining * 1000;
      const intervalId = setInterval(() => this.tick(timerId), 1000);
      return { ...timer, expiresAt, isRunning: true, intervalId };
    }));
    this.persistTimers();
  }

  removeTimerOrHold(timerId: string) {
    const item = this.activeTimersSignal().find(timer => timer.id === timerId);
    if (item?.intervalId) clearInterval(item.intervalId);
    this.activeTimersSignal.update(timers => timers.filter(timer => timer.id !== timerId));
    this.persistTimers();
  }

  removeTimersForStep(stepId: string) {
    this.activeTimersSignal().filter(timer => timer.stepId === stepId).forEach(timer => {
      if (timer.intervalId) clearInterval(timer.intervalId);
    });
    this.activeTimersSignal.update(timers => timers.filter(timer => timer.stepId !== stepId));
    this.persistTimers();
  }

  checkExpiredTimersForSteps(stepIds: string[]) {
    for (const stepId of new Set(stepIds)) {
      const timers = this.activeTimersSignal().filter(timer => timer.stepId === stepId);
      if (timers.length > 0 && timers.every(timer =>
        timer.type === 'COUNTDOWN' && !timer.isRunning && timer.timeRemaining === 0
      )) {
        this.onItemCompletedSubject.next({ stepId });
      }
    }
  }

  getTimeRemainingMinutes(stepId: string): number {
    const countdowns = this.activeTimersSignal()
      .filter(timer => timer.stepId === stepId && timer.type === 'COUNTDOWN');
    if (countdowns.length === 0) return -1;
    return Math.min(...countdowns.map(timer => timer.timeRemaining)) / 60;
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  getProgress(timer: ActiveTimer): number {
    if (timer.type === 'ON_HOLD' || timer.totalSeconds === 0) return 0;
    return ((timer.totalSeconds - timer.timeRemaining) / timer.totalSeconds) * 100;
  }

  private playAlarm() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.log('AudioContext not supported or access not granted:', e);
    }
  }

  private getTimerId(userId: string | null, stepId: string, label: string): string {
    return JSON.stringify([userId, stepId, label]);
  }

  private completeStepIfTimersAreDone(stepId: string) {
    const timers = this.activeTimersSignal().filter(timer => timer.stepId === stepId);
    if (timers.length === 0 || timers.every(timer =>
      timer.type === 'COUNTDOWN' && !timer.isRunning && timer.timeRemaining === 0
    )) {
      this.onItemCompletedSubject.next({ stepId });
    }
  }

  private activateUser(userId: string | null) {
    if (userId === this.activeUserId) return;

    this.activeTimersSignal().forEach(timer => {
      if (timer.intervalId) clearInterval(timer.intervalId);
    });
    this.activeTimersSignal.set([]);
    this.activeUserId = userId;
    if (userId) this.restoreTimers(userId);
  }

  private getStorageKey(userId: string): string {
    return `${STORAGE_PREFIX}${userId}`;
  }

  private restoreTimers(userId: string) {
    const storageKey = this.getStorageKey(userId);
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;

      const persistedTimers = JSON.parse(saved) as Omit<ActiveTimer, 'intervalId'>[];
      const restored = persistedTimers.filter(timer =>
        typeof timer.id === 'string' &&
        timer.userId === userId &&
        typeof timer.stepId === 'string' &&
        typeof timer.label === 'string' &&
        (timer.type === 'COUNTDOWN' || timer.type === 'ON_HOLD')
      ).map(timer => {
        const timeRemaining = timer.type === 'COUNTDOWN' && timer.isRunning && typeof timer.expiresAt === 'number'
          ? Math.max(0, Math.ceil((timer.expiresAt - Date.now()) / 1000))
          : timer.timeRemaining;
        const isRunning = timer.type === 'COUNTDOWN' && timer.isRunning && timeRemaining > 0;
        const restoredTimer: ActiveTimer = {
          ...timer,
          timeRemaining,
          isRunning,
          expiresAt: isRunning ? timer.expiresAt : (timeRemaining === 0 ? timer.expiresAt : null),
          intervalId: null
        };
        if (isRunning) restoredTimer.intervalId = setInterval(() => this.tick(timer.id), 1000);
        return restoredTimer;
      });

      this.activeTimersSignal.set(restored);
      if (restored.length !== persistedTimers.length) this.persistTimers();
    } catch {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        this.activeTimersSignal.set([]);
      }
    }
  }

  private persistTimers() {
    const userId = this.activeUserId;
    if (!userId) return;

    try {
      const timers = this.activeTimersSignal();
      if (timers.length === 0) {
        localStorage.removeItem(this.getStorageKey(userId));
        return;
      }

      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(timers.map(({ intervalId, ...timer }) => timer)));
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }
}