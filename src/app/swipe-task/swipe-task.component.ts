import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TaskState } from './swipe-task-store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-swipe-task',
  templateUrl: './swipe-task.component.html',
  styleUrls: ['./swipe-task.component.scss']
})
export class SwipeTaskComponent implements OnInit {
  items: Observable<any[]>;

  constructor(private store: Store<TaskState>){
		this.items = this.store.select('items');
	}

  ngOnInit() {
  }
}

/* 
// REACT: List
const List = (() => {
  class UnconnectedList extends React.Component {
    constructor({id, title, color, edited}) {
      super({id, title, color, edited});

      this.state = {
        y: 0,
        newItemTitle: 'Pull to Create Item',
        fakeInputVisibile: false
      };

      this.newItemId = 0;
      this.itemHeight = 52;

      this.slideBack = this.slideBack.bind(this);
      this.slideToEdit = this.slideToEdit.bind(this);
      this.onFakeInputBlur = this.onFakeInputBlur.bind(this);
    }

    slideBack() {
      let lastTime = null;

      const slideBackAnimation = (time => {
        let y = null; 
        if(lastTime !== null) {
          const delta = (time - lastTime) * 0.3;
          if(this.state.y > 0) {
            y = Math.max(0, this.state.y - delta);
          }else{
            y = Math.min(0, this.state.y + delta);
          }
          this.setState({y});
        }
        lastTime = time;
        if(y !== 0) requestAnimationFrame(slideBackAnimation);
      }).bind(this);

      requestAnimationFrame(slideBackAnimation)
    }

    slideToEdit() {
      let lastTime = null;

      const slideToEditAnimation = ((resolve, reject, time) => {
        let y = this.state.y; 
        if(lastTime !== null) {
          const delta = (time - lastTime) * 0.7;
          y = Math.max(this.itemHeight, this.state.y - delta);
          this.setState({y});
        }
        console.log(y);
        lastTime = time;
        if(y > this.itemHeight) {
          requestAnimationFrame((time) => {slideToEditAnimation(resolve, reject, time)});
        }else{
          this.setState({y: 0});
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
      this.setState({fakeInputVisibile: false});
    }

    render() {
      const newItemRotate = Math.max(0, Math.min(90, Math.asin(-Math.min(this.itemHeight, this.state.y)/this.itemHeight)/Math.PI*180+90));
      const fakeInput = this.state.fakeInputVisibile ? (
        <input 
          // The fake input's role is to force the keyboard to show up on mobile devices. 
          // On mobile devices the focus can only be set to an input field from code if:
          // - the focus method is called as a direct result of a user interaction or
          // - the keyboard is already shown.
          // In this case the user interaction happens to be in this component therefore,
          // the focus can be set here, but the item desired focus is two components deep,
          // so the focus is set for the fake input to force the keyboard to show up, 
          // then reset by the real input field once the keyboard is already there.
          id='fakeInput' type='text'
          ref={(fakeInput) => { this.fakeInput = fakeInput; }} 
          onBlur={this.onFakeInputBlur}/>
      ) : '';
      return (
        <div id='container'>
          <div 
            id='list'
            style={{top: Math.min(0, this.state.y)}}
            ref={(draggable) => { this.draggable = draggable; }} >
            
            <div id='newItemPerspective' style={{height: Math.max(0, this.state.y)}}>
              <div id='newItem' style={{ transform: `rotateX(${newItemRotate}deg)`}}>
                {fakeInput}
                <Item 
                  key={this.newItemId} id={this.newItemId} 
                  title={this.state.newItemTitle} color={this.props.colors[0]}/>
              </div>
            </div>            
            {this.props.items.map((item, index) => 
              <Item 
                key={item.id} id={item.id} 
                title={item.title} color={this.props.colors[index]}
                edit_mode={this.props.edit_mode} 
                edited={this.props.edited_item === item.id || this.props.edited_item === 'FIRST' && index === 0}/>
            )}
          </div>
        </div>
      );
    }

    componentDidMount() {
      const observables = util.getDragObservables(this.draggable);

      observables.verticalMoves.forEach(coordinate => {
        if(this.props.edit_mode === false) {
          if(coordinate.y > this.itemHeight) {
            this.setState({
              newItemTitle: 'Release to Create Item',
              y: coordinate.y
            });
          }else{
            this.setState({
              newItemTitle: 'Pull to Create Item',
              y: coordinate.y
            });
          }

        }
      });

      observables.verticalMoveEnds.forEach(coordinate => {
        if(this.props.edit_mode === false) {
          if(coordinate.y > this.itemHeight) {
            this.setState({
              newItemTitle: '',
              fakeInputVisibile: true
            });
            this.fakeInput.focus();
            this.slideToEdit()
              .then(this.props.appendTop);
          }else {
            this.slideBack();
          }
        }
      });
    }
  }

  const listMapStateToProps = (state, ownProps) => {
    return {
      items: state.items,
      colors: state.colors,
      edit_mode: state.edit.edit_mode,
      edited_item: state.edit.edited_item
    }
  }

  const listMapDispatchToProps = (dispatch, ownProps) => {
    return {
      appendTop: () => {
        dispatch({ type: 'APPEND_TOP' })
      },
    }
  }
  return connect(listMapStateToProps, listMapDispatchToProps)(UnconnectedList);
})();

// REACT: Item
const Item = (() => {
  class UnconnectedItem extends React.Component {
    constructor({id, title, color, edit_mode, edited}) {
      super({id, title, color, edit_mode, edited});

      this.state = {
        x: 0,
        height: 'auto',
        dragging: false,
        shrinking: false
      };

      this.itemHeight = 52;
      this.relativePosition = 0; // Relative position of the item during rearrange
      this.terminate = false;

      this.slideBack = this.slideBack.bind(this);
      this.slideDone = this.slideDone.bind(this);
      this.slideDelete = this.slideDelete.bind(this);
      this.shrink = this.shrink.bind(this);
      this.done = this.done.bind(this);
      this.delete = this.delete.bind(this);
    }

    slideBack() {
      let lastTime = null;

      const slideBackAnimation = (time => {
        let x = null; 
        if(lastTime !== null) {
          const delta = (time - lastTime) * 0.3;
          if(this.state.x > 0) {
            x = Math.max(0, this.state.x - delta);
          }else{
            x = Math.min(0, this.state.x + delta);
          }
          this.setState({x});
        }
        lastTime = time;
        if(x !== 0) requestAnimationFrame(slideBackAnimation);
      }).bind(this);

      requestAnimationFrame(slideBackAnimation)
    }

    slideDone() {
      let lastTime = null;

      const slideDoneAnimation = ((resolve, reject, time) => {
        let x = null; 
        if(lastTime !== null) {
          const delta = (time - lastTime) * 1;
          x = this.state.x + delta;
          this.setState({x});
        }
        lastTime = time;
        if(x < 375) {
          requestAnimationFrame((time) => { 
            slideDoneAnimation(resolve, reject, time); 
          });
        }else{
          resolve();
        }
      }).bind(this);

      return new Promise((resolve, reject) => {
        requestAnimationFrame((time) => {
          slideDoneAnimation(resolve, reject, time)
        });
      });
    }

    slideDelete() {
      let lastTime = null;

      const slideDeleteAnimation = ((resolve, reject, time) => {
        let x = null; 
        if(lastTime !== null) {
          const delta = (time - lastTime) * 1;
          x = this.state.x - delta;
          this.setState({x});
        }
        lastTime = time;
        if(x > -375) {
          requestAnimationFrame((time) => {
            slideDeleteAnimation(resolve, reject, time);
          });
        }else{
          resolve();
        }
      }).bind(this);

      return new Promise((resolve, reject) => {
        requestAnimationFrame((time) => {
          slideDeleteAnimation(resolve, reject, time);
        });  
      });
    }

    shrink() {
      this.setState({
        shrinking: true, 
        height: parseInt(getComputedStyle(this.draggable).getPropertyValue('height'))
      });

      let lastTime = null;

      const shrinkAnimation = ((resolve, reject, time) => {
        let height = this.state.height;
        if(lastTime !== null) {
          const delta = (time - lastTime) * 0.5;
          height = Math.max(0, this.state.height - delta);
          this.setState({height});
        }
        lastTime = time;
        if(height > 0) {
          requestAnimationFrame((time) => {
            shrinkAnimation(resolve, reject, time)
          });
        }else{
          resolve();
        }
      }).bind(this);

      return new Promise((resolve, reject) => {
        requestAnimationFrame((time) => {
          shrinkAnimation(resolve, reject, time);  
        });
      });
    }

    done() {
      this.props.done(this.props.id);
    }

    delete() {
      this.props.delete(this.props.id);
    }

    render() {
      const itemContent = this.props.edited !== true ? 
            this.props.title : 
            <ItemInput id={this.props.id} title={this.props.title} />
      return (
        <div className={"item" + (this.state.dragging === true ? " draggedItem" : "")}
          style={{
            backgroundColor: this.props.color,
            left: this.state.x,
            top: this.state.y,
            height: this.state.height,
            minHeight: (this.state.shrinking ? 0 : this.itemHeight),
            opacity: (this.props.edit_mode === true && this.props.edited === false ? 0.3 : 1)
          }}
          ref={(draggable) => { this.draggable = draggable; }} >
          <div className="itemTitle">
            {itemContent}
          </div>
        </div>
      );
    }

    componentDidMount() {
      const observables = util.getDragObservables(this.draggable);

      observables.holds.forEach(() => {
        this.relativePosition = 0;
        this.setState({dragging: true});
      });
      
      observables.dragMoves.forEach(coordinate => {
        if(this.props.edit_mode === false) {
          
          let y = coordinate.y - this.relativePosition * this.itemHeight;
          if(y > this.itemHeight) {
            this.relativePosition++;            
            this.props.moveDown(this.props.id);
          }else if(y < - this.itemHeight) {
            this.relativePosition--;
            this.props.moveUp(this.props.id);
          }
          y = coordinate.y - this.relativePosition * this.itemHeight;
          this.setState({x: coordinate.x/2, y});
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
        if(this.props.edit_mode === false) {
          this.props.editModeOn(this.props.id);
        }else if(this.props.edited === false) {
          this.props.editModeOff();
        }
      });

      observables.horizontalMoves.forEach(coordinate => {
        if(this.props.edit_mode === false) {
          this.setState({x: coordinate.x});
        }
      });

      observables.horizontalMoveEnds.forEach(coordinate => {
        if(this.props.edit_mode === false) {
          if(coordinate.x > 40) {
            this.slideDone()
              .then(this.shrink)
              .then(this.done);
          }else if(coordinate.x < - 40) {
            this.slideDelete()
              .then(this.shrink)
              .then(this.delete);
          }else {
            this.slideBack();
          }
        }
      });
    }

    componentDidUpdate() {
      if(this.terminate === false && this.props.edit_mode === false && this.props.title === '') {
        this.terminate = true;
        this.slideDelete()
          .then(this.shrink)
          .then(this.delete);
      }
    }
  }

  const itemMapDispatchToProps = (dispatch, ownProps) => {
    return {
      editModeOn: (id) => {
        dispatch({ type: 'EDIT_MODE_ON', id });
      },
      editModeOff: () => {
        dispatch({ type: 'EDIT_MODE_OFF' });
      },
      done: (id) => {
        dispatch({ type: 'DONE', id });
      },
      delete: (id) => {
        dispatch({ type: 'DELETE', id });
      },  
      moveUp: (id) => {
        dispatch({ type: 'MOVE_UP', id });
      },
      moveDown: (id) => {
        dispatch({ type: 'MOVE_DOWN', id });
      },  
    }
  }
  return connect(null, itemMapDispatchToProps)(UnconnectedItem);
})();


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