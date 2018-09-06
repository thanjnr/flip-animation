import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwipeablePagesComponent } from './swipeable-pages.component';

describe('SwipeablePagesComponent', () => {
  let component: SwipeablePagesComponent;
  let fixture: ComponentFixture<SwipeablePagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwipeablePagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwipeablePagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
