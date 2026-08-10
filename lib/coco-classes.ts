/**
 * Las 80 clases que reconoce COCO-SSD, con nombre en español y agrupadas por
 * familia.
 *
 * El modelo devuelve siempre la etiqueta en inglés; este mapa es lo único que
 * hace falta para mostrarla traducida, tanto en el panel como sobre el lienzo.
 * Los grupos ya no pintan nada: sirven para ordenar el panel de detecciones y
 * para que el tutorial sugiera objetos que el usuario probablemente tenga cerca.
 */

export type ClassGroup =
  | "persona"
  | "cotidiano"
  | "electronica"
  | "comida"
  | "mobiliario"
  | "vehiculo"
  | "animal"
  | "deporte"
  | "exterior";

export type CocoClass = {
  /** Etiqueta exacta que devuelve el modelo. */
  en: string;
  es: string;
  group: ClassGroup;
  /** Se le puede pedir al usuario que lo muestre a la cámara. */
  handy?: boolean;
};

export const COCO_CLASSES: CocoClass[] = [
  { en: "person", es: "persona", group: "persona" },

  // Objetos que cualquiera tiene cerca de un escritorio
  { en: "cell phone", es: "teléfono", group: "electronica", handy: true },
  { en: "laptop", es: "notebook", group: "electronica", handy: true },
  { en: "keyboard", es: "teclado", group: "electronica", handy: true },
  { en: "mouse", es: "mouse", group: "electronica", handy: true },
  { en: "remote", es: "control remoto", group: "electronica", handy: true },
  { en: "tv", es: "televisor", group: "electronica" },
  { en: "microwave", es: "microondas", group: "electronica" },
  { en: "oven", es: "horno", group: "electronica" },
  { en: "toaster", es: "tostadora", group: "electronica" },
  { en: "refrigerator", es: "heladera", group: "electronica" },
  { en: "sink", es: "pileta", group: "electronica" },
  { en: "hair drier", es: "secador de pelo", group: "electronica" },

  { en: "cup", es: "taza", group: "cotidiano", handy: true },
  { en: "bottle", es: "botella", group: "cotidiano", handy: true },
  { en: "book", es: "libro", group: "cotidiano", handy: true },
  { en: "scissors", es: "tijera", group: "cotidiano", handy: true },
  { en: "clock", es: "reloj", group: "cotidiano", handy: true },
  { en: "vase", es: "florero", group: "cotidiano" },
  { en: "toothbrush", es: "cepillo de dientes", group: "cotidiano", handy: true },
  { en: "wine glass", es: "copa", group: "cotidiano", handy: true },
  { en: "fork", es: "tenedor", group: "cotidiano", handy: true },
  { en: "knife", es: "cuchillo", group: "cotidiano", handy: true },
  { en: "spoon", es: "cuchara", group: "cotidiano", handy: true },
  { en: "bowl", es: "bol", group: "cotidiano", handy: true },
  { en: "backpack", es: "mochila", group: "cotidiano", handy: true },
  { en: "umbrella", es: "paraguas", group: "cotidiano", handy: true },
  { en: "handbag", es: "cartera", group: "cotidiano", handy: true },
  { en: "tie", es: "corbata", group: "cotidiano", handy: true },
  { en: "suitcase", es: "valija", group: "cotidiano" },
  { en: "teddy bear", es: "oso de peluche", group: "cotidiano", handy: true },

  { en: "banana", es: "banana", group: "comida", handy: true },
  { en: "apple", es: "manzana", group: "comida", handy: true },
  { en: "orange", es: "naranja", group: "comida", handy: true },
  { en: "sandwich", es: "sándwich", group: "comida", handy: true },
  { en: "broccoli", es: "brócoli", group: "comida" },
  { en: "carrot", es: "zanahoria", group: "comida", handy: true },
  { en: "hot dog", es: "pancho", group: "comida" },
  { en: "pizza", es: "pizza", group: "comida" },
  { en: "donut", es: "dona", group: "comida" },
  { en: "cake", es: "torta", group: "comida" },

  { en: "chair", es: "silla", group: "mobiliario" },
  { en: "couch", es: "sillón", group: "mobiliario" },
  { en: "potted plant", es: "planta en maceta", group: "mobiliario" },
  { en: "bed", es: "cama", group: "mobiliario" },
  { en: "dining table", es: "mesa", group: "mobiliario" },
  { en: "toilet", es: "inodoro", group: "mobiliario" },

  { en: "bicycle", es: "bicicleta", group: "vehiculo" },
  { en: "car", es: "auto", group: "vehiculo" },
  { en: "motorcycle", es: "moto", group: "vehiculo" },
  { en: "airplane", es: "avión", group: "vehiculo" },
  { en: "bus", es: "colectivo", group: "vehiculo" },
  { en: "train", es: "tren", group: "vehiculo" },
  { en: "truck", es: "camión", group: "vehiculo" },
  { en: "boat", es: "barco", group: "vehiculo" },

  { en: "bird", es: "pájaro", group: "animal" },
  { en: "cat", es: "gato", group: "animal" },
  { en: "dog", es: "perro", group: "animal" },
  { en: "horse", es: "caballo", group: "animal" },
  { en: "sheep", es: "oveja", group: "animal" },
  { en: "cow", es: "vaca", group: "animal" },
  { en: "elephant", es: "elefante", group: "animal" },
  { en: "bear", es: "oso", group: "animal" },
  { en: "zebra", es: "cebra", group: "animal" },
  { en: "giraffe", es: "jirafa", group: "animal" },

  { en: "frisbee", es: "frisbee", group: "deporte" },
  { en: "skis", es: "esquís", group: "deporte" },
  { en: "snowboard", es: "snowboard", group: "deporte" },
  { en: "sports ball", es: "pelota", group: "deporte", handy: true },
  { en: "kite", es: "barrilete", group: "deporte" },
  { en: "baseball bat", es: "bate de béisbol", group: "deporte" },
  { en: "baseball glove", es: "guante de béisbol", group: "deporte" },
  { en: "skateboard", es: "skate", group: "deporte" },
  { en: "surfboard", es: "tabla de surf", group: "deporte" },
  { en: "tennis racket", es: "raqueta", group: "deporte" },

  { en: "traffic light", es: "semáforo", group: "exterior" },
  { en: "fire hydrant", es: "hidrante", group: "exterior" },
  { en: "stop sign", es: "señal de pare", group: "exterior" },
  { en: "parking meter", es: "parquímetro", group: "exterior" },
  { en: "bench", es: "banco", group: "exterior" },
];

const BY_EN = new Map(COCO_CLASSES.map((c) => [c.en, c]));

/** Nombre en el idioma pedido. Si el modelo devolviera algo fuera del catálogo, cae en la etiqueta cruda. */
export function classLabel(en: string, locale: "es" | "en"): string {
  if (locale === "en") return en;
  return BY_EN.get(en)?.es ?? en;
}

export function classGroup(en: string): ClassGroup | undefined {
  return BY_EN.get(en)?.group;
}

/** Objetos que se le pueden pedir al usuario durante el tutorial. */
export const HANDY_CLASSES = COCO_CLASSES.filter((c) => c.handy);

export const TOTAL_CLASSES = COCO_CLASSES.length;

/**
 * Roles de color de las cajas. Son tres y no nueve a propósito.
 *
 * Colorear por familia de objeto no aporta —la etiqueta de texto ya dice qué
 * es— y en pantalla aparecen varias familias a la vez, así que habría que
 * distinguir todos los pares entre sí. Con ocho tonos eso no se sostiene: el
 * peor par cae a ΔE 1,6 bajo deuteranopía y a 7,1 con visión normal, o sea
 * indistinguibles. Con tres roles semánticos el peor par queda en ΔE 9,4 y 20,9.
 *
 * Lo que sí necesita distinguirse es "persona" —es lo que dispara la grabación
 * automática— del resto, más un tercer rol para lo que el tutorial pide mostrar.
 */
export const ROLE_COLOR = {
  /** Dispara la grabación automática. */
  persona: "#d95926",
  objeto: "#3987e5",
  /** El objeto que el tutorial pidió y ya apareció. */
  destacado: "#199e70",
} as const;

export type BoxRole = keyof typeof ROLE_COLOR;

export function roleFor(en: string, highlighted?: string | null): BoxRole {
  if (highlighted && en === highlighted) return "destacado";
  return en === "person" ? "persona" : "objeto";
}

export function colorFor(en: string, highlighted?: string | null): string {
  return ROLE_COLOR[roleFor(en, highlighted)];
}
