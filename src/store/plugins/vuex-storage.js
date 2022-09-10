import { Store, MutationPayload } from "vuex";
import merge from "deepmerge";
import * as shvl from "shvl";

const ElectronStore = require('electron-store');
export default function ( options ) {
    options = options || {};

    const storage = new ElectronStore();
    const key = options.key || "vuex";

    function getState(key, storage) {
        const value = storage.get(key);

        try {
            return (typeof value === "string")
                ? JSON.parse(value) : (typeof value === "object")
                    ? value : undefined;
        } catch (err) {}

        return undefined;
    }

    function filter() {
        return true;
    }

    function setState(key, state, storage) {
        return storage.set(key, JSON.stringify(state));
    }

    function reducer(state, paths) {
        return Array.isArray(paths)
            ? paths.reduce(function (substate, path) {
                return shvl.set(substate, path, shvl.get(state, path));
            }, {})
            : state;
    }

    function subscriber(store) {
        return function (handler) {
            return store.subscribe(handler);
        };
    }

    const assertStorage =
        options.assertStorage ||
        (() => {
            storage.set("@@", 1);
            storage.delete("@@");
        });

    assertStorage(storage);

    const fetchSavedState = () => (options.getState || getState)(key, storage);

    let savedState;

    if (options.fetchBeforeUse) {
        savedState = fetchSavedState();
    }

    return function (store) {
        if (!options.fetchBeforeUse) {
            savedState = fetchSavedState();
        }

        if (typeof savedState === "object" && savedState !== null) {
            store.replaceState(
                options.overwrite
                    ? savedState
                    : merge(store.state, savedState, {
                        arrayMerge:
                            options.arrayMerger ||
                            function (store, saved) {
                                return saved;
                            },
                        clone: false,
                    })
            );
            (options.rehydrated || function () {})(store);
        }

        (options.subscriber || subscriber)(store)(function (mutation, state) {
            if ((options.filter || filter)(mutation)) {
                (options.setState || setState)(
                    key,
                    (options.reducer || reducer)(state, options.paths),
                    storage
                );
            }
        });
    };
}