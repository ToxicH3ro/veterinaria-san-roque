# 🐾 Veterinaria San Roque

Sistema web de gestión para una clínica veterinaria, desarrollado como proyecto académico individual utilizando React, Next.js y Firebase.

---

# 👩‍💻 Integrante

**Mariana Beatriz González López**

Proyecto desarrollado de manera individual.

---

# 📋 Descripción del proyecto

**Veterinaria San Roque** es una aplicación web diseñada para centralizar la gestión de información y operaciones de una clínica veterinaria.

El sistema permite administrar usuarios, clientes, citas médicas, inventario de medicamentos, información de facturación y reportes médicos.

La aplicación incorpora autenticación de usuarios y control de acceso mediante roles, diferenciando las funcionalidades disponibles para usuarios y veterinarios.

---

# 🎯 Objetivo del proyecto

Desarrollar una aplicación web que permita digitalizar y centralizar los principales procesos de una veterinaria, proporcionando una interfaz organizada, responsive y de fácil utilización.

El sistema busca facilitar:

* Gestión de clientes.
* Gestión de mascotas e información asociada.
* Administración de citas médicas.
* Control de inventario.
* Registro y consulta de información relacionada con consultas.
* Facturación.
* Consulta de reportes médicos.
* Autenticación de usuarios.
* Control de acceso mediante roles.

---

# 🔧 Tecnologías utilizadas

## 🖌️ Frontend

* React
* Next.js 16.3.5
* JavaScript
* Tailwind CSS
* HTML5
* CSS3

## 🗄️ Persistencia y servicios

* Firebase Authentication
* Cloud Firestore
* Arquitectura basada en servicios para el acceso y manipulación de datos.

## 🧰 Herramientas

* Visual Studio Code
* Node.js
* npm
* Git
* GitHub
* Vercel

---

# 🏗️ Arquitectura del proyecto

El proyecto utiliza una separación de responsabilidades entre la interfaz de usuario, la lógica de aplicación, el manejo de estado y el acceso a datos.

```text
src/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── inicio/
│   │   ├── agenda/
│   │   ├── clientes/
│   │   ├── inventario/
│   │   ├── facturacion/
│   │   └── reportes/
│   │
│   ├── api/
│   │   ├── citas/
│   │   ├── clientes/
│   │   └── inventario/
│   │
│   ├── layout.js
│   ├── page.js
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── DashboardLayout.jsx
│   │
│   └── ui/
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Modal.jsx
│       ├── Table.jsx
│       └── Input.jsx
│
├── context/
│   ├── AuthContext.jsx
│   └── AppContext.jsx
│
├── lib/
│   ├── firebase.js
│   └── firestore.js
│
└── services/
    ├── authService.js
    ├── citasService.js
    ├── clientesService.js
    ├── facturacionService.js
    ├── inventarioService.js
    └── reportesService.js
```

---

# 🧩 Separación de responsabilidades

### 👾 `app/`

Contiene las páginas y rutas de la aplicación utilizando el **App Router de Next.js**.

Incluye las páginas de autenticación, dashboard y los diferentes módulos del sistema.

### 📦 `components/`

Contiene componentes reutilizables de interfaz, incluyendo:

* Botones.
* Tarjetas.
* Tablas.
* Modales.
* Campos de entrada.
* Sidebar.
* Header.
* Estructura general del dashboard.

### 📄 `context/`

Contiene los Contextos de React utilizados para manejar información global de la aplicación.

Entre ellos:

* Estado de autenticación.
* Información del usuario.
* Estado general de la aplicación.

### 🌐 `services/`

Contiene la lógica relacionada con las operaciones de datos y la comunicación con Firebase/Firestore.

Los servicios permiten mantener separada la lógica de acceso a datos de las páginas de la aplicación.

### 🗂️ `lib/`

Contiene la configuración y conexión con Firebase y Firestore.

---

# 🔐 Autenticación

La aplicación utiliza **Firebase Authentication** para gestionar el registro e inicio de sesión de los usuarios.

El registro solicita:

* Nombre.
* Apellido.
* Correo electrónico.
* Contraseña.
* Confirmación de contraseña.

La información adicional del usuario se almacena en **Cloud Firestore**.

La autenticación también permite identificar al usuario actualmente conectado y controlar el acceso a las funcionalidades de acuerdo con su rol.

---

# 👥 Roles y permisos

El sistema implementa dos roles principales.

## 👤 Usuario

El usuario cuenta con acceso a las funcionalidades correspondientes a un cliente de la veterinaria, incluyendo:

* Consulta de sus citas.
* Consulta de información relacionada con sus mascotas.
* Consulta de servicios e información correspondiente a sus atenciones.

## 🩺 Veterinario

El veterinario cuenta con permisos adicionales para la administración del sistema, incluyendo:

* Visualización de clientes.
* Gestión de inventario.
* Gestión de citas.
* Actualización del estado de las citas.
* Consulta de información administrativa.
* Acceso a los módulos de gestión.

El rol del usuario se almacena en Firestore y se utiliza para controlar el acceso a determinadas operaciones.

---

# 🪛 Módulos implementados

## 🏠 Dashboard / Inicio

El sistema cuenta con un dashboard principal que presenta información relevante dependiendo del usuario autenticado.

El contenido mostrado se adapta de acuerdo con el rol del usuario.

---

## 📅 Agenda

Permite administrar las citas médicas de la veterinaria.

Los usuarios pueden consultar sus citas y los veterinarios pueden gestionar las citas y actualizar su estado.

Las citas no se eliminan físicamente del sistema. En caso de cancelación, se conserva el registro y se utiliza el estado correspondiente para representar la cancelación.

---

## 👥 Clientes

Permite consultar y administrar la información de los clientes registrados.

El módulo permite realizar operaciones de consulta y gestión de los registros de clientes de acuerdo con los permisos disponibles.

---

## 💊 Inventario

Permite controlar los productos y medicamentos utilizados en la veterinaria.

Incluye operaciones para:

* Registrar productos.
* Consultar productos.
* Actualizar productos.
* Eliminar productos.
* Controlar cantidades disponibles.

El sistema también valida que la cantidad disponible sea suficiente antes de realizar un descuento de inventario.

---

## 🧾 Facturación

El módulo de facturación permite registrar y visualizar información relacionada con los servicios proporcionados durante una consulta.

Incluye una interfaz destinada a la generación y visualización de información de facturación.

---

## 📊 Reportes

Permite consultar información relacionada con los registros y actividades de la veterinaria mediante el módulo de reportes médicos.

---

# 🔥 Firebase y Firestore

El proyecto utiliza **Firebase** como plataforma para autenticación y almacenamiento de información.

## 🔥 Firebase Authentication

Se utiliza para:

* Registro de usuarios.
* Inicio de sesión.
* Control de sesión.
* Identificación del usuario autenticado.

## 🗂️ Cloud Firestore

Firestore se utiliza como base de datos NoSQL para almacenar información relacionada con:

* Usuarios.
* Citas.
* Inventario.
* Facturas.
* Información de gestión veterinaria.

Las operaciones de acceso y manipulación de datos se encuentran organizadas principalmente dentro de:

```text
src/services/
```

---

# 🔒 Reglas de seguridad

Cloud Firestore utiliza reglas de seguridad para controlar el acceso a los documentos.

Entre las restricciones implementadas se encuentran:

* Un usuario autenticado puede gestionar su propio documento de usuario.
* Los veterinarios pueden consultar información administrativa de usuarios.
* Las operaciones relacionadas con citas dependen del rol del usuario.
* Las operaciones de inventario requieren autenticación.
* Las operaciones de facturación requieren autenticación.

Estas reglas complementan el control de acceso implementado en la interfaz de la aplicación.

---

# 🔄 Operaciones CRUD

El sistema implementa operaciones de gestión de información en diferentes módulos.

## 👤 Clientes

* **Create:** registro mediante el sistema de autenticación.
* **Read:** consulta de clientes.
* **Update:** actualización de información permitida.
* **Delete:** eliminación de clientes según los permisos correspondientes.

## 🗃️ Inventario

* **Create:** registro de productos.
* **Read:** consulta de productos.
* **Update:** modificación de productos.
* **Delete:** eliminación de productos.

## 📋 Citas

* **Create:** creación de citas.
* **Read:** consulta de citas.
* **Update:** actualización del estado de las citas.
* **Delete:** no se utiliza como operación funcional.

Las citas canceladas conservan su registro dentro del sistema.

---

# ✅ Validaciones y manejo de errores

La aplicación implementa validaciones y manejo de errores en diferentes operaciones, incluyendo:

* Validación de campos de formularios.
* Confirmación de contraseñas.
* Validación de autenticación.
* Validación de cantidades de inventario.
* Validación de existencia de registros.
* Manejo de errores provenientes de Firebase.
* Mensajes de error para operaciones que no pueden completarse.

---

# 🎨 Diseño responsive

La interfaz fue desarrollada utilizando **Tailwind CSS**, permitiendo adaptar los diferentes módulos a distintos tamaños de pantalla.

Se utilizan componentes reutilizables para mantener una interfaz consistente en:

* Dashboard.
* Sidebar.
* Formularios.
* Tablas.
* Tarjetas.
* Modales.
* Botones.
* Elementos de navegación.

---

# 🌐 Despliegue

La aplicación se encuentra desplegada utilizando **Vercel**.

## 🚀 Aplicación

https://veterinaria-san-roque-three.vercel.app/

## 📦 Repositorio

https://github.com/ToxicH3ro/veterinaria-san-roque

La rama utilizada para el desarrollo y entrega del proyecto es:

```text
dev-Mariana
```

---

# 💻 Instalación y ejecución local

Para ejecutar el proyecto localmente se requiere:

* Node.js
* npm
* Git

## 1. Clonar el repositorio

```bash
git clone https://github.com/ToxicH3ro/veterinaria-san-roque.git
```

## 2. Entrar al proyecto

```bash
cd veterinaria-san-roque
```

## 3. Instalar dependencias

```bash
npm install
```

## 4. Configurar las variables de entorno

Crear un archivo:

```text
.env.local
```

y agregar las variables de configuración necesarias para Firebase.

> El archivo `.env.local` no se encuentra incluido en el repositorio por motivos de seguridad.

## 5. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

## 6. Abrir la aplicación

Ingresar desde el navegador a:

```text
http://localhost:3000
```

---

# 🏗️ Construcción para producción

Para verificar la compilación del proyecto:

```bash
npm run build
```

Para ejecutar la aplicación en modo producción:

```bash
npm start
```

---

# 📚 Dependencias principales

Entre las principales dependencias utilizadas se encuentran:

* `next`
* `react`
* `react-dom`
* `firebase`
* `tailwindcss`

Las versiones exactas de las dependencias se encuentran especificadas en:

```text
package.json
```

---

# 📁 Estructura general

```text
veterinaria-san-roque/
│
├── public/
│   ├── logo.png
│   └── mascotas.png
│
├── src/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── lib/
│   └── services/
│
├── .gitignore
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
├── package-lock.json
└── proxy.js
```

---

# 🚀 Estado del proyecto

El proyecto cuenta con los principales módulos de gestión veterinaria implementados, autenticación de usuarios, control de roles, conexión con Firebase/Firestore, operaciones CRUD, validaciones, manejo de errores, interfaz responsive y despliegue en Vercel.

El proyecto fue desarrollado como **entrega académica individual**.

---

# 📄 Licencia

Proyecto desarrollado con fines académicos.
