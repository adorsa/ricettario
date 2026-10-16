import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timer } from '../timer';
import { ActiveTimer } from '../timer';
import { I18n } from '../i18n/i18n';

@Component({
  selector: 'app-timer-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-widget.html'
})
export class TimerWidget {
  public timerService = inject(Timer);
  public i18n = inject(I18n);

  activeTooltipId = signal<string | null>(null);

  toggleTooltip(stepId: string) {
    this.activeTooltipId.update(current => current === stepId ? null : stepId);
  }

  calculateDashOffset(item: ActiveTimer): number {
    if (item.totalSeconds === 0) return 100.53; //Circumference of a circle of radius 16
    const progress = (item.totalSeconds - item.timeRemaining) / item.totalSeconds;
    return 100.53 - (progress * 100.53);
  }

  getMinutesLeftStr(item: ActiveTimer): string {
    const mins = Math.ceil(item.timeRemaining / 60);
    return mins.toString();
  }

  getActiveTimerItem(): ActiveTimer | null {
    const activeId = this.activeTooltipId();
    if (!activeId) return null;
    return this.timerService.activeTimers().find(t => t.id === activeId) || null;
}
}
