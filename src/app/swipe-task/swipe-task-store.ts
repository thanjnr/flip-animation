import { combineReducers, _createStoreReducers } from "@ngrx/store";

export interface TaskState {
    items: any[];
    colors: string[];
    currentEdit: Edit;
}

export interface Edit {
    mode: boolean;
    itemId: any;
}

export const initialState = {
    items: [
        { id: 1, title: 'Swipe to the right to complete task' },
        { id: 2, title: 'Swipe to the left to delete item' },
        { id: 3, title: 'Pull down to create item' },
        { id: 4, title: 'Tap to edit description' },
        { id: 5, title: 'Hold and drag to rearrange' },
        { id: 6, title: 'Go to the gym' },
        { id: 7, title: 'Buy groceries' },
    ],
    colors: ['#D90015', '#DC1C17', '#DE3A17', '#E25819', '#E4751B', '#E7921B', '#E9AF1D'],
    currentEdit: {
        mode: false,
        itemId: null
    } as Edit
} as TaskState; 

export const itemReducer = (state = initialState.items, action) => {
    switch (action.type) {
        case 'APPEND_TOP': {
            console.log('APPEND TOP');
           const newId = new Date().getTime(); // No, the ID does not have to be the current time, but the current time is sort of unique
            return [{ id: newId, title: '' }, ...state];
        }
        case 'DONE': {
            return state.filter(item => item.id !== action.id);
        }
        case 'DELETE': {
            return state.filter(item => item.id !== action.id);
        }
        case 'MOVE_DOWN': {
            console.log('MOVE DOWN', action.id);
            const index = state.findIndex(item => item.id === action.id);
            if (index === state.length - 1) return state;
            return [
                ...state.slice(0, index),
                state[index + 1],
                state[index],
                ...state.slice(index + 2)
            ];
        }
        case 'MOVE_UP': {
            console.log('MOVE UP', action.id);
            const index = state.findIndex(item => item.id === action.id);
            if (index === 0) return state;
            return [
                ...state.slice(0, index - 1),
                state[index],
                state[index - 1],
                ...state.slice(index + 1)
            ];
        }
        case 'UPDATE': {
            return state.map(item => {
                if (item.id !== action.id) {
                    return item; // This isn't the item we care about - keep it as-is
                }
                return { // Otherwise, this is the one we want - return an updated value
                    id: action.id,
                    title: action.title
                };
            });
        }
        default:
            return state;
    }
};

export const colorReducer = (state = initialState.colors, action) => {
    //https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
    const lerpColor = (a, b, amount) => {
        var ah = parseInt(a.replace(/#/g, ''), 16),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
            bh = parseInt(b.replace(/#/g, ''), 16),
            br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
            rr = ar + amount * (br - ar),
            rg = ag + amount * (bg - ag),
            rb = ab + amount * (bb - ab);
        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    }

    // Generates a range of interpolated colors from color a to b
    const colorRange = (length, a = '#D90015', b = '#E9AF1D') =>
        Array.from({ length }, (value, key) => lerpColor(a, b, 1 / length * key));

    switch (action.type) {
        case 'APPEND_TOP': {
            return colorRange(state.length + 1);
        }
        case 'DONE':
        case 'DELETE': {
            return colorRange(state.length - 1);
        }
        default:
            return state;
    }
};

export const editReducer = (state = initialState.currentEdit, action) => {
    switch (action.type) {
        case 'APPEND_TOP': {
            return {
                mode: true,
                itemId: 0 // 'FIRST'
            }
        }
        case 'EDIT_MODE_ON': {
            console.log('EDIT MODE ON', action.id);
            return {
                mode: true,
                itemId: action.id
            };
        }
        case 'EDIT_MODE_OFF': {
            console.log('EDIT MODE OFF');
            return {
                mode: false,
                itemId: null
            };
        }
        default:
            return state;
    }
};
