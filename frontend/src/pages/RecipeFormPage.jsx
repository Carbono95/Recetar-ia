import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import RecipeForm from "../components/forms/RecipeForm.jsx";
import recipeService from "../services/recipeService";

function RecipeFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFormData() {
      setIsLoading(true);
      try {
        const [categoriesData, recipeData] = await Promise.all([
          recipeService.listCategories(),
          isEditing ? recipeService.get(id) : Promise.resolve(null),
        ]);
        if (!isMounted) return;
        setCategories(categoriesData);
        setInitialValues(recipeData);
      } catch (err) {
        if (isMounted) setError(err.message || "No se pudo cargar el formulario");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFormData();
    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  const handleSubmit = async (recipeData) => {
    setIsSubmitting(true);
    try {
      const saved = isEditing
        ? await recipeService.update(id, recipeData)
        : await recipeService.create(recipeData);
      navigate(`/recipes/${saved.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? "Editar receta" : "Nueva receta"}</h1>
      <RecipeForm
        initialValues={initialValues}
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Guardar cambios" : "Crear receta"}
      />
    </div>
  );
}

export default RecipeFormPage;
