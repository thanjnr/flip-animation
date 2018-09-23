import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwipeablePagesConsumerComponent } from './swipeable-pages-consumer.component';

describe('SwipeablePagesConsumerComponent', () => {
  let component: SwipeablePagesConsumerComponent;
  let fixture: ComponentFixture<SwipeablePagesConsumerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwipeablePagesConsumerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwipeablePagesConsumerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
