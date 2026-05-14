# ClienteAPP — CRM Casas Prefabricadas

Sistema CRM profesional para gestión de clientes, proyectos y pagos de casas prefabricadas.

## 🚀 Cómo usar

1. Abre `index.html` en tu navegador (o sirve la carpeta con un servidor local)
2. Inicia sesión con las credenciales demo:

| Usuario   | Contraseña  | Rol                |
|-----------|-------------|--------------------|
| admin     | admin123    | Administrador      |
| asesor    | asesor123   | Asesor de Ventas   |
| tecnico   | tecnico123  | Técnico de Obra    |

## 📦 Tecnología

- **Frontend**: HTML5 + Bootstrap 5.3 + JavaScript Vanilla
- **Base de datos local**: IndexedDB (offline-first)
- **PWA**: Service Worker para funcionamiento sin internet
- **Sin servidor requerido**: Corre 100% en el navegador

## 🌐 Servidor local (recomendado)

Para que el Service Worker funcione correctamente, sirve la app con:

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code: Live Server extension
```

Luego abre: `http://localhost:8080`

## ✨ Módulos

- **Dashboard**: Métricas, alertas y actividad reciente
- **Clientes**: CRM con estados, búsqueda y filtros
- **Proyectos**: Modelos de casas con especificaciones
- **Pagos**: Control por etapas (50% firma / 40% materiales / 10% techo + placa)
- **Expediente**: Ficha completa por cliente con historial
- **Seguimiento**: Timeline de interacciones tipo chat
- **Configuración**: Gestión de usuarios y backup de datos

## 💾 Backup

Ve a **Configuración → Exportar Backup** para descargar todos los datos en JSON.
Puedes importarlos en otro equipo desde el mismo menú.
# ClienteAPP
# ClienteAPP-2.0
# Cliente_APP
