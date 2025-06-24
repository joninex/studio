# NexusServ 360 - Gestión de Órdenes de Reparación Inteligente

NexusServ 360 es una plataforma integral de gestión para talleres de servicio técnico, diseñada para optimizar el ciclo de vida completo de las órdenes de reparación, desde el ingreso del equipo hasta la entrega al cliente y el análisis post-servicio.

## 1. Visión General de la Arquitectura

NexusServ 360 está construido sobre una arquitectura moderna y monolítica utilizando **Next.js con el App Router**. Esta elección permite una integración perfecta entre el frontend y el backend, aprovechando los Server Components de React para un rendimiento óptimo y una experiencia de desarrollo unificada.

*   **Frontend:** Componentes de React renderizados tanto en el servidor (RSC) como en el cliente, estilizados con **Tailwind CSS** y componentes pre-construidos de **ShadCN UI**.
*   **Backend (Lógica de Servidor):** La lógica de negocio tradicional (CRUD, etc.) se maneja a través de **Next.js Server Actions**, ubicadas en `src/lib/actions`. Esto elimina la necesidad de una API REST separada para la mayoría de las operaciones.
*   **Base de Datos (Simulada):** En el entorno de desarrollo actual, la persistencia de datos se simula en memoria dentro de los archivos de Server Actions (ej. `src/lib/actions/order.actions.ts`). Esto permite un desarrollo rápido sin necesidad de una base de datos externa, pero está diseñado para ser reemplazado por una conexión a una base de datos real (como PostgreSQL) en producción.
*   **Autenticación (Simulada):** El flujo de autenticación y la gestión de usuarios también están simulados en `src/lib/actions/auth.actions.ts` y el proveedor de contexto `src/providers/AuthProvider.tsx`, imitando el comportamiento de un servicio como Firebase Auth.

```mermaid
graph TD
    subgraph "Navegador del Usuario"
        A[Interfaz de Usuario en React]
    end

    subgraph "Infraestructura NexusServ 360 (Next.js)"
        B(Next.js App Router)
        C[Server Actions<br>/src/lib/actions]
        E[Base de Datos Simulada<br>(en memoria)]
    end

    A --"Llamadas a Server Actions (ej. crear orden)"--> C
    C --"Operaciones CRUD"--> E
    B --> A
    B --> C
```

## 2. Tecnologías Clave

*   **Framework:** [Next.js](https://nextjs.org/) (con App Router)
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Framework:** [React](https://reactjs.org/)
*   **Componentes UI:** [ShadCN UI](https://ui.shadcn.com/)
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
*   **Iconos:** [Lucide React](https://lucide.dev/)

## 3. Estructura del Repositorio

*   `/src/app/`: Contiene las rutas y páginas de la aplicación, siguiendo la convención del App Router.
    *   `/(auth)/`: Rutas públicas como Login y Registro.
    *   `/(app)/`: Rutas protegidas que requieren autenticación.
    *   `layout.tsx`: Layouts principales de la aplicación.
    *   `globals.css`: Estilos globales y configuración de temas de ShadCN.
*   `/src/components/`: Componentes de React reutilizables.
    *   `/ui/`: Componentes base generados por ShadCN.
    *   `/shared/`: Componentes compartidos en toda la aplicación (ej. PageHeader).
    *   `/[feature]/`: Componentes específicos de una funcionalidad (ej. `/orders`, `/dashboard`).
*   `/src/lib/`: Lógica central y utilidades.
    *   `/actions/`: **(Backend)** Server Actions que contienen la lógica de negocio y acceso a datos.
    *   `/schemas.ts`: Definiciones de esquemas de validación con Zod.
    *   `/constants.ts`: Constantes de la aplicación (estados, roles, etc.).
    *   `/utils.ts`: Funciones de utilidad.
*   `/src/providers/`: Proveedores de contexto de React (ej. AuthProvider, ThemeProvider).
*   `/public/`: Archivos estáticos.

## 4. Configuración y Ejecución

### Prerrequisitos
*   [Node.js](https://nodejs.org/) (versión 20.x o superior recomendada)
*   [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)

### Instrucciones de Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd [NOMBRE_DEL_DIRECTORIO]
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

### Ejecutar en Desarrollo

Para trabajar en el proyecto, ejecute el siguiente comando en una terminal. Este comando levanta el servidor de desarrollo de Next.js, que sirve la interfaz y ejecuta los Server Actions.
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:9002`.

## 5. Guía de Estilo y Convenciones

### General
*   **Formato:** Se utiliza **Prettier** para el formateo automático de código. Asegúrate de tener la extensión correspondiente en tu editor o ejecuta `npx prettier --write .` para formatear.
*   **Linting:** Se utiliza **ESLint** para identificar y corregir problemas en el código.

### TypeScript
*   **Tipado Estricto:** `strict: true` está habilitado en `tsconfig.json`. Evita el uso de `any` siempre que sea posible.
*   **Tipos Centralizados:** Los tipos de datos principales (ej. `Order`, `User`, `Client`) están definidos en `/src/types/index.ts`. Impórtalos desde allí para mantener la consistencia.
*   **Importaciones de Tipos:** Utiliza `import type { ... } from '...'` para importar solo tipos.

### React / Next.js
*   **Componentes Funcionales:** Utiliza componentes funcionales y hooks.
*   **Nomenclatura:**
    *   Componentes: `PascalCase` (ej. `OrderForm.tsx`).
    *   Hooks: `useCamelCase` (ej. `useMobile.ts`).
*   **Estructura de Archivos:** Coloca los componentes específicos de una ruta en una subcarpeta dentro de `/src/components`. (ej. `/src/components/orders/OrderListClient.tsx`).
*   **Server Components por Defecto:** Los componentes son Server Components por defecto. Usa la directiva `"use client"` solo cuando sea estrictamente necesario (manejo de estado con `useState`, efectos con `useEffect`, interactividad del usuario).
*   **Server Actions:** La lógica de backend se escribe en `src/lib/actions/`. Estas funciones deben ser asíncronas y marcadas con la directiva `"use server"`.

### Estilos (Tailwind CSS)
*   **Clases de Utilidad:** Prioriza el uso de clases de utilidad directamente en el JSX.
*   **Componentes de ShadCN:** Utiliza los componentes de `/src/components/ui` como base. Extiéndelos o combínalos en componentes de mayor nivel.
*   **Variables de Tema:** Para colores, utiliza las variables CSS definidas en `globals.css` (ej. `bg-primary`, `text-destructive`). Evita colores arbitrarios (ej. `bg-[#RRGGBB]`).

## 6. Documentación Conceptual de la Arquitectura (Modelo C4)

### Nivel 1: Diagrama de Contexto del Sistema

NexusServ 360 opera como un sistema central que interactúa con varios actores y sistemas externos.

*   **Actores Principales:**
    *   **Personal del Taller (`Administrador`, `Técnico`, `Recepcionista`):** Usan la aplicación web de NexusServ 360 para gestionar todo el ciclo de vida de las reparaciones.
    *   **Cliente Final:** Interactúa con el taller. En futuras versiones, podría tener acceso a un portal de cliente para ver el estado de su orden.
*   **Sistema Central:**
    *   **NexusServ 360:** La aplicación web completa.
*   **Sistemas Externos:**
    *   **(Futuro) Proveedor de WhatsApp:** Para enviar notificaciones automáticas a los clientes.
    *   **(Futuro) Pasarela de Pagos:** Para procesar pagos de reparaciones.

### Nivel 2: Diagrama de Contenedores

La aplicación se ejecuta como un único "contenedor" monolítico gracias a Next.js.

*   **Contenedor Principal (Aplicación Next.js):**
    *   **Tecnología:** Node.js, React, Next.js.
    *   **Responsabilidades:** Sirve la interfaz de usuario, gestiona la autenticación (simulada), ejecuta la lógica de negocio (Server Actions).

## 7. Licencia

Este proyecto está bajo la licencia MIT.
