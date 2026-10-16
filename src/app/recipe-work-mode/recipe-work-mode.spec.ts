import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeWorkMode } from './recipe-work-mode';

describe('RecipeDetail', () => {
  let component: RecipeWorkMode;
  let fixture: ComponentFixture<RecipeWorkMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeWorkMode],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeWorkMode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
