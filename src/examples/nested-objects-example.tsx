import { create, DeepPartial } from '@/lib';
interface NestedObjectsState {
    person: {
        name: string;
        age: number;
        address: {
            street: string;
            city: string;
            line1: string[];
        };
    };
}
interface NestedObjectsActions {
    updatePerson: (newPerson: DeepPartial<NestedObjectsState['person']>) => void;
}
type NestedObjectsStore = NestedObjectsState & NestedObjectsActions;
const useNestedObjectsStore = create<NestedObjectsStore>((set) => ({
    person: {
        name: 'John',
        age: 42,
        address: {
            street: '123 St',
            city: 'NY',
            line1: ['123', 'St', 'NY'],
        },
    },
    updatePerson: (newPerson) => {
        set(() => {
            return ({
                person: {
                    ...newPerson,
                },
            });
        });
    },
}));
export function NestedObjectsExample() {
    const state = useNestedObjectsStore();
    const updatePerson = useNestedObjectsStore((state) => state.updatePerson);
    return (<div>
        <p>Name: {state.person.name}</p>
        <p>Age: {state.person.age}</p>
        <p>Address: {state.person.address.street}, {state.person.address.city}</p>
        <p>Address Line 1: {state.person.address.line1.join(' ')}</p>
        <button onClick={() => updatePerson({ name: 'Jane' })}>Update Name</button>
        <button onClick={() => updatePerson({ address: { line1: ['456', 'J3'] } })}>Update Address</button>
    </div>);
}