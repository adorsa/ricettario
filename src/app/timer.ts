import { signal, computed, Service, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { I18n } from './i18n/i18n';
import { StepTimer } from './timer.model';

const STORAGE_KEY = 'ricettario-timers';

export interface ActiveTimer {
  id: string;
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
  private activeTimersSignal = signal<ActiveTimer[]>([]);

  activeTimers = computed(() => this.activeTimersSignal());

  private onItemCompletedSubject = new Subject<{ stepId: string }>();
  onItemCompleted = this.onItemCompletedSubject.asObservable();
  private readonly onVisibilityChange = () => {
    if (document.hidden) return;
    this.activeTimersSignal()
      .filter(timer => timer.type === 'COUNTDOWN' && timer.isRunning)
      .forEach(timer => this.tick(timer.id));
  };

  constructor() {
    this.restoreTimers();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  startCountdown(stepId: string, stepTimer: StepTimer) {
    const label = stepTimer.label || this.i18n.t('timer.defaultLabel');
    const id = this.getTimerId(stepId, label);
    const totalSeconds = stepTimer.minutes * 60;
    this.removeTimerOrHold(id);
    const newTimer: ActiveTimer = {
      id,
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
    const id = this.getTimerId(stepId, timerLabel);
    this.removeTimerOrHold(id);

    const newHoldItem: ActiveTimer = {
      id,
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

  private getTimerId(stepId: string, label: string): string {
    return JSON.stringify([stepId, label]);
  }

  private completeStepIfTimersAreDone(stepId: string) {
    const timers = this.activeTimersSignal().filter(timer => timer.stepId === stepId);
    if (timers.length === 0 || timers.every(timer =>
      timer.type === 'COUNTDOWN' && !timer.isRunning && timer.timeRemaining === 0
    )) {
      this.onItemCompletedSubject.next({ stepId });
    }
  }

  private restoreTimers() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const persistedTimers = JSON.parse(saved) as Omit<ActiveTimer, 'intervalId'>[];
      const restored = persistedTimers.filter(timer =>
        typeof timer.id === 'string' &&
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
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        this.activeTimersSignal.set([]);
      }
    }
  }

  private persistTimers() {
    try {
      const timers = this.activeTimersSignal();
      if (timers.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(timers.map(({ intervalId, ...timer }) => timer)));
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }
}