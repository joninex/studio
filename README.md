# NexusServ 360 - Gestión de Órdenes de Reparación Inteligente

NexusServ 360 es una plataforma integral de gestión para talleres de servicio técnico, diseñada para optimizar el ciclo de vida completo de las órdenes de reparación. Este proyecto está construido como un sistema autónomo y autocontenido, ideal para ejecutarse en entornos locales como Windows.

## 1. Visión General de la Arquitectura

NexusServ 360 está construido sobre una arquitectura moderna y monolítica utilizando **Next.js con el App Router**. Esta elección permite una integración perfecta entre el frontend y el backend, aprovechando los Server Components de React para un rendimiento óptimo y una experiencia de desarrollo unificada.

*   **Frontend:** Componentes de React renderizados tanto en el servidor (RSC) como en el cliente, estilizados con **Tailwind CSS** y componentes pre-construidos de **ShadCN UI**.
*   **Backend (Lógica de Servidor):** La lógica de negocio tradicional (CRUD, etc.) se maneja a través de **Next.js Server Actions**, ubicadas en `src/lib/actions`. Esto elimina la necesidad de una API REST separada para la mayoría de las operaciones.
*   **Base de Datos (Simulada):** En el entorno de desarrollo actual, la persistencia de datos se simula en memoria dentro de los archivos de Server Actions (ej. `src/lib/actions/order.actions.ts`). Esto permite un desarrollo y despliegue rápido en entornos locales sin necesidad de una base de datos externa.
*   **Autenticación (Local):** El flujo de autenticación y la gestión de usuarios están completamente contenidos dentro de la aplicación. No hay dependencias de servicios externos. La creación de nuevos usuarios es gestionada exclusivamente por un administrador desde la propia aplicación, asegurando un control de acceso total.

```mermaid
graph TD
    subgraph "Navegador del Usuario (Windows)"
        A[Interfaz de Usuario en React]
    end

    subgraph "Servidor Local (Next.js en Windows)"
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

*   `/src/app/`: Contiene las rutas y páginas de la aplicación.
    *   `/(auth)/`: Rutas públicas como Login.
    *   `/(app)/`: Rutas protegidas que requieren autenticación.
*   `/src/components/`: Componentes de React reutilizables.
*   `/src/lib/`: Lógica central y utilidades.
    *   `/actions/`: **(Backend)** Server Actions que contienen la lógica de negocio y acceso a datos.
*   `/src/providers/`: Proveedores de contexto de React (AuthProvider, ThemeProvider).
*   `/public/`: Archivos estáticos, incluyendo las imágenes subidas por los usuarios.

## 4. Instalación y Ejecución en Windows

Siga estos pasos para instalar y ejecutar NexusServ 360 en un entorno Windows.

### Prerrequisitos

1.  **Node.js:** Es el entorno de ejecución para la aplicación.
    *   Descargue la versión LTS desde el [sitio web oficial de Node.js](https://nodejs.org/es) y siga el asistente de instalación. Esto también instalará `npm`, el gestor de paquetes de Node.
2.  **Git:** Es el sistema de control de versiones necesario para descargar el código fuente.
    *   Descargue e instale [Git for Windows](https://git-scm.com/download/win).

### Pasos de Instalación

1.  **Abrir una Terminal:**
    *   Puede usar el **Símbolo del sistema (Command Prompt)** o **PowerShell**. Puede encontrarlos en el Menú Inicio.

2.  **Clonar el Repositorio:**
    *   Navegue a la carpeta donde desea instalar la aplicación (ej. `cd C:\Users\SuUsuario\Documents`) y ejecute el siguiente comando para descargar el código:
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    ```
    *   Ingrese a la nueva carpeta creada:
    ```bash
    cd [NOMBRE_DEL_DIRECTORIO]
    ```

3.  **Instalar Dependencias:**
    *   Dentro de la carpeta del proyecto, ejecute el siguiente comando. Esto leerá el archivo `package.json` y descargará todas las librerías necesarias para que la aplicación funcione.
    ```bash
    npm install
    ```

### Ejecutar la Aplicación

1.  **Iniciar el Servidor de Desarrollo:**
    *   Una vez instaladas las dependencias, inicie la aplicación con el comando:
    ```bash
    npm run dev
    ```
    *   Verá un mensaje en la terminal indicando que el servidor se está ejecutando.

2.  **Acceder a NexusServ 360:**
    *   Abra su navegador web (Chrome, Firefox, Edge) y vaya a la siguiente dirección: **http://localhost:9002**

### Primer Uso y Credenciales de Administrador

*   La aplicación se inicia con un único usuario administrador global. Utilice las siguientes credenciales para su primer inicio de sesión:
    *   **Usuario:** `jesus@mobyland.com.ar`
    *   **Contraseña:** `42831613aA@`
*   Una vez dentro, el sistema le guiará para crear su primera sucursal y añadir a los miembros de su equipo.