import axios from 'axios';

import { key, proxy } from '../config';

export default class Search {
    constructor(query) {
        this.query = query;
    }


    async getResults() {

        // const proxy = 'https://cors-anywhere.herokuapp.com/';
        // const key = '7867b1e7325291a735c82feb541f6970';

        try {

            const res = await axios(`${proxy}https://www.food2fork.com/api/search?key=${key}&q=${this.query}`);
            this.results = res.data.recipes;
            // console.log(this.results);

        } catch(error) {
            alert(error);
        }

    }
}