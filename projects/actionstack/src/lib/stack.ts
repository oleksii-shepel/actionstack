import { BehaviorSubject } from 'rxjs/internal/BehaviorSubjects';

import { waitFor } from './operators';

/**
 * Enumeration for the types of operations.
 * @enum {string}
 */
export enum OperationType {
  ACTION = "action",
  ASYNC_ACTION = "async action",
  EFFECT = "effect"
}

/**
 * Interface representing an operation.
 * @interface
 */
export interface Operation {
  /**
   * The type of operation.
   * @type {OperationType}
   */
  operation: OperationType;

  /**
   * The instance associated with the operation.
   * @type {*}
   */
  instance: any;
}

/**
 * A class representing an execution stack.
 * @template T
 */
export class ExecutionStack<T = Operation> {
  /**
   * The internal stack represented as a BehaviorSubject.
   * @private
   * @type {BehaviorSubject<T[]>}
   */
  private stack = new BehaviorSubject<T[]>([]);

  /**
   * Gets the length of the stack.
   * @returns {number} The length of the stack.
   */
  get length(): number {
    return this.stack.value.length;
  }

  /**
   * Pushes an item onto the stack.
   * @param {T} item - The item to push onto the stack.
   */
  push(item: T): void {
    this.stack.next([...this.stack.value, item]);
  }

  /**
   * Peeks at the top item of the stack without removing it.
   * @returns {T | undefined} The top item of the stack, or undefined if the stack is empty.
   */
  peek(): T | undefined {
    return this.stack.value[this.stack.value.length - 1];
  }

  /**
   * Filters the stack based on a predicate and returns the filtered items.
   * @param {function(T): boolean} predicate - The predicate function to filter the stack.
   * @returns {T[]} The filtered items.
   */
  filter(predicate: (item: T) => boolean): T[] {
    const filtered = this.stack.value.filter(predicate);
    this.stack.next(filtered);
    return filtered;
  }

  /**
   * Pops the top item off the stack.
   * @returns {T | undefined} The popped item, or undefined if the stack was empty.
   */
  pop(): T | undefined {
    const value = this.peek();
    this.stack.next(this.stack.value.slice(0, -1));
    return value;
  }

  /**
   * Clears the stack.
   */
  clear(): void {
    this.stack.next([]);
  }

  /**
   * Converts the stack to an array.
   * @returns {T[]} An array of the items in the stack.
   */
  toArray(): T[] {
    return [...this.stack.value];
  }

  /**
   * Waits for the stack to become empty.
   * @returns {Promise<T[]>} A promise that resolves with the stack items when the stack becomes empty.
   */
  async waitForEmpty(): Promise<T[]> {
    return await waitFor(this.stack, value => value.length === 0);
  }
}
