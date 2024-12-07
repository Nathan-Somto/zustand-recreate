//* code for the custom zustand implementation
import _ from 'lodash';
import { useSyncExternalStore } from "react";
// deep partial needed for deep merge and nested object update
type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] | undefined; }
interface Options {
  replace?: boolean;
  mergeNestedArray?: boolean; // controls if nested array's should be merged or replaced by default
}
// the store that is created from the createStore function
interface Store<T> {
  setState: (partial: DeepPartial<T> | ((state: T) => DeepPartial<T>), options?: Options) => void;
  getState: () => T;
  getInitialState: () => T;
  initialState: T;
  subscribe: (listener: () => void) => () => void;
  listeners: Set<() => void>;
}
// the set function that is passed to the state creator function
interface SetFn<T> {
  (partial: DeepPartial<T> | ((state: T) => DeepPartial<T>), options?: Options): void;
}
// the get function that is passed to the state creator function
type GetFn<T> = <U extends keyof T>(prop: U) => T[U];
// the state creator function that is passed to the createStore function, recieves the set, get and storeApi
type StateCreator<T extends object, Set extends SetFn<T>, Get extends GetFn<T>> = (set: Set, getItem: Get, storeApi: Pick<Store<T>, 'subscribe' | 'getState' | 'setState' | 'listeners'> & {
  resetPersistence?: () => void;
}) => T;
type UseStore<TState extends object> = <U = TState>(selectorFn?: (state: TState) => U) => U

const createProxy = <TState extends object>(state: TState) => {
  return new Proxy(state, {
    get(target, prop) {
      if (prop in target) {
        const value = Reflect.get(target, prop);
        return typeof value === 'object' && value !== null && !Array.isArray(value) ? createProxy(value) : value;
      }
    },
    set() {
      // setting a value on the state object is not allowed
      throw new Error('Setting a value on the state object is not allowed');
    },
    deleteProperty() {
      // deleting a property is not allowed
      throw new Error('Deleting a property is not allowed');
    }
  });
};


const createStore = <TState extends object>(stateCreatorFn: StateCreator<TState, SetFn<TState>, GetFn<TState>>): Store<TState> => {
  let state: TState;
  // eslint-disable-next-line prefer-const
  let initialState: TState;
  const listeners: Set<() => void> = new Set();
  const setState: SetFn<TState> = (partial, options = { replace: false, mergeNestedArray: false }) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    //* supports nested object update
    //  deep merge object support, i don't think original zustand supports this
    // so big ups to me
    const newState = (options?.replace && (typeof nextState !== 'object')) ? nextState as TState :
      options.mergeNestedArray ? _.mergeWith({}, state, nextState, (objValue, srcValue) => {
        if (_.isArray(objValue)) {
          return objValue.concat(srcValue);
        }
      }) :
        _.mergeWith({}, state, nextState, (objValue, srcValue) => {
          if (_.isArray(objValue)) {
            return srcValue;
          }
        }) as TState;
    if (Object.is(state, newState)) return;
    state = newState;
    listeners.forEach((listen) => listen());
  }
  const getStateItem: GetFn<typeof state> = (prop) => state[prop];
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
  // create the state
  initialState = createProxy(stateCreatorFn(setState, getStateItem, { subscribe, getState, setState, listeners }));
  state = initialState;
  return {
    setState,
    getState,
    getInitialState,
    initialState,
    subscribe,
    listeners
  }
}
const returnArg = <T>(arg: T): T => arg;
const create = <TState extends object>(stateCreatorFn: StateCreator<TState, SetFn<TState>, GetFn<TState>>): UseStore<TState> => {
  const store = createStore(stateCreatorFn)
  // i have to return a function that takes a state and returns a value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <U = TState>(selectorFn: (state: TState) => U = returnArg as any): U => {
    return useSyncExternalStore(store.subscribe, () => selectorFn(store.getState()), () => selectorFn(store.getInitialState()));
  }
}
type StorageData<TState extends object> = {
  state: TState;
  version: number;
}
type PersistOptions<TState extends object> = {
  apiOption?: Pick<Options, 'mergeNestedArray'>;
  key: string;
  deserialize?: (value: string) => StorageData<TState>;
  serialize?: (value: StorageData<TState>) => string;
  version?: number;
  migrate?: (migratedState: StorageData<TState>) => TState;
  onHydrate?: (state: TState) => void;
}
type PersistFn = <TState extends object>(init: StateCreator<TState, SetFn<TState>, GetFn<TState>>, config: PersistOptions<TState>) => StateCreator<TState, SetFn<TState>, GetFn<TState>>
// for persisting state to local storage (only, i know zustand supports others but this will do for now)
/**
 * @description - persists the store to local storage to avoid loss of data on page refresh
 * @param store - the store to persist
 * @param key - the key to persist the store to in local storage
 * @param option - the options for what to do when the store is persisted
 * @example
 * const useStore = create(persist((set, get, api) =>({
 *  count: 0,
 * increment: () => set((state) => ({ count: state.count + 1 })),
 * decrement: () => set((state) => ({ count: state.count - 1 })),
 * }, 
 *    {
 *   
 *     key: 'count-store',
 *     option: { mergeNestedArray: true }
 *   })));
 * 
 */
const persist: PersistFn = (init, config) => (set, get, api) => {
  let hasHydrated = false;
  const deserialize = config?.deserialize ?? JSON.parse;
  const serialize = config?.serialize ?? JSON.stringify;
  const localSetItem = () => {
    const state = { ...api.getState() };
    console.log("state in local state, ", state);
    localStorage.setItem(config.key, serialize({ state }))
  }
  const initResult = init((...arg) => {
    set(...arg)
    localSetItem()
  }, get, api);
  const hydrate = (): ReturnType<typeof init> | undefined => {
    const value = localStorage.getItem(config.key);
    if (value) {
      const { state = {}, version = 1 } = deserialize(value) as StorageData<ReturnType<typeof init>>;
      console.log("in hydrate");
      let migratedState = state as ReturnType<typeof init>;
      if (config?.version && config?.migrate && config.version !== version) {
        console.log("migrating state");
        migratedState = config.migrate({ state: (state as ReturnType<typeof init>), version });
      }
      const mergedState = Object.assign({}, initResult, migratedState);
      if (hasHydrated) return mergedState as ReturnType<typeof init>;
      config?.onHydrate?.(mergedState);
      api.setState(mergedState, { mergeNestedArray: config?.apiOption?.mergeNestedArray ?? false, replace: true });
      api.listeners.forEach(listener => listener())
      hasHydrated = true;
      return mergedState as ReturnType<typeof init>
    }
  }
  api.resetPersistence = () => localStorage.removeItem(config.key);
  const hydratedState = hydrate();
  return hydratedState || initResult
};

export {
  create,
  persist
};
export type {
  DeepPartial,
  StateCreator,
  SetFn,
  GetFn,
  Store,
  Options
};

