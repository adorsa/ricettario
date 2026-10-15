import { Injectable, signal, computed } from '@angular/core';

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  timeRemaining: number;
  isRunning: boolean;
  intervalId: any;
}

@Injectable({
  providedIn: 'root'
})
export class Timer {
  private activeTimersSignal = signal<ActiveTimer[]>([]);

  activeTimers = computed(() => this.activeTimersSignal());

  startNewTimer(minutes: number, label: string) {
    const totalSeconds = minutes * 60;
    const timerId = 'timer_' + Date.now();

    const newTimer: ActiveTimer = {
      id: timerId,
      label: label || 'Timer',
      totalSeconds: totalSeconds,
      timeRemaining: totalSeconds,
      isRunning: true,
      intervalId: null
    };

    newTimer.intervalId = setInterval(() => {
      this.tick(timerId);
    }, 1000);

    this.activeTimersSignal.update(timers => [...timers, newTimer]);
  }

  private tick(timerId: string) {
    this.activeTimersSignal.update(timers => 
      timers.map(t => {
        if (t.id === timerId) {
          if (t.timeRemaining <= 1) {
            clearInterval(t.intervalId);
            this.playAlarm();
            setTimeout(() => this.removeTimer(timerId), 60000);
            return { ...t, timeRemaining: 0, isRunning: false };
          }
          return { ...t, timeRemaining: t.timeRemaining - 1 };
        }
        return t;
      })
    );
  }

  pauseTimer(timerId: string) {
    this.activeTimersSignal.update(timers => 
      timers.map(t => {
        if (t.id === timerId && t.isRunning) {
          clearInterval(t.intervalId);
          return { ...t, isRunning: false, intervalId: null };
        }
        return t;
      })
    );
  }

  resumeTimer(timerId: string) {
    this.activeTimersSignal.update(timers => 
      timers.map(t => {
        if (t.id === timerId && !t.isRunning) {
          const intervalId = setInterval(() => this.tick(timerId), 1000);
          return { ...t, isRunning: true, intervalId };
        }
        return t;
      })
    );
  }

  removeTimer(timerId: string) {
    const timer = this.activeTimersSignal().find(t => t.id === timerId);
    if (timer && timer.intervalId) {
      clearInterval(timer.intervalId);
    }
    this.activeTimersSignal.update(timers => timers.filter(t => t.id !== timerId));
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  getProgress(timer: ActiveTimer): number {
    if (timer.totalSeconds === 0) return 0;
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
