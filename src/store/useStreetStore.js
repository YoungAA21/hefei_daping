// src/store/useStreetStore.js
import {defineStore} from 'pinia'

export const useStreetStore = defineStore({
    // unique id of the store across your application
    id: 'streetStore',

    state: () => ({
        street: 1,
        shequ: ''
    }),

    getters: {
        // getter to retrieve the street value
        getStreet: (state) => state.street,
        getShequ: (state) => state.shequ,
    },

    actions: {
        // action to update the street value
        updateStreet(newStreet) {
           // this.street = newStreet
            this.$patch({ street: newStreet });
        },
        updateShequ(newShequ) {
            //this.shequ = newShequ
            this.$patch({ shequ: newShequ });
        },
    }
})
