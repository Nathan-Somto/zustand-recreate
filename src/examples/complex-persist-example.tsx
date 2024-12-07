import { create, persist } from "@/lib";
import React from "react";
type Store = {
    friends: string[] | null
    addFriend: (friend: string) => void
    clearLocalStorage: () => void | undefined
}
const useStore = create<Store>(
    persist(
        (set, _get, api) => ({
            friends: null,
            addFriend(friend) {
                // you to explicitly pass merge array as it sets the array state by default
                return set(() => ({
                    friends: [friend]
                }), {
                    mergeArray: true
                })
            },
            clearLocalStorage: () => api?.resetPersistence?.()
        }),
        {
            key: 'my-store',
            version: 2,
            migrate: ({ state, version }) => {
                console.log(`Migrating from version ${version}`);
                //  migration logic to double count
                if (version === 1) {
                    const updatedFriends = state.friends ?? []
                    updatedFriends.push('migrated friend')
                    return { ...state, friends: updatedFriends };
                }
                return state;
            },
            serialize: (state) => btoa(JSON.stringify(state)),
            deserialize: (value) => JSON.parse(atob(value)),
            onHydrate: (state) => console.log('State hydrated:', state),
        }
    )
);

export function ComplexPersistExample() {
    const state = useStore();
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    return (
        <div>
            <input ref={inputRef} /> <button onClick={() => {
                if (inputRef?.current?.value) {
                    state.addFriend(inputRef.current.value)
                }
            }}>Add Friend</button>
            <ol>
                {
                    state?.friends?.map((friend, index) => (
                        <li key={friend + index}>{friend}</li>
                    ))
                }
            </ol>
            <button onClick={state.clearLocalStorage}>reset local storage</button>
        </div>
    )
}



