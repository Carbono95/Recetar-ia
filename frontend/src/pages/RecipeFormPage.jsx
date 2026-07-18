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

  if (isLoading) return <div className="p-6 text-sand-500">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-narrow mx-auto px-5 md:px-6 pt-3 md:pt-6 pb-6">
      <h1 className="font-heading font-extrabold text-[32px] md:text-[34px] text-ink mb-5">
        {isEditing ? "Editar receta" : "Nueva receta"}
      </h1>
      <div className="bg-white rounded-[22px] shadow-ios p-6">
        <RecipeForm
          initialValues={initialValues}
          categories={categories}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? "Guardar cambios" : "Crear receta"}
        />
      </div>
    </div>
  );
}

export default RecipeFormPage;
