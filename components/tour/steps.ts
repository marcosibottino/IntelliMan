import type { TranslationKey } from "@/lib/i18n";

/**
 * Señales que el tutorial observa para saber si el usuario hizo lo que se le
 * pidió. Es lo que permite que un paso no avance hasta que la acción ocurra de
 * verdad: mostrar un objeto a la cámara no se puede "leer", hay que hacerlo.
 */
export type TourSignals = {
  cameraReady: boolean;
  modelReady: boolean;
  /** Alguna detección que no sea una persona. */
  objectSeen: boolean;
  /** Etiqueta traducida del último objeto reconocido, para devolvérsela al usuario. */
  lastObjectLabel: string | null;
  photoTaken: boolean;
  autoRecordEnabled: boolean;
};

export type TourStep = {
  id: string;
  /** Valor de `data-tour` del elemento a resaltar. Sin esto, el paso va centrado. */
  target?: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  /** El paso queda bloqueado hasta que esto devuelva true. */
  waitFor?: (signals: TourSignals) => boolean;
  waitingKey?: TranslationKey;
  doneKey?: TranslationKey;
  /** Espacio extra alrededor del recorte, en píxeles. */
  padding?: number;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "camera",
    target: "camera",
    titleKey: "tour.camera.title",
    bodyKey: "tour.camera.body",
    padding: 4,
  },
  {
    id: "show",
    target: "camera",
    titleKey: "tour.show.title",
    bodyKey: "tour.show.body",
    // El paso central: no se puede saltear leyendo, hay que agarrar algo y
    // ponerlo frente a la cámara.
    waitFor: (s) => s.objectSeen,
    waitingKey: "tour.show.waiting",
    doneKey: "tour.show.got",
    padding: 4,
  },
  {
    id: "panel",
    target: "detections",
    titleKey: "tour.panel.title",
    bodyKey: "tour.panel.body",
  },
  {
    id: "photo",
    target: "photo",
    titleKey: "tour.photo.title",
    bodyKey: "tour.photo.body",
    waitFor: (s) => s.photoTaken,
    waitingKey: "tour.photo.waiting",
  },
  {
    id: "record",
    target: "record",
    titleKey: "tour.record.title",
    bodyKey: "tour.record.body",
  },
  {
    id: "auto",
    target: "auto",
    titleKey: "tour.auto.title",
    bodyKey: "tour.auto.body",
  },
  {
    id: "extras",
    target: "extras",
    titleKey: "tour.extras.title",
    bodyKey: "tour.extras.body",
  },
  {
    id: "end",
    titleKey: "tour.end.title",
    bodyKey: "tour.end.body",
  },
];

export const TOUR_STORAGE_KEY = "intelliman.tour.completed";
