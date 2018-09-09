import { Component, OnInit, Inject, AfterViewInit, NgZone, ViewChild, ElementRef, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { interval, Scheduler, fromEvent } from 'rxjs';
import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';
import { withLatestFrom, scan, map, startWith, filter, switchMap, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { util } from './rx-utility';
import { TaskState } from './swipe-task-store';

@Component({
    selector: 'task-list',
    template: `
    <div id='container'>
          <div id="list" [ngStyle]="{'top': Math.max(0, state.y)}" #draggable >
            
            <div id="newItemPerspective" [ngStyle]="{'height': Math.max(0, state.y)}">
                <div id="newItem" [ngStyle]="{'transform': 'rotateX(' + newItemRotate + 'deg)'}">

                <!-- The fake input's role is to force the keyboard to show up on mobile devices. 
                On mobile devices the focus can only be set to an input field from code if:
                - the focus method is called as a direct result of a user interaction or
                - the keyboard is already shown.
                In this case the user interaction happens to be in this component therefore,
                the focus can be set here, but the item desired focus is two components deep,
                so the focus is set for the fake input to force the keyboard to show up, 
                then reset by the real input field once the keyboard is already there.
                -->
                <input id="fakeInput" type="text" #fakeinput onBlur="onFakeInputBlur()"/>

                <task-item 
                  [key]="newItemId" [id]="newItemId" 
                  [title]="state.newItemTitle" [color]="colors[0]"></task-item>
              </div>
            </div>        
            <task-item *ngFor="let item in items; let i = index"
                [key]="item.id" [id]="item.id" 
                [title]="item.title" [color]="colors[index]"
                [editMode]="editMode" 
                [edited]="props.currentEdit.itemId === item.id || props.currentEdit.itemId === 'FIRST' && index === 0}>
            </task-item>
          </div>
        </div>
  `
})
export class TaskListComponent implements OnInit, AfterViewInit {
    @ViewChild('draggable') draggable: ElementRef;
    @ViewChild('fakeinput') fakeInput: ElementRef;
    @Output() appendTop = new EventEmitter<string>();   
    @Input() props: TaskState;
    @Input() editMode: boolean;

    state = {
        y: 0,
        newItemTitle: 'Pull to Create Item',
        fakeInputVisibile: false
    };
    newItemId = 0;
    itemHeight = 52;    
    newItemRotate = Math.max(0, Math.min(90, Math.asin(-Math.min(this.itemHeight, this.state.y)/this.itemHeight)/Math.PI*180+90));

    constructor() { }

    ngOnInit() {
    }

    setState(value: any) {
        return { ...this.state, ...value };
    }

    ngAfterViewInit() {
        const observables = util.getDragObservables(this.draggable);

        observables.verticalMoves.forEach(coordinate => {
            if (this.editMode === false) {
                if (coordinate.y > this.itemHeight) {
                    this.setState({
                        newItemTitle: 'Release to Create Item',
                        y: coordinate.y
                    });
                } else {
                    this.setState({
                        newItemTitle: 'Pull to Create Item',
                        y: coordinate.y
                    });
                }

            }
        });

        observables.verticalMoveEnds.forEach(coordinate => {
            if (this.editMode === false) {
                if (coordinate.y > this.itemHeight) {
                    this.setState({
                        newItemTitle: '',
                        fakeInputVisibile: true
                    });
                    this.fakeInput.nativeElement.focus();
                    this.slideToEdit()
                        .then(this.appendTop.emit);
                } else {
                    this.slideBack();
                }
            }
        });
    }

    slideBack() {
        let lastTime = null;

        const slideBackAnimation = (time => {
            let y = null;
            if (lastTime !== null) {
                const delta = (time - lastTime) * 0.3;
                if (this.state.y > 0) {
                    y = Math.max(0, this.state.y - delta);
                } else {
                    y = Math.min(0, this.state.y + delta);
                }
                this.setState({ y });
            }
            lastTime = time;
            if (y !== 0) requestAnimationFrame(slideBackAnimation);
        }).bind(this);

        requestAnimationFrame(slideBackAnimation)
    }

    slideToEdit() {
        let lastTime = null;

        const slideToEditAnimation = ((resolve, reject, time) => {
            let y = this.state.y;
            if (lastTime !== null) {
                const delta = (time - lastTime) * 0.7;
                y = Math.max(this.itemHeight, this.state.y - delta);
                this.setState({ y });
            }
            console.log(y);
            lastTime = time;
            if (y > this.itemHeight) {
                requestAnimationFrame((time) => { slideToEditAnimation(resolve, reject, time) });
            } else {
                this.setState({ y: 0 });
                resolve();
            }
        }).bind(this);

        return new Promise((resolve, reject) => {
            requestAnimationFrame((time) => {
                slideToEditAnimation(resolve, reject, time)
            });
        });
    }

    onFakeInputBlur() {
        this.setState({ fakeInputVisibile: false });
    }
}
