import { Injectable, signal, computed, output, Service } from '@angular/core';
import { Subject } from 'rxjs';

export interface ActiveTimer {
  id: string;
  label: string;
  type: 'COUNTDOWN' | 'ON_HOLD';
  totalSeconds: number;
  timeRemaining: number;
  isRunning: boolean;
  intervalId: any;
}

@Service()
export class Timer {
  private activeTimersSignal = signal<ActiveTimer[]>([]);

  activeTimers = computed(() => this.activeTimersSignal());

  private onItemCompletedSubject = new Subject<{ stepId: string }>();
  onItemCompleted = this.onItemCompletedSubject.asObservable();

  startCountdown(stepId: string, minutes: number, label: string) {
    this.removeTimerOrHold(stepId);

    const totalSeconds = minutes * 60;
    const newTimer: ActiveTimer = {
      id: stepId,
      label: label || 'Timer',
      type: 'COUNTDOWN',
      totalSeconds: totalSeconds,
      timeRemaining: totalSeconds,
      isRunning: true,
      intervalId: null
    };

    newTimer.intervalId = setInterval(() => {
      this.tick(stepId);
    }, 1000);

    this.activeTimersSignal.update(timers => [...timers, newTimer]);
  }

  putOnHold(stepId: string, label: string) {
    this.removeTimerOrHold(stepId);

    const newHoldItem: ActiveTimer = {
      id: stepId,
      label: label || 'On hold',
      type: 'ON_HOLD',
      totalSeconds: 0,
      timeRemaining: 0,
      isRunning: false,
      intervalId: null
    };

    this.activeTimersSignal.update(timers => [...timers, newHoldItem]);
  }

  private tick(stepId: string) {
    this.activeTimersSignal.update(timers => 
      timers.map(t => {
        if (t.id === stepId && t.type === 'COUNTDOWN') {
          if (t.timeRemaining <= 1) {
            clearInterval(t.intervalId);
            this.playAlarm();
            
            this.onItemCompletedSubject.next({ stepId: t.id });
            return { ...t, timeRemaining: 0, isRunning: false };
          }
          return { ...t, timeRemaining: t.timeRemaining - 1 };
        }
        return t;
      })
    );
  }

  releaseHoldOrComplete(stepId: string) {
    this.removeTimerOrHold(stepId);
    this.onItemCompletedSubject.next({ stepId });
  }

  pauseTimer(stepId: string) {
    this.activeTimersSignal.update(timers => 
      timers.map(t => {
        if (t.id === stepId && t.type === 'COUNTDOWN' && t.isRunning) {
          clearInterval(t.intervalId);
          return { ...t, isRunning: false, intervalId: null };
        }
        return t;
      })
    );
  }

  resumeTimer(stepId: string) {
    this.activeTimersSignal.update(timers => 
      timers.map(t => {
        if (t.id === stepId && t.type === 'COUNTDOWN' && !t.isRunning) {
          const intervalId = setInterval(() => this.tick(stepId), 1000);
          return { ...t, isRunning: true, intervalId };
        }
        return t;
      })
    );
  }

  removeTimerOrHold(stepId: string) {
    const item = this.activeTimersSignal().find(t => t.id === stepId);
    if (item && item.intervalId) {
      clearInterval(item.intervalId);
    }
    this.activeTimersSignal.update(timers => timers.filter(t => t.id !== stepId));
  }

  getTimeRemainingMinutes(stepId: string): number {
    const item = this.activeTimersSignal().find(t => t.id === stepId);
    if (!item || item.type !== 'COUNTDOWN') return -1;
    return item.timeRemaining / 60;
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
}