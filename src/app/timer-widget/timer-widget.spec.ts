import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimerWidget } from './timer-widget';

describe('TimerWidget', () => {
  let component: TimerWidget;
  let fixture: ComponentFixture<TimerWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
