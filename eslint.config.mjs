import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extendemos las configuraciones recomendadas de Next.js y TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Configuración de archivos ignorados (Global Ignores)
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"]
  },
  
  // (Opcional) Reglas personalizadas globales
  {
    rules: {
      // Si quisieras permitir <img> en todo el proyecto sin warnings, descomenta esto:
      // "@next/next/no-img-element": "off",
      
      // Desactiva la regla de "any" explícito si prefieres ser menos estricto con TS
      // "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];

export default eslintConfig;