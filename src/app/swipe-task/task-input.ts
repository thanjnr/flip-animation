import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { TaskState, EDIT_MODE_OFF, UPDATE } from './swipe-task-store';

@Component({
    selector: 'task-input',
    template: `
  <input type="text" #task class="itemInput"
          [value]="title"
          (change)="update($event)" (keydown)="keyPressed($event)" (blur)="blur($event)"  />
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
        console.log(event.target.value);
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

/*
// REACT: Item Input
const ItemInput = (() => {
    class UnconnectedItemInput extends React.Component {
      constructor({id, title}) {
        super({id, title});
  
        this.keyPressed = this.keyPressed.bind(this);
        this.update = this.update.bind(this);
        this.blur = this.blur.bind(this);
      }
      
      update(event) {
        this.props.update(this.props.id, event.target.value);
      }
  
      keyPressed(event) {
        if (event.keyCode == 13) {  // Enter / Return key
          this.props.editModeOff();
        }
      }
  
      blur(event) {
        this.props.editModeOff();
      }
  
      render() {
        return (
          <input type="text" className="itemInput"
            value={this.props.title} 
            onChange={this.update} onKeyDown={this.keyPressed} onBlur={this.blur}
            ref={(input) => { this.input = input; }} />
        );
      }
  
      componentDidMount() {
        this.input.focus();
        // Unrelated curiosity: How to trigger a touch event from code: https://w3c.github.io/touch-events/#touchevent-interface
      }
    }
  
    const itemInputMapDispatchToProps = (dispatch, ownProps) => {
      return {
        editModeOff: () => {
          dispatch({ type: 'EDIT_MODE_OFF' });
        },
        update: (id, title) => {
          dispatch({ type: 'UPDATE', id, title });
        },
      }
    }
    return connect(null, itemInputMapDispatchToProps)(UnconnectedItemInput);
  })();
  
  ReactDOM.render(
    <Provider store={store}>
      <List />
    </Provider>,
    document.getElementById('content')
  );
   */
