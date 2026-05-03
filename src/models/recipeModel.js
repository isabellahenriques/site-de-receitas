const recipes = [];
let nextRecipeId = 1;

function createRecipe({ title, ingredients, instructions, visibility, userId }) {
  const recipe = {
    id: String(nextRecipeId++),
    title,
    ingredients,
    instructions,
    visibility,
    userId
  };

  recipes.push(recipe);
  return recipe;
}

function findRecipeById(id) {
  return recipes.find((recipe) => recipe.id === String(id));
}

function updateRecipeById(id, payload) {
  const recipe = findRecipeById(id);

  if (!recipe) {
    return null;
  }

  Object.assign(recipe, payload);
  return recipe;
}

function deleteRecipeById(id) {
  const index = recipes.findIndex((recipe) => recipe.id === String(id));

  if (index === -1) {
    return false;
  }

  recipes.splice(index, 1);
  return true;
}

function deleteRecipesByUserId(userId) {
  for (let i = recipes.length - 1; i >= 0; i -= 1) {
    if (recipes[i].userId === String(userId)) {
      recipes.splice(i, 1);
    }
  }
}

function listPublicRecipes(searchTerm) {
  return recipes.filter((recipe) => {
    if (recipe.visibility !== 'public') {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    return recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
  });
}

function listRecipesByUserId(userId) {
  return recipes.filter((recipe) => recipe.userId === String(userId));
}

function resetRecipes() {
  recipes.length = 0;
  nextRecipeId = 1;
}

module.exports = {
  createRecipe,
  findRecipeById,
  updateRecipeById,
  deleteRecipeById,
  deleteRecipesByUserId,
  listPublicRecipes,
  listRecipesByUserId,
  resetRecipes
};
