import { Component, OnInit, AfterViewInit, NgZone, ViewChild, ElementRef, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { interval, Scheduler, fromEvent } from 'rxjs';
import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';
import { withLatestFrom, scan, map, startWith, filter, switchMap, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { util } from './rx-utility';
import { Store } from '@ngrx/store';
import { TaskState, DELETE, DONE, MOVE_UP, MOVE_DOWN, EDIT_MODE_ON, EDIT_MODE_OFF } from './swipe-task-store';

@Component({
    selector: 'task-item',
    template: `
    <div [ngClass]="{'itemdraggedItem': this.state.dragging === true}"
        [ngStyle]="itemStyle"
        #draggable>
        <div class="itemTitle">
            <task-input [id]="id" [title]="title" *ngIf="edited === true"></task-input>
            <span *ngIf="edited !== true">{{title}}</span>
        </div>
    </div>
  `
})
export class TaskItemComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('draggable') draggable: ElementRef;
    @Output() editModeOff = new EventEmitter<string>();
    @Output() editModeOn = new EventEmitter<string>();
    @Output() done = new EventEmitter<string>();
    @Output() delete = new EventEmitter<string>();
    @Output() moveUp = new EventEmitter<string>();
    @Output() moveDown = new EventEmitter<string>();
    @Input() id: string;
    @Input() title: string;
    @Input() key: string;
    @Input() editMode: boolean;
    @Input() edited: boolean;
    @Input() color: string;

    state = {
        x: 0,
        y: 0,
        height: 52,
        dragging: false,
        shrinking: false
    };
    itemHeight = 52;
    relativePosition = 0; // Relative position of the item during rearrange
    terminate = false;

    constructor(private zone: NgZone, private store: Store<TaskState>) { }

    ngOnInit() {
    }

    get itemStyle() {
        /*  console.log({
             backgroundColor: this.color,
             left: this.state.x,
             height: this.state.height,
             minHeight: `${this.state.shrinking ? 0 : this.itemHeight}px`,
             opacity: (this.editMode === true && this.edited === false ? 0.3 : 1)
         }); */

        return {
            backgroundColor: this.color,
            left: this.state.x,
            height: this.state.height,
            minHeight: this.state.shrinking ? 0 : this.itemHeight,
            opacity: (this.editMode === true && this.edited === false ? 0.3 : 1)
        };
    }

    setState(value: any) {
        // console.log({ ...this.state, ...value });
        this.state = { ...this.state, ...value };

        this.zone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
                this.draggable.nativeElement.style.transform = `translateX(${this.state.x}px)`;
                this.draggable.nativeElement.style.opacity = `${(this.editMode === true && this.edited === false ? 0.3 : 1)}`;

            });
        });
        return { ...this.state, ...value };
    }

    ngAfterViewInit() {
        // console.log(this.color);
        const observables = util.getDragObservables(this.draggable.nativeElement);

        observables.holds.forEach(() => {
            this.relativePosition = 0;
            this.setState({ dragging: true });
        });

        observables.dragMoves.forEach(coordinate => {
            if (this.editMode === false) {

                let y = coordinate.y - this.relativePosition * this.itemHeight;
                if (y > this.itemHeight) {
                    this.relativePosition++;
                    this.dispatchAction(MOVE_DOWN);
                    this.moveDown.emit(this.id);
                } else if (y < - this.itemHeight) {
                    this.relativePosition--;
                    this.dispatchAction(MOVE_UP);
                    this.moveUp.emit(this.id);
                }
                y = coordinate.y - this.relativePosition * this.itemHeight;
                this.setState({ x: coordinate.x / 2, y });
            }
        });

        observables.dragMoveEnds.forEach(coordinate => {
            this.setState({
                x: 0,
                y: 0,
                dragging: false
            });
        });

        observables.clicks.forEach(() => {
            if (this.editMode === false) {
                this.dispatchAction(EDIT_MODE_ON);
                this.editModeOn.emit(this.id);
            } else if (this.edited === false) {
                this.dispatchAction(EDIT_MODE_OFF);
                this.editModeOff.emit(this.id);
            }
        });

        observables.horizontalMoves.forEach(coordinate => {
            if (this.editMode === false) {
                this.setState({ x: coordinate.x });
            }
        });

        observables.horizontalMoveEnds.forEach(coordinate => {
            if (this.editMode === false) {
                if (coordinate.x > 40) {
                    console.log('slide done');
                    this.slideDone()
                        .then(() => this.shrink())
                        .then(() => this.emitDone());
                } else if (coordinate.x < -40) {
                    console.log('slide delete');
                    this.slideDelete()
                        .then(() => this.shrink())
                        .then(() => this.emitDelete());
                } else {
                    console.log('slide back');
                    this.slideBack();
                }
            }
        });
    }

    ngOnDestroy() {
        if (this.terminate === false && this.editMode === false && this.title === '') {
            this.terminate = true;
            this.slideDelete()
                .then(() => this.shrink())
                .then(() => this.emitDelete());
        }
    }

    slideBack() {
        let lastTime = null;

        const slideBackAnimation = (time => {
            let x = null;
            if (lastTime !== null) {
                const delta = (time - lastTime) * 0.3;
                if (this.state.x > 0) {
                    x = Math.max(0, this.state.x - delta);
                } else {
                    x = Math.min(0, this.state.x + delta);
                }
                this.setState({ x });
            }
            lastTime = time;
            if (x !== 0) {
                this.zone.runOutsideAngular(() => {
                    requestAnimationFrame(slideBackAnimation);
                });
            }

        }).bind(this);
        this.zone.runOutsideAngular(() => {
            requestAnimationFrame(slideBackAnimation);
        });
    }

    slideDone() {
        let lastTime = null;

        const slideDoneAnimation = ((resolve, reject, time) => {
            let x = null;
            if (lastTime !== null) {
                const delta = (time - lastTime) * 1;
                x = this.state.x + delta;
                this.setState({ x });
            }
            lastTime = time;
            if (x < 375) {
                this.zone.runOutsideAngular(() => {
                    requestAnimationFrame((timestamp) => {
                        slideDoneAnimation(resolve, reject, timestamp);
                    });
                });
            } else {
                resolve();
            }
        }).bind(this);

        return new Promise((resolve, reject) => {
            this.zone.runOutsideAngular(() => {
                requestAnimationFrame((timestamp) => {
                    slideDoneAnimation(resolve, reject, timestamp);
                });
            });
        });
    }

    slideDelete() {
        let lastTime = null;

        const slideDeleteAnimation = ((resolve, reject, time) => {
            let x = null;
            if (lastTime !== null) {
                const delta = (time - lastTime) * 1;
                x = this.state.x - delta;
                this.setState({ x });
            }
            lastTime = time;
            if (x > -375) {
                this.zone.runOutsideAngular(() => {
                    requestAnimationFrame((timestamp) => {
                        slideDeleteAnimation(resolve, reject, timestamp);
                    });
                });
            } else {
                resolve();
            }
        }).bind(this);

        return new Promise((resolve, reject) => {
            this.zone.runOutsideAngular(() => {
                requestAnimationFrame((time) => {
                    slideDeleteAnimation(resolve, reject, time);
                });
            });
        });
    }

    shrink() {
        this.setState({
            shrinking: true,
            height: parseInt(getComputedStyle(this.draggable.nativeElement).getPropertyValue('height'))
        });

        let lastTime = null;

        const shrinkAnimation = ((resolve, reject, time) => {
            let height = this.state.height;
            if (lastTime !== null) {
                const delta = (time - lastTime) * 0.5;
                height = Math.max(0, this.state.height - delta);
                this.setState({ height });
            }
            lastTime = time;
            if (height > 0) {
                this.zone.runOutsideAngular(() => {
                    requestAnimationFrame((timestamp) => {
                        shrinkAnimation(resolve, reject, timestamp);
                    });
                });
            } else {
                resolve();
            }
        }).bind(this);

        return new Promise((resolve, reject) => {
            this.zone.runOutsideAngular(() => {
                requestAnimationFrame((time) => {
                    shrinkAnimation(resolve, reject, time);
                });
            });
        });
    }

    emitDone() {
        this.store.dispatch({ type: DONE, id: this.id });
        this.done.emit(this.id);
    }

    emitDelete() {
        this.store.dispatch({ type: DELETE, id: this.id });
        this.delete.emit(this.id);
    }

    dispatchAction(type) {
        this.store.dispatch({ type, id: this.id });
    }

}
