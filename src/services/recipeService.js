const {
  createRecipe,
  findRecipeById,
  updateRecipeById,
  deleteRecipeById,
  listPublicRecipes,
  listRecipesByUserId
} = require('../models/recipeModel');
const { findUserById } = require('../models/userModel');
const { AppError } = require('../utils/AppError');

const VALID_VISIBILITIES = ['public', 'private'];

function validateRecipePayload(payload) {
  const { title, ingredients, instructions, visibility } = payload;

  if (!title || !ingredients || !instructions || !visibility) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Título, ingredientes, modo de preparo e visibilidade são obrigatórios.');
  }

  if (!VALID_VISIBILITIES.includes(visibility)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'O campo visibility deve ser public ou private.');
  }
}

function enrichRecipe(recipe) {
  const author = findUserById(recipe.userId);

  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    visibility: recipe.visibility,
    author: author ? { id: author.id, name: author.name } : null
  };
}

function createUserRecipe(payload, userId) {
  validateRecipePayload(payload);

  const recipe = createRecipe({
    title: payload.title,
    ingredients: payload.ingredients,
    instructions: payload.instructions,
    visibility: payload.visibility,
    userId: String(userId)
  });

  return enrichRecipe(recipe);
}

function editUserRecipe(recipeId, payload, userId) {
  validateRecipePayload(payload);

  const existingRecipe = findRecipeById(recipeId);

  if (!existingRecipe) {
    throw new AppError(404, 'NOT_FOUND', 'Receita não encontrada.');
  }

  if (existingRecipe.userId !== String(userId)) {
    throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para editar esta receita.');
  }

  const updatedRecipe = updateRecipeById(recipeId, {
    title: payload.title,
    ingredients: payload.ingredients,
    instructions: payload.instructions,
    visibility: payload.visibility
  });

  return enrichRecipe(updatedRecipe);
}

function removeUserRecipe(recipeId, userId) {
  const existingRecipe = findRecipeById(recipeId);

  if (!existingRecipe) {
    throw new AppError(404, 'NOT_FOUND', 'Receita não encontrada.');
  }

  if (existingRecipe.userId !== String(userId)) {
    throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para excluir esta receita.');
  }

  deleteRecipeById(recipeId);
}

function listAllPublicRecipes(searchTerm) {
  if (searchTerm !== undefined && typeof searchTerm !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Parâmetro de busca inválido.');
  }

  if (searchTerm !== undefined && searchTerm.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Parâmetro de busca inválido.');
  }

  return listPublicRecipes(searchTerm).map((recipe) => {
    const author = findUserById(recipe.userId);

    return {
      id: recipe.id,
      title: recipe.title,
      authorName: author ? author.name : null
    };
  });
}

function listMyRecipes(userId) {
  return listRecipesByUserId(userId).map(enrichRecipe);
}

function getRecipeDetails(recipeId, requestUserId) {
  const recipe = findRecipeById(recipeId);

  if (!recipe) {
    throw new AppError(404, 'NOT_FOUND', 'Receita não encontrada.');
  }

  if (recipe.visibility === 'private') {
    if (!requestUserId) {
      throw new AppError(401, 'UNAUTHORIZED', 'É necessário autenticação para acessar receita privada.');
    }

    if (recipe.userId !== String(requestUserId)) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para visualizar esta receita.');
    }
  }

  return enrichRecipe(recipe);
}

module.exports = {
  createUserRecipe,
  editUserRecipe,
  removeUserRecipe,
  listAllPublicRecipes,
  listMyRecipes,
  getRecipeDetails
};
