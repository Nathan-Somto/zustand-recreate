// todos example with persist 
import { create, persist } from '@/lib';
import React from 'react';
interface Todo {
    id: number;
    text: string;
    done: boolean;
}
interface TodosState {
    todos: Todo[];
}
interface TodosActions {
    addTodo: (text: string) => void;
    toggleTodo: (id: number) => void;
    removeTodo: (id: number) => void;
}
type TodosStore = TodosState & TodosActions;
const useTodosStore = create<TodosStore>(persist((set) => ({
    todos: [],
    addTodo: (text) => {
        set((state) => {
            return {
                todos: [
                    {
                        id: state.todos.length + 1,
                        text,
                        done: false,
                    },
                ],
            };
        });
    },
    toggleTodo: (id) => {
        set((state) => {
            return {
                todos: state.todos.map((todo) => {
                    return todo.id === id ? { done: !todo.done } : undefined;
                }),
            };
        }, { mergeArray: false });
    },
    removeTodo: (id) => {
        console.log("remove todo");
        set((state) => {
            return {
                todos: state.todos.filter((todo) => todo.id !== id)
            };
        });
    },
}), {

    key: 'todos',

}));

export function TodosExample() {
    const state = useTodosStore();
    const addTodo = useTodosStore((state) => state.addTodo);
    const toggleTodo = useTodosStore((state) => state.toggleTodo);
    const removeTodo = useTodosStore((state) => state.removeTodo);
    const [todo, setTodo] = React.useState('');
    console.log("state in todos:", state);
    return (<div>
        <input type="text" value={todo} onChange={(e) => setTodo(e.target.value)} />
        <button
            disabled={todo.length === 0}
            onClick={() => {
                addTodo(todo);
                setTodo('');
            }}>Add Todo</button>
        <ul>
            {state.todos.map((todo) => (<li key={todo.id}>
                <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</span>
                <button onClick={() => removeTodo(todo.id)}>Remove</button>
            </li>))}
        </ul>
    </div>);
}