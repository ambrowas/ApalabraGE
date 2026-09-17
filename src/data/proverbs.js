/**
 * Banco de Refranes y Proverbios Culturales
 * Proverbios de las etnias de Guinea Ecuatorial (Fang, Bubi, Ndowe, Bisio)
 * y de la tradición oral y sabiduría ancestral africana.
 */

export const proverbsData = [
  // ================= GUINEA ECUATORIAL (FANG) =================
  {
    id: 'ge-fang-01',
    phrase: 'UNA SOLA MANO NO PUEDE ATAR UN PAQUETE',
    native: 'Abok da te kiti kóbaga',
    culture: 'Fang (Guinea Ecuatorial)',
    meaning: 'La fuerza de la comunidad supera cualquier empeño individual. Se requiere la cooperación y unión de todos para alcanzar grandes metas.',
    hint: 'Habla sobre la necesidad de cooperar en comunidad y trabajar juntos.',
    category: 'Unión y Solidaridad',
    difficulty: 'facil'
  },
  {
    id: 'ge-fang-02',
    phrase: 'EL RÍO QUE CRECE NO OLVIDA SU MANANTIAL',
    native: 'Osú wa nen te vuán nlong wé',
    culture: 'Fang (Guinea Ecuatorial)',
    meaning: 'Por muy lejos que llegue una persona en la vida, jamás debe olvidar sus orígenes, a su familia ni la tierra que le vio nacer.',
    hint: 'Nos recuerda nunca olvidar las raíces familiares y la tierra natal.',
    category: 'Identidad y Raíces',
    difficulty: 'medio'
  },
  {
    id: 'ge-fang-03',
    phrase: 'EL ÁRBOL JOVEN SE DOBLA PERO EL VIEJO SE QUIEBRA',
    native: 'Eli yen ya kóbó, ntol ya búc',
    culture: 'Fang (Guinea Ecuatorial)',
    meaning: 'La educación y los buenos hábitos deben inculcarse desde la niñez, pues de adultos es difícil corregir las costumbres.',
    hint: 'Enseña sobre la importancia de aprender buenos valores desde la infancia.',
    category: 'Educación y Sabiduría',
    difficulty: 'dificil'
  },
  {
    id: 'ge-fang-04',
    phrase: 'CUANDO EL ELEFANTE SE CAE LA HIERBA SUFRE',
    native: 'Nzoe a kuan, bilóg bia yen zié',
    culture: 'Fang (Guinea Ecuatorial)',
    meaning: 'Los conflictos y errores de los poderosos o líderes suelen afectar principalmente al pueblo humilde.',
    hint: 'Reflexión sobre cómo las disputas de los grandes afectan a los pequeños.',
    category: 'Justicia y Sociedad',
    difficulty: 'medio'
  },
  {
    id: 'ge-fang-05',
    phrase: 'EL QUE TIENE PACIENCIA COME EL MEJOR FRUTO',
    native: 'Mbor a yian mbó a di mbum mva',
    culture: 'Fang (Guinea Ecuatorial)',
    meaning: 'Las prisas llevan al error; quien sabe esperar con serenidad obtiene la recompensa más dulce.',
    hint: 'El valor de la paciencia y no apresurarse en la vida.',
    category: 'Paciencia',
    difficulty: 'medio'
  },

  // ================= GUINEA ECUATORIAL (BUBI) =================
  {
    id: 'ge-bubi-01',
    phrase: 'EL AGUA DEL COCO ES SECRETA HASTA QUE SE PARTE',
    native: 'Bilo bi kókó bi tuka tuka',
    culture: 'Bubi (Isla de Bioko)',
    meaning: 'El valor y las intenciones reales del corazón humano solo se revelan en los momentos de prueba y dificultad.',
    hint: 'Metáfora sobre descubrir la verdadera esencia de las personas.',
    category: 'Sabiduría y Carácter',
    difficulty: 'dificil'
  },
  {
    id: 'ge-bubi-02',
    phrase: 'QUIEN CAMINA CON LUZ NO TROPIEZA CON RAÍCES',
    native: 'Mueh o leke na boó a te tubari',
    culture: 'Bubi (Isla de Bioko)',
    meaning: 'La persona prudente que busca consejo en los ancianos y actúa con verdad evita los peligros del camino.',
    hint: 'Sobre la prudencia y buscar el consejo de los sabios.',
    category: 'Prudencia',
    difficulty: 'medio'
  },
  {
    id: 'ge-bubi-03',
    phrase: 'LA MONTAÑA NO SE MUEVE ANTE EL VIENTO',
    native: 'Rikoko a te nene na mpepe',
    culture: 'Bubi (Pico Basilé / Bioko)',
    meaning: 'La entereza y la firmeza moral permiten superar cualquier adversidad sin perder la calma ni la dignidad.',
    hint: 'Inspirado en la grandeza del Pico Basilé y la fortaleza interior.',
    category: 'Fortaleza',
    difficulty: 'facil'
  },

  // ================= GUINEA ECUATORIAL (NDOWE & BISIO) =================
  {
    id: 'ge-ndowe-01',
    phrase: 'EL MAR NUNCA RECHAZA EL AGUA DE LOS RÍOS',
    native: 'Iwele si te benga mayi ma mino',
    culture: 'Ndowe (Pueblos de la Costa)',
    meaning: 'La verdadera generosidad y hospitalidad acoge a todos sin distinción ni rencor.',
    hint: 'Inspirado en el océano y la generosidad de acoger a todos.',
    category: 'Hospitalidad',
    difficulty: 'medio'
  },
  {
    id: 'ge-ndowe-02',
    phrase: 'EL BUEN PESCADOR SABE ESPERAR LA MAREA',
    native: 'Mububi wamwamu a yibi bota ebuwa',
    culture: 'Ndowe (Pueblo Playeros)',
    meaning: 'Cada cosa tiene su tiempo oportuno; actuar antes o después de tiempo malogra el esfuerzo.',
    hint: 'Sabiduría marinera sobre saber elegir el momento oportuno.',
    category: 'Oportunidad y Tiempo',
    difficulty: 'medio'
  },
  {
    id: 'ge-bisio-01',
    phrase: 'EL FUEGO QUE COMPARTE NO SE APAGA',
    native: 'Ngua ya kabe te zim',
    culture: 'Bisio (Litoral de Río Muni)',
    meaning: 'Compartir la riqueza, el conocimiento y la alegría con los vecinos no empobrece, sino que multiplica la prosperidad.',
    hint: 'Compartir los dones con el prójimo nos hace más prósperos.',
    category: 'Generosidad',
    difficulty: 'facil'
  },

  // ================= SABIDURÍA PANAFRICANA =================
  {
    id: 'afr-01',
    phrase: 'SE NECESITA TODO UN PUEBLO PARA EDUCAR A UN NIÑO',
    native: 'Proverbio Ubuntu',
    culture: 'África Subsahariana',
    meaning: 'La crianza y formación moral de las futuras generaciones es responsabilidad de toda la sociedad en su conjunto.',
    hint: 'Famoso refrán sobre la educación comunitaria de la infancia.',
    category: 'Comunidad y Educación',
    difficulty: 'dificil'
  },
  {
    id: 'afr-02',
    phrase: 'SI QUIERES IR RÁPIDO VE SOLO SI QUIERES LLEGAR LEJOS VE ACOMPAÑADO',
    native: 'Sabiduría Tradicional Africana',
    culture: 'Proverbio Panafricano',
    meaning: 'El compañerismo y el trabajo en equipo garantizan la sostenibilidad y el éxito duradero en cualquier empresa humana.',
    hint: 'Sobre la diferencia entre la velocidad solitaria y la resistencia colectiva.',
    category: 'Compañerismo',
    difficulty: 'dificil'
  },
  {
    id: 'afr-03',
    phrase: 'HASTA QUE LOS LEONES TENGAN SUS PROPIOS HISTORIADORES LAS HISTORIAS DE CAZA SIEMPRE GLORIFICARÁN AL CAZADOR',
    native: 'Chinua Achebe / Tradición Oral',
    culture: 'Sabiduría de África Occidental',
    meaning: 'Cada pueblo debe contar su propia historia desde su perspectiva y voz propia para que prevalezca la justicia y la verdad.',
    hint: 'Célebre proverbio sobre la importancia de contar nuestra propia historia.',
    category: 'Historia y Memoria',
    difficulty: 'dificil'
  },
  {
    id: 'afr-04',
    phrase: 'EL TAMBOR SUENA SEGÚN QUIEN LO TOCA',
    native: 'Sabiduría Yoruba',
    culture: 'Tradición Africana',
    meaning: 'Las herramientas y talentos dependen de la habilidad, intención y espíritu con que se utilicen.',
    hint: 'Metáfora sobre la música y el buen uso de los talentos.',
    category: 'Arte y Maestría',
    difficulty: 'facil'
  },
  {
    id: 'afr-05',
    phrase: 'LAS HUELLAS DE LOS ELEFANTES BORRAN LAS DE LOS OTROS ANIMALES',
    native: 'Sabiduría Masai',
    culture: 'África Oriental',
    meaning: 'Las grandes acciones y los verdaderos líderes dejan un impacto tan profundo que marca el rumbo de todos los demás.',
    hint: 'Sobre la grandeza de los grandes líderes y sus obras trascendentes.',
    category: 'Liderazgo',
    difficulty: 'dificil'
  },
  {
    id: 'afr-06',
    phrase: 'LA SABIDURÍA ES COMO UN ÁRBOL DE BAOBAB NADIE PUEDE ABRAZARLO SOLO',
    native: 'Sabiduría Akan / Ghana',
    culture: 'África Occidental',
    meaning: 'El conocimiento universal es tan inmenso que ningún ser humano puede abarcarlo por completo; necesitamos aprender de los demás.',
    hint: 'Compara el conocimiento con el gigantesco tronco del baobab.',
    category: 'Humildad y Sabiduría',
    difficulty: 'dificil'
  },
  {
    id: 'afr-07',
    phrase: 'EL CORAZÓN TRANQUILO PROLONGA LA VIDA',
    native: 'Proverbio Swahili',
    culture: 'Costa Oriental Africana',
    meaning: 'Vivir en paz con los semejantes y libre de rencores es la mejor medicina para el cuerpo y el alma.',
    hint: 'Enseña sobre la serenidad interior y la salud del alma.',
    category: 'Paz Interior',
    difficulty: 'medio'
  },
  {
    id: 'afr-08',
    phrase: 'EL LEÓN NO PIERDE EL SUEÑO POR LA OPINIÓN DE LAS OVEJAS',
    native: 'Sabiduría Zulú',
    culture: 'África Austral',
    meaning: 'Quien tiene claros sus principios y misión noble no debe distraerse por críticas vacías o envidias.',
    hint: 'Sobre mantener el foco y la convicción sin atender murmuraciones.',
    category: 'Carácter y Dignidad',
    difficulty: 'dificil'
  },
  {
    id: 'afr-09',
    phrase: 'CUANDO NO HAY ENEMIGO ADENTRO EL ENEMIGO AFUERA NO PUEDE HACER DAÑO',
    native: 'Proverbio Africano',
    culture: 'Sabiduría Panafricana',
    meaning: 'Si reina la armonía interna en una familia o nación, ninguna amenaza externa podrá derribarla.',
    hint: 'La importancia de la lealtad interna y la concordia.',
    category: 'Unidad y Armonía',
    difficulty: 'dificil'
  },
  {
    id: 'afr-10',
    phrase: 'LA LLUVIA NO CAE SOBRE UN SOLO TEJADO',
    native: 'Proverbio Ashanti',
    culture: 'África Occidental',
    meaning: 'Las dificultades y alegrías de la existencia humana son compartidas; todos estamos unidos bajo el mismo cielo.',
    hint: 'Nos recuerda que las vicisitudes de la vida nos alcanzan a todos por igual.',
    category: 'Empatía y Destino',
    difficulty: 'medio'
  }
];
