import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RxjsDragComponent } from './rxjs-drag.component';

describe('RxjsDragComponent', () => {
  let component: RxjsDragComponent;
  let fixture: ComponentFixture<RxjsDragComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RxjsDragComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RxjsDragComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
