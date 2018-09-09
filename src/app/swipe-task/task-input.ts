import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { Store, UPDATE } from '@ngrx/store';
import { TaskState, EDIT_MODE_OFF } from './swipe-task-store';

@Component({
    selector: 'task-input',
    template: `
  <input type="text" #task class="itemInput"
          [value]="title"
          (input)="update($event)" (keydown)="keyPressed($event)" (blur)="blur($event)"  />
  `,
  styles: [`
  `]
})
export class TaskInputComponent implements OnInit {
    @ViewChild('task') task: ElementRef;
    @Output() editModeOff = new EventEmitter<boolean>();
    @Input() id: string;
    @Input() title: string;

    constructor(private store: Store<TaskState>) { }

    ngOnInit() {
        this.task.nativeElement.focus();
    }

    update(event) {
        console.log(event);
        this.title = event.target.value;
        this.store.dispatch({ type: UPDATE, id: this.id, title: this.title });
    }

    keyPressed(event) {
        if (event.keyCode === 13) {  // Enter / Return key
            this.store.dispatch({ type: EDIT_MODE_OFF, id: this.id });
            this.editModeOff.emit(true);
        }
    }

    blur(event) {
        this.store.dispatch({ type: EDIT_MODE_OFF, id: this.id });
        this.editModeOff.emit(true);
    }

}
