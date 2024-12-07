# Zustand Recreated

Zustand has been my go-to state management library for a while now, so i decided to dig deeper as to how it works, so i decided to do a little recreation, It does not have all the extra bloat that zustand comes with like middleware and of course tests, but what i did add was support for immutable state through the use of Javascript `Proxies`. the entire implementation is in one file so it's quite tiny.

1. The Source Code for the Implementation can be found in the lib folder.

2. Run the examples by starting the react app

```bash
npm run dev
```

## Main Functions

1. **CreateStore** : takes in the state creator function that is defined by the user, it must an return an object. the create store is responsible for creating the store and returning the store object.
   the store object contains the state which is created using a proxy and contains other functions like `set` and `get` which are used to update the state and get the state respectively.

```typescript
//1. createStore signature
type  createStore = <TState extends object>(stateCreatorFn: StateCreator<TState, SetFn<TState>, GetFn<TState>>): Store<TState>

//2. Store Object
interface Store<T> {
  setState: (partial: DeepPartial<T> | ((state: T) => DeepPartial<T>), options?: Options) => void;
  getState: () => T;
  getInitialState: () => T;
  initialState: T;
  subscribe: (listener: () => void) => () => void;
  listeners: Set<() => void>;
}
//3. StateCreator
type StateCreator<TState, TSetFn, TGetFn> = (set: TSetFn, get: TGetFn, api: Store<TState>) => TState;
```

2. **create** : this function calls the create store function by passing the stat creator function it returns the store object and allows for updating and setting based on the methods supplied in `TState`

```typescript
//1. useStore signature hook that is returned
type UseStore<TState extends object> = <U = TState>(selectorFn?: (state: TState) => U) => U;

//2. create signature
type create = <TState extends object>(stateCreatorFn: StateCreator<TState, SetFn<TState>, GetFn<TState>>): UseStore<TState>
```

3. **persist**: handles the persisting of state to avoid data loss on page refresh for now i only support local storage it takes in the state creator and some configs then return's the state creator's return type essentially.

```typescript
type StorageData<TState extends object> = {
  state: TState;
  version: number;
};
type PersistOptions<TState extends object> = {
  apiOption?: Pick<Options, "mergeNestedArray">;
  key: string;
  deserialize?: (value: string) => StorageData<TState>;
  serialize?: (value: StorageData<TState>) => string;
  version?: number;
  migrate?: (migratedState: StorageData<TState>) => TState;
  onHydrate?: (state: TState) => void;
};
type PersistFn = <TState extends object>(
  init: StateCreator<TState, SetFn<TState>, GetFn<TState>>,
  config: PersistOptions<TState>
) => StateCreator<TState, SetFn<TState>, GetFn<TState>>;
```

**Note:** I built the library by first crafting the types, hope that is not weird 👀

## Some Notable Differences

1. **Zustand does not support proxies out of the box:** This implementation uses a Javascript Proxy to make state immutable and prevent direct modifications by throwing an error.

```javascript
const state = {
  count: 0,
  nested: {
    count: 0,
  },
};
const store = createStore(() => state);
store.count = 10; //! This will throw an error
```

2.  **Deeply nested merges:** This implementation supports deep merging of objects, which is not supported by default in Zustand.

- **For Nested objects**

```javascript
const state = {
  count: 0,
  nested: {
    count: 0,
  },
};
const store = createStore((set) => {
  set(state);
  set((state) => ({ nested: { count: 10 } })); // This will merge the nested object no need to spread the previous state
});
```

- **For Array's:** also works for arrays but you have the option of either `setting` the array or `merging` it, `true` by default.

```javascript
const state = {
  count: 0,
  nested: {
    count: 0
  },
  arr: [1, 2, 3]
}
const store = createStore((set) => ({
     count: 0,
  nested: {
    count: 0
  },
  arr: [1, 2, 3]
    set(state);
    set(state =>  ({ arr: [4, 5, 6] }), {mergeArray: false}); // This will set the array (default)
    set(state =>  ({ arr: [4, 5, 6] }, {mergeArray: true})); // This will merge the array
    }));
```

this is posssible through the use of lodash's `merge` function.

3. **No Middleware:** This implementation does not support middleware, it's just a simple store.

4. **No Tests:** used the examples folder as a baseline test.

Thanks for checking it out please do leave a :star: if you like it.
