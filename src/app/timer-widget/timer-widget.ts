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
export class TimerWidget {
  public timerService = inject(Timer);
}
