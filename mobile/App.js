import { ActivityIndicator, Alert, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts, Baloo2_700Bold, Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2";
import { configureApi, setNotifier } from "@recetaria/core";

import { secureStorage } from "./src/secureStorage";
import { API_URL } from "./src/config";
import { colors, fonts } from "./src/theme";
import { TabIcon, Mascot } from "./src/components/icons";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RecipesScreen } from "./src/screens/RecipesScreen";
import { RecipeDetailScreen } from "./src/screens/RecipeDetailScreen";
import { ShoppingListScreen } from "./src/screens/ShoppingListScreen";
import { PlannerScreen } from "./src/screens/PlannerScreen";
import { RecipeFormScreen } from "./src/screens/RecipeFormScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";

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

// Cabecera nativa común a los stacks (fondo arena, título Baloo 2).
const stackHeaderOptions = {
  headerStyle: { backgroundColor: colors.screen },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.ink, fontFamily: fonts.headingBold },
};

// Splash mientras se cargan las fuentes o el AuthContext comprueba la sesión.
function SplashScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}>
      <Mascot size={96} />
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

// Pestaña de recetas: su propio stack lista → detalle.
function RecipesStack() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen name="Recipes" component={RecipesScreen} options={{ headerShown: false, title: "Inicio" }} />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={({ route }) => ({ title: route.params?.title ?? "Receta", headerBackTitle: "Inicio" })}
      />
      <Stack.Screen name="RecipeForm" component={RecipeFormScreen} options={{ title: "Receta" }} />
    </Stack.Navigator>
  );
}

// Área autenticada: tab bar translúcida estilo iOS (Recetas / Semana / Lista).
function AuthedTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.sand400,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.94)",
          borderTopColor: "rgba(0,0,0,0.08)",
          borderTopWidth: 0.5,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="RecetasTab"
        component={RecipesStack}
        options={{ title: "Recetas", tabBarIcon: ({ focused }) => <TabIcon kind="recetas" active={focused} /> }}
      />
      <Tab.Screen
        name="PlannerTab"
        component={PlannerScreen}
        options={{ title: "Semana", tabBarIcon: ({ focused }) => <TabIcon kind="semana" active={focused} /> }}
      />
      <Tab.Screen
        name="ListaTab"
        component={ShoppingListScreen}
        options={{ title: "Lista", tabBarIcon: ({ focused }) => <TabIcon kind="lista" active={focused} /> }}
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
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Baloo2_700Bold, Baloo2_800ExtraBold });
  if (!fontsLoaded) return <SplashScreen />;

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
