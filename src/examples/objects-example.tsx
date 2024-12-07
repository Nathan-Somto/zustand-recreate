import { create } from '@/lib';
interface ObjectsState {
    person: {
        name: string
        age: number
    }
}
interface ObjectsActions {
    updatePerson: (newPerson: ObjectsState['person']) => void
}
type ObjectsStore = ObjectsState & ObjectsActions
const useObjectsStore = create<ObjectsStore>((set) => ({
    person: {
        name: 'John',
        age: 42
    },
    updatePerson: (newPerson) => {
        set(() => {
            return {
                person: newPerson
            }
        })
    }
}))
export function ObjectsExample() {
    const state = useObjectsStore()
    const updatePerson = useObjectsStore((state) => state.updatePerson)
    return (
        <div>
            <p>Name: {state.person.name}</p>
            <p>Age: {state.person.age}</p>
            <button onClick={() => updatePerson({ name: 'Jane', age: 30 })}>Update Person</button>
        </div>
    )
}