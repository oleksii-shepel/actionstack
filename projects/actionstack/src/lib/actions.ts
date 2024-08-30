import { isAction, kindOf } from './types';

export { createAction as action };

/**
 * Interface defining the structure of an action object.
 *
 * Actions are the primary way to communicate state changes in Actionstack-like stores.
 * This interface defines the expected properties for an action.
 *
 * @typeparam T - Optional type parameter for the action payload. Defaults to `any`.
 */
export interface Action<T = any> extends Promise<void> {
  type: string;
  payload?: T;
  error?: boolean;
  meta?: any;
  source?: any;

  resolve: () => void;
  reject: (error: any) => void;
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

      let resolveFunc: Function = () => {};
      let rejectFunc: Function = (error: any) => {};

      action = new Promise<void>((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc = reject;
      }) as Action;

      action.type = typeOrThunk;

      if (payloadCreator && (payload === undefined || payload === null)) {
        console.warn('payloadCreator did not return an object. Did you forget to initialize an action with params?');
      }

      if (payload !== null && payload !== undefined && typeof payload === 'object') {
        action.payload = payload;
        'meta' in payload && (action.meta = payload.meta);
        'error' in payload && (action.error = payload.error);
      }

      action.resolve = () => {
        resolveFunc();
      }

      action.reject = (error: any) => {
        rejectFunc(error);
      }
    }

    return action;
  }

  actionCreator.toString = () => `${typeOrThunk}`;
  actionCreator.type = typeOrThunk;
  actionCreator.match = (action: any) => isAction(action) && action.type === typeOrThunk;

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
    if (isAction(action)) {
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
