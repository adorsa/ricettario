import { Injectable, signal, computed, Service } from '@angular/core';

@Service()
export class Timer {
  private timerId: any = null;

  private timeRemainingSignal = signal<number>(0);
  private totalTimeSignal = signal<number>(0);
  private isRunningSignal = signal<boolean>(false);
  private labelSignal = signal<string>('Timer');

  timeRemaining = computed(() => this.timeRemainingSignal());
  isRunning = computed(() => this.isRunningSignal());
  label = computed(() => this.labelSignal());

  progressPercentage = computed(() => {
    if (this.totalTimeSignal() === 0) return 0;
    return ((this.totalTimeSignal() - this.timeRemainingSignal()) / this.totalTimeSignal()) * 100;
  });

  formattedTime = computed(() => {
    const minutes = Math.floor(this.timeRemainingSignal() / 60);
    const seconds = this.timeRemainingSignal() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  startNewTimer(minutes: number, label: string) {
    this.stopAndClear();

    const seconds = minutes * 60;
    this.totalTimeSignal.set(seconds);
    this.timeRemainingSignal.set(seconds);
    this.labelSignal.set(label);
    this.isRunningSignal.set(true);

    this.timerId = setInterval(() => {
      this.timeRemainingSignal.update(time => {
        if (time <= 1) {
          this.stopAndClear();
          this.playAlarm();
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  }

  pauseTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      this.isRunningSignal.set(false);
    }
  }

  resumeTimer() {
    if (this.isRunningSignal() || this.timeRemainingSignal() <= 0) return;

    this.isRunningSignal.set(true);
    this.timerId = setInterval(() => {
      this.timeRemainingSignal.update(time => {
        if (time <= 1) {
          this.stopAndClear();
          this.playAlarm();
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  }

  resetTimer() {
    this.stopAndClear();
  }

  private stopAndClear() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.timeRemainingSignal.set(0);
    this.totalTimeSignal.set(0);
    this.isRunningSignal.set(false);
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
