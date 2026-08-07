// Metro para monorepo. mobile/ NO está en el workspace de npm (evita el choque
// entre el React de la web y el del móvil), así que aquí le decimos a Metro
// dónde vive el core compartido y desde dónde resolver las deps que el core
// importa (react, date-fns).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// 1. Que Metro vea los ficheros de packages/core (están fuera de mobile/).
config.watchFolders = [path.resolve(monorepoRoot, "packages/core")];

// 2. El core se importa como "@recetaria/core" → su carpeta fuente.
config.resolver.extraNodeModules = {
  "@recetaria/core": path.resolve(monorepoRoot, "packages/core"),
};

// 3. Cuando un fichero del core importa react / react-native / date-fns, esos
//    módulos deben resolverse desde mobile/node_modules (React 19.1 que empareja
//    con react-native 0.81), NO desde el node_modules raíz del monorepo (que
//    tiene otra copia de React por el workspace de la web) ni faltar (date-fns
//    solo está instalado en el móvil). Truco: resolverlos como si el import
//    viniera de un fichero DENTRO de mobile/, para que la búsqueda jerárquica
//    encuentre primero la copia del móvil. El resto de módulos usa la resolución
//    por defecto de Expo (necesaria para las deps anidadas como expo-asset).
const appModuleOrigin = path.join(projectRoot, "index.js");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (/^(react|react-native|date-fns)(\/|$)/.test(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: appModuleOrigin },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
