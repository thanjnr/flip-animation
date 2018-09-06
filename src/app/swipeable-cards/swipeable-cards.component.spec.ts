import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwipeableCardsComponent } from './swipeable-cards.component';

describe('SwipeableCardsComponent', () => {
  let component: SwipeableCardsComponent;
  let fixture: ComponentFixture<SwipeableCardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwipeableCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwipeableCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
