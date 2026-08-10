# IntelliMan

Detector de objetos en tiempo real desde la cámara, con grabación automática al
aparecer una persona. Todo el procesamiento ocurre en el navegador: la imagen nunca
sale del equipo del usuario.

**Next.js 15 · React 19 · TypeScript · TensorFlow.js (COCO-SSD) · Tailwind · shadcn/ui**

*Real-time object detection from your camera, with automatic recording when a person
appears. Everything runs in the browser — the feed never leaves the device.
The interface is bilingual (Spanish / English).*

---

## Qué hace

- **Reconoce 80 tipos de objeto** en vivo: personas, tazas, teléfonos, libros, animales,
  vehículos, comida. Cada uno queda encerrado en un recuadro con su nombre y el nivel
  de certeza.
- **Panel de detecciones** con lo que hay en cuadro en cada momento, agrupado por tipo
  y con la certeza en porcentaje.
- **Foto** del cuadro actual, con las marcas de detección incluidas.
- **Grabación manual** de video, con corte de seguridad a los 30 segundos.
- **Grabación automática**: arranca sola cuando aparece una persona y guarda cuando
  se va del cuadro.
- **Tutorial guiado** de ocho pasos que enseña la herramienta antes de usarla.

## El tutorial

Es lo primero que ve alguien que entra por primera vez, y se puede volver a abrir
en cualquier momento desde el botón de arriba a la derecha.

Recorre la interfaz resaltando cada control sobre la pantalla real, no sobre capturas.
Dos de los pasos son **interactivos y no se pueden saltear leyendo**: uno pide mostrarle
un objeto a la cámara y no avanza hasta que el modelo lo reconoce —devolviendo el nombre
de lo que encontró—, y otro pide sacar una foto. La idea es que nadie llegue a los
controles sin haber entendido antes qué hace la herramienta.

## Puesta en marcha

```bash
npm install
```

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) y permitir el acceso a la cámara.
No hay variables de entorno ni servicios externos: el modelo se descarga del CDN de
TensorFlow la primera vez (unos 12 MB) y queda en la caché del navegador.

## Decisiones de implementación

**El modelo y los backends se importan de forma dinámica.** Entraban en el bundle
inicial, que pesaba 383 kB antes de que la página pudiera pintar nada. Con la carga
diferida el primer render baja a 170 kB y el modelo llega mientras el usuario ya ve
la interfaz y el estado de carga.

**El bucle de inferencia se autorregula.** Corría con `setInterval` cada 100 ms sin
importar cuánto tardaba cada pasada; cuando la inferencia tardaba más que el intervalo,
las llamadas se encolaban y la interfaz se trababa. Ahora cada pasada agenda la
siguiente al terminar, así que en un equipo lento baja el ritmo en vez de congelarse.

**El grabador se construye en el momento de grabar.** Antes se creaba una sola vez al
montar el componente, tomando `captureStream()` de un `<video>` que todavía no tenía
imagen: quedaba atado a un stream sin pistas y los archivos salían vacíos. Ahora se
arma contra el `srcObject` real, sondeando qué contenedor soporta el navegador
(webm/vp9, webm/vp8, mp4) en vez de asumir uno.

**Tres colores, no nueve.** Las cajas se pintan por rol —persona, objeto, objeto
destacado por el tutorial— y no por familia de objeto. Colorear por familia obligaría a
distinguir todos los pares entre sí, porque aparecen simultáneos en pantalla; con ocho
tonos el peor par cae a ΔE 1,6 bajo deuteranopía, o sea indistinguible. Con tres roles
el peor par queda en ΔE 9,4. El nombre va escrito al lado de cada caja, así que el color
nunca es el único indicador.

**La grabación automática tiene margen.** El modelo pierde la detección de una persona
por un cuadro con bastante frecuencia; cortar apenas desaparece produciría decenas de
archivos de dos segundos. Espera 2,5 segundos sin nadie en cuadro antes de guardar.

## Estructura

```
app/
  page.tsx              Pantalla principal: cámara, controles y estados
  layout.tsx            Proveedores de tema e idioma
  utils/draw.tsx        Dibujo de las cajas sobre el lienzo
components/
  detection-panel.tsx   Lista en vivo de lo que hay en cuadro
  language-toggle.tsx   Selector español / inglés
  theme-toggle.tsx      Claro / oscuro / sistema
  tour/                 Tutorial guiado: pasos y superposición con foco
  ui/                   Primitivas de shadcn/ui
lib/
  coco-classes.ts       Las 80 clases del modelo, traducidas y agrupadas
  i18n.tsx              Diccionario bilingüe y contexto
  use-object-detection.ts   Carga del modelo y bucle de inferencia
  use-recorder.ts       Ciclo de vida de MediaRecorder
```

## Privacidad

No hay backend. El modelo se ejecuta en el navegador mediante WebGL, las fotos y los
videos se generan como blobs locales y se descargan directo a la carpeta del usuario.
Ninguna imagen se transmite a ningún servidor.
