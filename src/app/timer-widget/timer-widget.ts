import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timer } from '../timer';

@Component({
  selector: 'app-timer-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-widget.html',
  styleUrl: './timer-widget.css'
})
export class TimerWidgetComponent {
  public timerService = inject(Timer);
}
