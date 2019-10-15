import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';

import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import { elements, renderLoader, clearLoader } from './views/base';

/* Global state of object
* - Search object
* - Current recipe object
* - Shopping list object
* - Likes recipe
*/

const state = {};
window.state = state;

//-----------------------------------------------------------
// -----------------SEARCH CONTROLLER -----------------------
// ----------------------------------------------------------
const controlSearch = async () => {

    // 1. Get query from the view
    const query = searchView.getInput();
    console.log(query);

    if (query) {
        // 2. New search object & add to state
        state.search = new Search(query);

        // 3. Prepare UI for results
        //  3.1 Clear the input field
        searchView.clearInput();
        //  3.2 Clear the previous results which are displaying
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4. Search for recipes
            await state.search.getResults(); // return a promise
    
            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.results);

        } catch (error) {    
            console.log(error);        
            alert('Something wrong with the search...');
            clearLoader();
        }

        
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
})

elements.searchResPage.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        console.log(goToPage);

        searchView.clearResults();
        searchView.renderResults(state.search.results, goToPage)
    }
})


//-----------------------------------------------------------
// ----------------- RECIPE CONTROLLER -----------------------
// ----------------------------------------------------------
const controlRecipe = async () => {
    // get ID from url
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if (id) {

        // 1. Prepare UI for changing
        recipeView.clearRecipe();
        renderLoader(elements.recipe)

        // 1.1 Highlight selected search item
        if (state.search) {
            searchView.highlightSelected(id);
        }

        // 2. Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // 3. Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            console.log(state.recipe);
            state.recipe.parseIngredients();
    
            // 4. Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // 5. Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id))
            // console.log(state.recipe);

        } catch (error) {
            console.log(error);
            alert('Error processing recipe!');
        }

    }
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


//-----------------------------------------------------------
// ----------------- LIST CONTROLLER -----------------------
// ----------------------------------------------------------

const controlList = () => {
    // 1. Create a new List if there is none yet
    if (!state.list) state.list = new List();

    // 2. Add each ingredient to the List and UI
    state.recipe.ingredients.forEach(el => {

        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);

    })
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

    // Handling the count update
    } else if ( e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);

    }
})


//-----------------------------------------------------------
// ----------------- LIKE CONTROLLER -----------------------
// ----------------------------------------------------------
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT yet liked current recipe
    if( !state.likes.isLiked(currentID) ) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );

        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to the UI list
        likesView.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipe on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage(); 

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {

    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //  Add ingredients to shopping list
        controlList();

    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
})

window.l = new List();