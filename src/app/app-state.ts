export interface AppState {
    appState: string;
    x: number;
    n: number;
    dx: number;
    dy: number;
    type: string;
    pending: boolean;
    panning: boolean;
    changed: boolean;
    direction: string;
    prevState: string;
}