import { Component, OnInit, Inject, AfterViewInit, NgZone, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { interval, Scheduler, fromEvent } from 'rxjs';
import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';
import { withLatestFrom, scan, map, startWith, filter, switchMap, takeUntil, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'task-input',
    template: `
  <input type="text" #task className="itemInput"
          [value]="title"
          onChange="update($event)" onKeyDown="keyPressed($event)" onBlur="blur($event)"  />
  `
})
export class TaskInputComponent implements OnInit {
    @ViewChild('task') task: ElementRef;
    @Output() editModeOff = new EventEmitter<boolean>();
    id: string;
    title: string;

    constructor() { }

    ngOnInit() {
        this.task.nativeElement.focus();
    }

    update(event) {
        this.title = event.target.value;
    }

    keyPressed(event) {
        if (event.keyCode == 13) {  // Enter / Return key
            this.editModeOff.emit(true);
        }
    }

    blur(event) {
        this.editModeOff.emit(true);
    }

}
