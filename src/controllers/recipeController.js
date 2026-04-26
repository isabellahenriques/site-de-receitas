const {
  createUserRecipe,
  editUserRecipe,
  removeUserRecipe,
  listAllPublicRecipes,
  listMyRecipes,
  getRecipeDetails
} = require('../services/recipeService');

function create(req, res, next) {
  try {
    const recipe = createUserRecipe(req.body, req.auth.userId);
    return res.status(201).json(recipe);
  } catch (error) {
    return next(error);
  }
}

function update(req, res, next) {
  try {
    const recipe = editUserRecipe(req.params.id, req.body, req.auth.userId);
    return res.status(200).json(recipe);
  } catch (error) {
    return next(error);
  }
}

function remove(req, res, next) {
  try {
    removeUserRecipe(req.params.id, req.auth.userId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

function listPublic(req, res, next) {
  try {
    const recipes = listAllPublicRecipes(req.query.search);
    return res.status(200).json(recipes);
  } catch (error) {
    return next(error);
  }
}

function listMine(req, res, next) {
  try {
    const recipes = listMyRecipes(req.auth.userId);
    return res.status(200).json(recipes);
  } catch (error) {
    return next(error);
  }
}

function getById(req, res, next) {
  try {
    const recipe = getRecipeDetails(req.params.id, req.auth?.userId);
    return res.status(200).json(recipe);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  update,
  remove,
  listPublic,
  listMine,
  getById
};
