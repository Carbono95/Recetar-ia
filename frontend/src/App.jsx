import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MealPlanPage from "./pages/MealPlanPage.jsx";
import RecipeDetailPage from "./pages/RecipeDetailPage.jsx";
import RecipeFormPage from "./pages/RecipeFormPage.jsx";
import RecipesPage from "./pages/RecipesPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ShoppingListPage from "./pages/ShoppingListPage.jsx";
// TODO Fase 6+: importar páginas a medida que se implementen
// import ProfilePage from "./pages/ProfilePage.jsx";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-cream text-gray-900">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <RecipesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/new"
            element={
              <ProtectedRoute>
                <RecipeFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id"
            element={
              <ProtectedRoute>
                <RecipeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id/edit"
            element={
              <ProtectedRoute>
                <RecipeFormPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <ShoppingListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meal-plan"
            element={
              <ProtectedRoute>
                <MealPlanPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
