import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwipeTaskComponent } from './swipe-task.component';

describe('SwipeTaskComponent', () => {
  let component: SwipeTaskComponent;
  let fixture: ComponentFixture<SwipeTaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwipeTaskComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwipeTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
