import * as SecureStore from "expo-secure-store";

// Adaptador de storage para móvil. Mismo contrato async que el webStorage de la
// web (localStorage), así el core no sabe en qué plataforma corre: aquí los
// tokens se guardan en el llavero seguro del iPhone (Keychain).
export const secureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
