import { create } from '@/lib';
import React from 'react';
import { ArrayExample } from './examples/array-example';
import { NestedObjectsExample } from './examples/nested-objects-example';
import { ObjectsExample } from './examples/objects-example';
import { TodosExample } from './examples/todos-example';
import { ComplexPersistExample } from './examples/complex-persist-example';
import './App.css';
type AgeStoreState = { age: number };

type AgeStoreActions = {
  setAge: (
    nextAge:
      | AgeStoreState['age']
      | ((currentAge: AgeStoreState['age']) => AgeStoreState['age'])
  ) => void;
};

type AgeStore = AgeStoreState & AgeStoreActions;

const useAgeStore = create<AgeStore>((set) => ({
  age: 42,
  setAge: (nextAge) => {
    set((state) => ({
      age: typeof nextAge === 'function' ? nextAge(state.age) : nextAge,
    }));
  },
}));

type Examples =
  | 'age'
  | 'array'
  | 'objects'
  | 'nested objects'
  | 'different parents'
  | 'todos'
  | 'complex persist';
const exampleSelections: Examples[] = [
  'age',
  'array',
  'objects',
  'nested objects',
  'todos',
  'complex persist',
];

export default function App() {
  const [examples, setExamples] = React.useState<Examples>('age');
  const state = useAgeStore();
  const setAge = useAgeStore((state) => state.setAge);

  function increment() {
    setAge((currentAge) => currentAge + 1);
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Zustand Recreate Example</h1>
      <select
        className="example-selector"
        value={examples}
        onChange={(e) => setExamples(e.target.value as Examples)}
      >
        {exampleSelections.map((example) => (
          <option key={example} value={example}>
            {example}
          </option>
        ))}
      </select>
      {examples === 'age' && (
        <div className="example-container">
          <h2 className="example-title">Age Example</h2>
          <p className="example-text">Age: {state.age}</p>
          <div className="button-group">
            <button className="example-button" onClick={() => increment()}>
              +1
            </button>
            <button
              className="example-button"
              onClick={() => {
                increment();
                increment();
                increment();
              }}
            >
              +3
            </button>
          </div>
        </div>
      )}
      {examples === 'array' && (
        <div className="example-container">
          <h2 className="example-title">Array Example</h2>
          <ArrayExample />
        </div>
      )}
      {examples === 'objects' && (
        <div className="example-container">
          <h2 className="example-title">Objects Example</h2>
          <ObjectsExample />
        </div>
      )}
      {examples === 'nested objects' && (
        <div className="example-container">
          <h2 className="example-title">Nested Objects Example</h2>
          <NestedObjectsExample />
        </div>
      )}
      {examples === 'todos' && (
        <div className="example-container">
          <h2 className="example-title">Todos Example</h2>
          <TodosExample />
        </div>
      )}
      {examples === 'complex persist' && (
        <div className="example-container">
          <h2 className="example-title">Complex Persist Example</h2>
          <ComplexPersistExample />
        </div>
      )}
    </div>
  );
}
