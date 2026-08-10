"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "es" | "en";

const STORAGE_KEY = "intelliman.locale";

/**
 * Diccionario plano. Un objeto anidado se lee mejor pero obliga a un tipo
 * recursivo para que el autocompletado siga funcionando; con claves planas
 * TypeScript verifica solas que ambos idiomas cubran exactamente lo mismo.
 */
const es = {
  "app.name": "IntelliMan",
  "app.tagline": "Detección de objetos en vivo desde tu cámara",

  "nav.tutorial": "Ver tutorial",
  "nav.language": "Idioma",
  "nav.theme": "Tema",

  "camera.loadingModel": "Cargando el modelo de visión…",
  "camera.loadingHint":
    "Son unos 12 MB que se descargan una sola vez y quedan en caché del navegador.",
  "camera.requesting": "Esperando permiso de cámara…",
  "camera.deniedTitle": "No pudimos acceder a la cámara",
  "camera.deniedBody":
    "El navegador bloqueó el acceso. Habilitá la cámara para este sitio desde el candado de la barra de direcciones y volvé a intentar.",
  "camera.retry": "Reintentar",
  "camera.noneTitle": "No encontramos ninguna cámara",
  "camera.noneBody":
    "Conectá una cámara y recargá la página. Todo el procesamiento ocurre en tu equipo.",

  "controls.mirror": "Espejar imagen",
  "controls.photo": "Sacar foto",
  "controls.record": "Grabar video",
  "controls.recordStop": "Detener grabación",
  "controls.autoRecord": "Grabación automática",
  "controls.autoRecordOn": "Grabación automática activada",
  "controls.autoRecordOff": "Grabación automática desactivada",
  "controls.sound": "Sonido de aviso",
  "controls.volume": "Volumen",

  "detect.title": "Qué está viendo",
  "detect.empty": "Todavía no hay nada en cuadro",
  "detect.emptyHint":
    "Mostrale un objeto a la cámara: una taza, tu teléfono, un libro, unas llaves.",
  "detect.confidence": "certeza",
  "detect.person": "persona",
  "detect.knows": "Reconoce {n} tipos de objeto",
  "detect.fps": "{n} análisis por segundo",

  "status.recording": "Grabando",
  "status.autoWaiting": "Esperando a que aparezca una persona",
  "status.autoActive": "Persona detectada · grabando",
  "status.ready": "Listo",

  "toast.photoSaved": "Foto descargada",
  "toast.recordStarted": "Grabación iniciada",
  "toast.recordSaved": "Video descargado",
  "toast.recordFailed": "No se pudo guardar el video",
  "toast.autoStarted": "Persona detectada, grabando",
  "toast.autoStopped": "Ya no hay nadie en cuadro, grabación guardada",
  "toast.cameraMissing": "No hay cámara disponible",

  "tour.skip": "Saltar",
  "tour.next": "Siguiente",
  "tour.back": "Atrás",
  "tour.finish": "Empezar a usarlo",
  "tour.step": "Paso {current} de {total}",
  "tour.waiting": "Esperándote…",
  "tour.done": "¡Listo!",
  "tour.replay": "Repetir tutorial",

  "tour.welcome.title": "Bienvenido a IntelliMan",
  "tour.welcome.body":
    "Es un detector de objetos que corre entero en tu navegador: la imagen de tu cámara nunca sale de tu equipo. En un minuto te muestro cómo se usa.",
  "tour.welcome.cta": "Empezar el tutorial",
  "tour.welcome.skip": "Ya lo conozco, entrar directo",

  "tour.camera.title": "Esta es tu cámara",
  "tour.camera.body":
    "Cada objeto que reconoce queda encerrado en un recuadro con su nombre y qué tan seguro está. Las personas se marcan en naranja y el resto en azul.",

  "tour.show.title": "Probalo: mostrale algo",
  "tour.show.body":
    "Agarrá cualquier cosa que tengas cerca y ponela frente a la cámara. Puede ser {examples}. Cuando la reconozca, seguimos.",
  "tour.show.waiting": "Esperando a que aparezca un objeto…",
  "tour.show.got": "¡Ahí está! Detectó: {label}",

  "tour.panel.title": "Todo lo que ve, en lista",
  "tour.panel.body":
    "Acá aparece cada objeto en cuadro con su nivel de certeza. Si movés el objeto o lo tapás parcialmente, vas a ver cómo sube y baja el porcentaje.",

  "tour.photo.title": "Sacar una foto",
  "tour.photo.body":
    "Descarga el cuadro actual como PNG, con las marcas de detección incluidas. Probá apretarlo.",
  "tour.photo.waiting": "Esperando que saques una foto…",

  "tour.record.title": "Grabar un video",
  "tour.record.body":
    "Arranca a grabar lo que ve la cámara. Volvés a apretarlo para cortar y el archivo se descarga solo. Si te olvidás, corta a los 30 segundos.",

  "tour.auto.title": "Grabación automática",
  "tour.auto.body":
    "Con esto activado, la grabación arranca sola cuando aparece una persona y se guarda cuando se va del cuadro. Es la función central de la herramienta.",

  "tour.extras.title": "Los ajustes",
  "tour.extras.body":
    "Espejar la imagen, cambiar entre claro y oscuro, elegir idioma y activar un aviso sonoro cuando empieza una grabación automática.",

  "tour.end.title": "Eso es todo",
  "tour.end.body":
    "Ya podés usarlo. Si te perdés, el botón «Ver tutorial» arriba a la derecha vuelve a abrir esta guía.",

  "privacy.title": "Todo pasa en tu equipo",
  "privacy.body":
    "El modelo se ejecuta en el navegador. Ni la imagen ni los videos se suben a ningún servidor: las descargas van directo a tu carpeta.",

  "footer.builtWith": "Detección con COCO-SSD sobre TensorFlow.js",
} as const;

const en: Record<keyof typeof es, string> = {
  "app.name": "IntelliMan",
  "app.tagline": "Live object detection from your camera",

  "nav.tutorial": "View tutorial",
  "nav.language": "Language",
  "nav.theme": "Theme",

  "camera.loadingModel": "Loading the vision model…",
  "camera.loadingHint":
    "About 12 MB, downloaded once and then cached by your browser.",
  "camera.requesting": "Waiting for camera permission…",
  "camera.deniedTitle": "We couldn't access your camera",
  "camera.deniedBody":
    "The browser blocked access. Allow the camera for this site from the padlock in the address bar and try again.",
  "camera.retry": "Try again",
  "camera.noneTitle": "No camera found",
  "camera.noneBody":
    "Connect a camera and reload the page. All processing happens on your device.",

  "controls.mirror": "Mirror image",
  "controls.photo": "Take a photo",
  "controls.record": "Record video",
  "controls.recordStop": "Stop recording",
  "controls.autoRecord": "Auto recording",
  "controls.autoRecordOn": "Auto recording enabled",
  "controls.autoRecordOff": "Auto recording disabled",
  "controls.sound": "Alert sound",
  "controls.volume": "Volume",

  "detect.title": "What it sees",
  "detect.empty": "Nothing in frame yet",
  "detect.emptyHint":
    "Show the camera an object: a cup, your phone, a book, your keys.",
  "detect.confidence": "confidence",
  "detect.person": "person",
  "detect.knows": "Recognises {n} object types",
  "detect.fps": "{n} scans per second",

  "status.recording": "Recording",
  "status.autoWaiting": "Waiting for a person to appear",
  "status.autoActive": "Person detected · recording",
  "status.ready": "Ready",

  "toast.photoSaved": "Photo downloaded",
  "toast.recordStarted": "Recording started",
  "toast.recordSaved": "Video downloaded",
  "toast.recordFailed": "Couldn't save the video",
  "toast.autoStarted": "Person detected, recording",
  "toast.autoStopped": "Frame is empty, recording saved",
  "toast.cameraMissing": "No camera available",

  "tour.skip": "Skip",
  "tour.next": "Next",
  "tour.back": "Back",
  "tour.finish": "Start using it",
  "tour.step": "Step {current} of {total}",
  "tour.waiting": "Waiting for you…",
  "tour.done": "Done!",
  "tour.replay": "Replay tutorial",

  "tour.welcome.title": "Welcome to IntelliMan",
  "tour.welcome.body":
    "An object detector that runs entirely in your browser — your camera feed never leaves your device. Let me show you how it works in about a minute.",
  "tour.welcome.cta": "Start the tutorial",
  "tour.welcome.skip": "I know my way around, go straight in",

  "tour.camera.title": "This is your camera",
  "tour.camera.body":
    "Every object it recognises gets a box with its name and how confident it is. People are marked in orange, everything else in blue.",

  "tour.show.title": "Try it: show it something",
  "tour.show.body":
    "Grab anything near you and hold it up to the camera. It could be {examples}. Once it recognises it, we move on.",
  "tour.show.waiting": "Waiting for an object to appear…",
  "tour.show.got": "There it is! It detected: {label}",

  "tour.panel.title": "Everything it sees, as a list",
  "tour.panel.body":
    "Each object in frame shows up here with its confidence level. Move the object around or partly cover it and watch the percentage rise and fall.",

  "tour.photo.title": "Take a photo",
  "tour.photo.body":
    "Downloads the current frame as a PNG, detection boxes included. Go ahead and press it.",
  "tour.photo.waiting": "Waiting for you to take a photo…",

  "tour.record.title": "Record a video",
  "tour.record.body":
    "Starts recording what the camera sees. Press again to stop and the file downloads on its own. If you forget, it stops after 30 seconds.",

  "tour.auto.title": "Auto recording",
  "tour.auto.body":
    "With this on, recording starts by itself when a person appears and saves when they leave the frame. It's the core feature of the tool.",

  "tour.extras.title": "The settings",
  "tour.extras.body":
    "Mirror the image, switch between light and dark, pick a language, and turn on a sound alert for when auto recording kicks in.",

  "tour.end.title": "That's everything",
  "tour.end.body":
    "You're ready to go. If you get lost, the «View tutorial» button in the top right brings this guide back.",

  "privacy.title": "Everything happens on your device",
  "privacy.body":
    "The model runs in the browser. Neither the feed nor the videos are uploaded anywhere — downloads go straight to your folder.",

  "footer.builtWith": "Detection by COCO-SSD on TensorFlow.js",
};

const DICTIONARIES = { es, en };

export type TranslationKey = keyof typeof es;

type I18nValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  /** `t("tour.step", { current: 2, total: 8 })` reemplaza {current} y {total}. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Arranca en español para que el servidor y el primer render del cliente
  // coincidan; la preferencia guardada se aplica después de montar.
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") {
      setLocaleState(stored);
      return;
    }
    // Sin preferencia guardada, seguimos al navegador.
    if (!navigator.language.toLowerCase().startsWith("es")) setLocaleState("en");
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback<I18nValue["t"]>(
    (key, vars) => {
      const raw = DICTIONARIES[locale][key] ?? key;
      if (!vars) return raw;
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        raw,
      );
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  return value;
}
