export const shopItems = [
  // Original Items
  { id: "pesca", name: "Caña de Pescar", price: 2500, description: "Aumenta tus ganancias en la pesca." },
  { id: "suerte", name: "Poción de Suerte", price: 7000, description: "Aumenta la probabilidad de éxito en los robos por 24h." },
  { id: "mascota", name: "Mascota Rara", price: 15000, description: "Demuestra tu estatus con una mascota exótica." },
  { id: "cofre", name: "Cofre del Tesoro", price: 50000, description: "Contiene una cantidad aleatoria de monedas (puede ser más o menos del precio)." },

  // --- 100 New Items ---

  // Tools
  { id: "pico", name: "Pico de Hierro", price: 1000, description: "Permite minar en busca de gemas." },
  { id: "hacha", name: "Hacha de Acero", price: 1200, description: "Permite talar árboles encantados." },
  { id: "mapa", name: "Mapa Desgastado", price: 500, description: "Revela la ubicación de un tesoro menor." },
  { id: "brujula", name: "Brújula Mágica", price: 3000, description: "Siempre apunta a la aventura más cercana." },
  { id: "martillo", name: "Martillo de Forja", price: 1800, description: "Necesario para la herrería." },
  { id: "ganzua", name: "Ganzúa Oxidada", price: 300, description: "Una pequeña probabilidad de abrir cofres cerrados." },
  { id: "pala", name: "Pala de Enterrador", price: 800, description: "Útil para desenterrar secretos." },
  { id: "lupa", name: "Lupa de Detective", price: 1500, description: "Ayuda a encontrar pistas ocultas." },
  { id: "red", name: "Red de Mariposas", price: 600, description: "Para atrapar insectos raros." },
  { id: "horca", name: "Horca de Granjero", price: 400, description: "Ideal para las tareas de la granja." },

  // Consumables
  { id: "pocion_vida", name: "Poción de Vida Menor", price: 100, description: "Restaura una pequeña cantidad de salud." },
  { id: "pocion_mana", name: "Poción de Maná Menor", price: 120, description: "Restaura una pequeña cantidad de maná." },
  { id: "pan", name: "Hogaza de Pan", price: 20, description: "Un bocado simple y saciante." },
  { id: "manzana", name: "Manzana Roja", price: 30, description: "Crujiente y dulce." },
  { id: "carne", name: "Filete Cocido", price: 80, description: "Recupera energía rápidamente." },
  { id: "trebol", name: "Trébol de 4 Hojas", price: 1000, description: "Aumenta tu suerte por una hora." },
  { id: "elixir", name: "Elixir de Sabiduría", price: 2000, description: "Doble de experiencia por 30 minutos." },
  { id: "antidoto", name: "Antídoto Universal", price: 250, description: "Cura cualquier veneno." },
  { id: "invisibilidad", name: "Poción de Invisibilidad", price: 5000, description: "Te vuelve invisible por 5 minutos." },
  { id: "galleta", name: "Galleta de la Fortuna", price: 50, description: "¿Qué dirá tu suerte hoy?" },

  // Collectibles
  { id: "gema_roja", name: "Gema Roja Pequeña", price: 500, description: "Brilla con una luz cálida." },
  { id: "gema_azul", name: "Gema Azul Pequeña", price: 500, description: "Fría al tacto." },
  { id: "moneda_oro", name: "Moneda de Oro Antigua", price: 1000, description: "De un reino olvidado." },
  { id: "diente_dragon", name: "Diente de Dragón Bebé", price: 8000, description: "Sorprendentemente afilado." },
  { id: "pluma_grifo", name: "Pluma de Grifo", price: 4000, description: "Increíblemente ligera." },
  { id: "reliquia", name: "Reliquia Misteriosa", price: 12000, description: "Nadie sabe para qué sirve, pero es valiosa." },
  { id: "estatua", name: "Estatua de Gato de Jade", price: 20000, description: "Un objeto de gran belleza y valor." },
  { id: "perla_negra", name: "Perla Negra", price: 30000, description: "Codiciada por reyes y piratas." },
  { id: "huevo_oro", name: "Huevo de Oro Macizo", price: 75000, description: "Pesa una tonelada. ¿O no?" },
  { id: "corona_oxidada", name: "Corona Oxidada", price: 2500, description: "Perteneció a un rey menor." },

  // Funny/Meme Items
  { id: "roca", name: "Roca Mascota", price: 10, description: "Es una roca. No hace mucho." },
  { id: "calcetin", name: "Calcetín Solitario", price: 5, description: "Ha perdido a su pareja." },
  { id: "aire", name: "Botella de Aire Puro", price: 100, description: "100% aire de montaña (o eso dice la etiqueta)." },
  { id: "chiste", name: "Chiste Malo Embotellado", price: 25, description: "Ábrelo bajo tu propio riesgo." },
  { id: "patito", name: "Patito de Goma", price: 40, description: "El compañero de baño ideal." },
  { id: "banana", name: "Cáscara de Banana", price: 15, description: "Cuidado donde la tiras." },
  { id: "pelusa", name: "Pelusa de Ombligo Rara", price: 1, description: "Una pieza de colección única." },
  { id: "sombrero_lata", name: "Sombrero de Papel de Aluminio", price: 60, description: "Para protegerte de las ondas psíquicas." },
  { id: "moco", name: "Moco de Goblin Falso", price: 35, description: "Perfecto para bromas." },
  { id: "ruido", name: "Sonido de Flatulencia en un Saco", price: 55, description: "El clásico que nunca falla." },

  // Weapons (Cosmetic)
  { id: "espada_madera", name: "Espada de Madera", price: 150, description: "Para entrenar. No corta mucho." },
  { id: "daga_hierro", name: "Daga de Hierro", price: 400, description: "Rápida y fiable." },
  { id: "arco_simple", name: "Arco Simple", price: 350, description: "No incluye flechas." },
  { id: "hacha_mano", name: "Hacha de Mano", price: 450, description: "Buena para lanzar... o para cortar leña." },
  { id: "baston_mago", name: "Bastón de Mago Aprendiz", price: 500, description: "Tiene una gema falsa que brilla." },
  { id: "lanza_corta", name: "Lanza Corta", price: 380, description: "Mejor mantener la distancia." },
  { id: "mandoble_acero", name: "Mandoble de Acero", price: 1500, description: "Pesada pero poderosa." },
  { id: "ballesta_ligera", name: "Ballesta Ligera", price: 1200, description: "Fácil de recargar." },
  { id: "lucero_alba", name: "Lucero del Alba", price: 900, description: "Una bola con pinchos unida a un palo." },
  { id: "katana", name: "Katana de Exhibición", price: 5000, description: "Doblada más de mil veces. No usar para cortar." },

  // Armor (Cosmetic)
  { id: "tunica_cuero", name: "Túnica de Cuero", price: 300, description: "Protección básica y con estilo." },
  { id: "yelmo_hierro", name: "Yelmo de Hierro", price: 500, description: "Protege la cabeza de golpes... y de pájaros." },
  { id: "guantes_tela", name: "Guantes de Tela", price: 80, description: "Mantienen tus manos limpias." },
  { id: "botas_viajero", name: "Botas de Viajero", price: 250, description: "Cómodas para largas caminatas." },
  { id: "escudo_madera", name: "Escudo de Madera Redondo", price: 200, description: "Mejor que usar tus manos para parar flechas." },
  { id: "cota_malla", name: "Cota de Malla", price: 2000, description: "Ofrece una buena protección." },
  { id: "capa_viaje", name: "Capa de Viaje con Capucha", price: 400, description: "Para pasar desapercibido." },
  { id: "grebas_acero", name: "Grebas de Acero", price: 800, description: "Protección para tus espinillas." },
  { id: "amuleto_proteccion", name: "Amuleto de Protección", price: 1000, description: "Dicen que da suerte." },
  { id: "armadura_completa", name: "Armadura de Placas Completa", price: 10000, description: "Impresionante y muy ruidosa." },

  // Magical Items
  { id: "orbe_vision", name: "Orbe de Visión", price: 3500, description: "Permite ver lugares lejanos." },
  { id: "runa_fuego", name: "Runa de Fuego", price: 1200, description: "Contiene la esencia del fuego." },
  { id: "runa_hielo", name: "Runa de Hielo", price: 1200, description: "Fría como el aliento de un dragón de hielo." },
  { id: "libro_hechizos", name: "Libro de Hechizos Básico", price: 2200, description: "Contiene un par de trucos de magia." },
  { id: "polvo_desaparicion", name: "Polvo de Desaparición", price: 800, description: "¡Puf!" },
  { id: "piedra_levitacion", name: "Piedra de Levitación", price: 6000, description: "Flota ligeramente sobre tu mano." },
  { id: "espejo_verdad", name: "Espejo de la Verdad", price: 7500, description: "Refleja la verdadera forma de las cosas." },
  { id: "varita_roble", name: "Varita de Roble", price: 900, description: "Una varita simple pero fiable para un mago." },
  { id: "talisman_bestias", name: "Talismán de las Bestias", price: 4500, description: "Permite hablar con los animales." },
  { id: "filacteria", name: "Filacteria Vacía", price: 25000, description: "Un objeto de poder oscuro. ¿Para qué la querrás?" },

  // Food & Ingredients
  { id: "queso", name: "Rueda de Queso", price: 150, description: "Un manjar en cualquier taberna." },
  { id: "hierba_curativa", name: "Hierba Curativa", price: 50, description: "Un remedio popular." },
  { id: "raiz_mordida", name: "Raíz de Mordida de Troll", price: 300, description: "Un ingrediente de pociones potente." },
  { id: "hongo_lunar", name: "Hongo Lunar", price: 220, description: "Brilla en la oscuridad." },
  { id: "sal_negra", name: "Sal Negra", price: 80, description: "Usada en rituales de protección." },
  { id: "botella_vino", name: "Botella de Vino Barato", price: 100, description: "Sabe a vinagre, pero calienta el alma." },
  { id: "saco_harina", name: "Saco de Harina", price: 40, description: "El inicio de todo buen pan." },
  { id: "semillas_misteriosas", name: "Paquete de Semillas Misteriosas", price: 200, description: "Plántalas y a ver qué sale." },
  { id: "ojo_newt", name: "Ojo de Tritón", price: 180, description: "No es un ojo de verdad. Es una baya." },
  { id: "tarro_miel", name: "Tarro de Miel", price: 120, description: "Dulce y pegajosa." },

  // Miscellaneous
  { id: "cuerda", name: "Cuerda de Cáñamo (10m)", price: 100, description: "Nunca sabes cuándo la necesitarás." },
  { id: "linterna", name: "Linterna de Aceite", price: 300, description: "Para explorar lugares oscuros." },
  { id: "saco_dormir", name: "Saco de Dormir de Piel", price: 500, description: "Para descansar en tus aventuras." },
  { id: "kit_pesca", name: "Kit de Pesca Avanzado", price: 4000, description: "Incluye sedal de mithril." },
  { id: "tienda_campana", name: "Tienda de Campaña", price: 1500, description: "Un hogar lejos del hogar." },
  { id: "pedernal", name: "Pedernal y Acero", price: 80, description: "Para encender fogatas." },
  { id: "odre_agua", name: "Odre de Agua", price: 60, description: "Mantente hidratado." },
  { id: "pergamino", name: "Pergamino en Blanco", price: 40, description: "Para escribir tus propias historias." },
  { id: "tinta", name: "Frasco de Tinta y Pluma", price: 70, description: "La pluma es de cuervo." },
  { id: "mochila_cuero", name: "Mochila de Cuero Grande", price: 1000, description: "Para llevar todos tus tesoros." }
];
