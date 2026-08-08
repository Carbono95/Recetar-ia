import { ActivityIndicator, Alert, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { configureApi, setNotifier } from "@recetaria/core";

import { secureStorage } from "./src/secureStorage";
import { API_URL } from "./src/config";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RecipesScreen } from "./src/screens/RecipesScreen";
import { RecipeDetailScreen } from "./src/screens/RecipeDetailScreen";
import { ShoppingListScreen } from "./src/screens/ShoppingListScreen";

// Configuración móvil del core: misma lógica que la web (main.jsx), inyectando
// el storage seguro del iPhone. Se hace una vez, al cargar el módulo.
configureApi({
  apiUrl: API_URL,
  storage: secureStorage,
  onUnauthorized: () => {
    // En la app real: navegar a login. De momento el logout es manual.
  },
});
setNotifier((message) => Alert.alert("RecetarIA", message));

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

// Splash mientras el AuthContext comprueba si hay una sesión guardada.
function SplashScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fffdf7" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 }}>RecetarIA</Text>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  );
}

// Pestaña de recetas: su propio stack lista → detalle.
function RecipesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: "#16a34a", headerTitleStyle: { color: "#1a1a1a" } }}>
      <Stack.Screen name="Recipes" component={RecipesScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={({ route }) => ({ title: route.params?.title ?? "Receta" })}
      />
    </Stack.Navigator>
  );
}

// Área autenticada: tab bar Recetas / Lista de compra.
function AuthedTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="RecetasTab"
        component={RecipesStack}
        options={{ title: "Recetas", tabBarIcon: ({ focused }) => <TabIcon emoji="🍳" focused={focused} /> }}
      />
      <Tab.Screen
        name="ListaTab"
        component={ShoppingListScreen}
        options={{ title: "Lista", tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// Con sesión → tabs; sin sesión → login.
function RootNavigator() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  return user ? (
    <AuthedTabs />
  ) : (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
