import { create } from '@/lib'
interface EvenNumberState {
    evenNums: number[]
}
interface EvenNumberActions {
    addToEvenNums: () => void
    getTotal: () => number
}
type EvenNumberStore = EvenNumberState & EvenNumberActions
const useEvenNumberStore = create<EvenNumberStore>((set, get) => ({
    evenNums: [2, 4, 6, 8],
    addToEvenNums: () => {
        set((state) => {
            return {
                evenNums: [...state.evenNums, state.evenNums[state.evenNums.length - 1] + 2]
            }
        }, {
            mergeArray: false
        })
    },
    getTotal: () => {
        return get('evenNums').reduce((acc, num) => acc + num, 0)
    }
}))
export function ArrayExample() {
    const state = useEvenNumberStore()
    const addToEvenNums = useEvenNumberStore((state) => state.addToEvenNums)
    const getTotal = useEvenNumberStore((state) => state.getTotal)
    return (
        <div>
            <p>Even Numbers: {state.evenNums.join(', ')}</p>
            <p>Total: {getTotal()}</p>
            <button onClick={addToEvenNums}>Add Even Number</button>
        </div>
    )
}