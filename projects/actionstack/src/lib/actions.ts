import { kindOf } from './types';

export { createAction as action };

/**
 * Represents an action that can be dispatched in a Actionstack store.
 * This class extends `Promise<boolean>` to support asynchronous behavior, allowing
 * actions to be resolved or rejected based on their execution outcome.
 *
 * @template T - The type of the payload associated with the action.
 */
export class Action<T = any> {
  private _promise: Promise<void>;
  private _resolveFn!: () => void;
  private _rejectFn!: (reason: any) => void;

  private _isResolved: boolean = false;
  private _isRejected: boolean = false;

  public type?: string;

  constructor(typeOrThunk: string | Function, public payload?: T, public error?: boolean, public meta?: any, public source?: any) {
    // Initialize the promise and store the resolve/reject functions
    this._promise = new Promise((resolve, reject) => {
      this._resolveFn = resolve;
      this._rejectFn = reject;
    });

    if(!(typeOrThunk instanceof Function)) {
      this.type = typeOrThunk;
    }
  }

  // Method to resolve the promise manually
  resolve(): void {
    if (!this._isResolved && !this._isRejected) {
      this._isResolved = true;
      this._resolveFn();
    }
  }

  // Method to reject the promise manually
  reject(reason?: any): void {
    if (!this._isResolved && !this._isRejected) {
      this._isRejected = true;
      this._rejectFn(reason);
    }
  }

  // Returns a promise that resolves when the action is either resolved or rejected.
  waitForCompletion(): Promise<void> {
    return this._promise;
  }

  // Method to check if the action has been executed (either resolved or rejected)
  hasExecuted(): boolean {
    return this._isResolved || this._isRejected;
  }

  // Method to check if the action is asynchronous or not
  isAsync(): boolean {
    return !(typeof this.type === 'string');
  }
}

/**
 * Interface defining the structure of an asynchronous action.
 *
 * Asynchronous actions are functions that return promises, allowing for
 * handling asynchronous operations like network requests or timers within actions.
 *
 * @typeparam T - Optional type parameter for the action payload type (resolved promise value). Defaults to `any`.
 */
export interface AsyncAction<T = any> {
  (...args: any[]): Promise<T>;
}

/**
 * Creates an action creator function for Actionstack actions.
 *
 * @param {string | Function} typeOrThunk - This can be either a string representing the action type
 *                                          or a function representing a thunk (asynchronous action).
 * @param {Function} [payloadCreator] - (Optional) A function used to generate the payload for the action.
 * @returns {Function} - An action creator function.
 *
 * This function creates an action creator that can generate action objects with the specified `type`.
 * If `typeOrThunk` is a function, it is treated as a thunk that can dispatch other actions asynchronously.
 * The returned action can be a simple action or a thunk, depending on the input.
 */
export function createAction(typeOrThunk: string | Function, payloadCreator?: Function): any {
  function actionCreator(...args: any[]) {
    let action: Action;

    if (typeof typeOrThunk === 'function') {
      // If it's a thunk (async action)
      return async (dispatch: Function, getState: Function, dependencies: any) => {
        try {
          await typeOrThunk(...args)(dispatch, getState, dependencies);
        } catch (error: any) {
          console.warn(`Error in action: ${error.message}`);
        }
      };
    } else {
      // Normal action
      const payload = payloadCreator ? payloadCreator(...args) : args[0];
      action = new Action(typeOrThunk, payload);

      if (payloadCreator && (payload === undefined || payload === null)) {
        console.warn('payloadCreator did not return an object. Did you forget to initialize an action with params?');
      }

      if (payload !== null && payload !== undefined && typeof payload === 'object') {
        'meta' in payload && (action.meta = payload.meta);
        'error' in payload && (action.error = payload.error);
      }
    }

    return action;
  }

  actionCreator.toString = () => `${typeOrThunk}`;
  actionCreator.type = typeOrThunk;
  actionCreator.match = (action: any) => action instanceof Action && action.type === typeOrThunk;

  return actionCreator;
}


/**
 * Binds an action creator to the dispatch function.
 *
 * @param {Function} actionCreator - The action creator function to be bound.
 * @param {Function} dispatch - The dispatch function.
 * @returns {Function} - A new function that dispatches the action created by the provided action creator.
 *
 * This function takes an action creator function and the dispatch function.
 * It returns a new function that, when called, will dispatch the action created by the provided action creator.
 * The new function can be called with any arguments, which will be passed on to the original action creator function.
 */
export function bindActionCreator(actionCreator: Function, dispatch: Function): Function {
  return function (this: any, ...args: any[]): any {
    const action = actionCreator.apply(this, args);
    if (action instanceof Action) {
      dispatch(action);
      return action;
    }
  };
}

/**
 * Binds multiple action creators or a single action creator to the dispatch function.
 *
 * @param {Object | Function} actionCreators - An object containing action creator functions or a single action creator function.
 * @param {Function} dispatch - The dispatch function.
 * @returns {Object | Function} - An object containing the bound action creator functions or the bound single action creator function.
 *
 * This function takes an object containing multiple action creator functions or a single action creator function,
 * along with the dispatch function. It iterates through the provided object (or binds a single function if provided)
 * and returns a new object. In the new object, each action creator function is wrapped with the `bindActionCreator` function
 * to automatically dispatch the created action when called.
 *
 * This function is useful for binding all action creators from a module or file to the dispatch function
 * in a single call, promoting cleaner component code.
 */
export function bindActionCreators(actionCreators: any, dispatch: Function): any {
  if (typeof actionCreators !== "object" || actionCreators === null) {
    console.warn(`bindActionCreators expected an object or a function, but instead received: '${kindOf(actionCreators)}'.`);
    return undefined;
  }

  actionCreators = { ...actionCreators };

  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch);
  }

  const keys = Object.keys(actionCreators);
  const boundActionCreators: any = {};

  for (const key of keys) {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }

  return boundActionCreators;
}
