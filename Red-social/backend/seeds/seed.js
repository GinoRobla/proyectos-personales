require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Publication = require('../models/publication');
const Follow = require('../models/follow');

const connection = require('../database/connection');

// Avatares disponibles
const avatarImages = [
  '219983.png',
  '219988 (1).png', 
  '4086679.png',
  '4128176.png',
  '7084424.png',
  'User_icon_2.svg.png',
  'images (1).png',
  'images (2).png',
  'images (3).png',
  'images.png'
];

// Datos de usuarios ficticios
const users = [
  {
    name: 'Ana',
    surname: 'García',
    nick: 'ana_garcia',
    email: 'ana.garcia@email.com',
    bio: 'Amante de la fotografía y los viajes. Siempre buscando nuevas aventuras. 📸✈️'
  },
  {
    name: 'Carlos',
    surname: 'Rodríguez',
    nick: 'carlos_rodriguez',
    email: 'carlos.rodriguez@email.com',
    bio: 'Desarrollador Full Stack. Apasionado por la tecnología y el código limpio. 💻'
  },
  {
    name: 'María',
    surname: 'López',
    nick: 'maria_lopez',
    email: 'maria.lopez@email.com',
    bio: 'Diseñadora UX/UI. Creando experiencias digitales increíbles. 🎨'
  },
  {
    name: 'Juan',
    surname: 'Martínez',
    nick: 'juan_martinez',
    email: 'juan.martinez@email.com',
    bio: 'Chef profesional. La cocina es mi pasión y mi arte. 👨‍🍳'
  },
  {
    name: 'Laura',
    surname: 'González',
    nick: 'laura_gonzalez',
    email: 'laura.gonzalez@email.com',
    bio: 'Médica y deportista. Vida saludable es vida plena. 🏃‍♀️⚕️'
  },
  {
    name: 'Pedro',
    surname: 'Sánchez',
    nick: 'pedro_sanchez',
    email: 'pedro.sanchez@email.com',
    bio: 'Músico y compositor. La música es el lenguaje del alma. 🎵'
  },
  {
    name: 'Sofia',
    surname: 'Vargas',
    nick: 'sofia_vargas',
    email: 'sofia.vargas@email.com',
    bio: 'Arquitecta. Diseñando espacios que inspiran. 🏗️'
  },
  {
    name: 'Diego',
    surname: 'Herrera',
    nick: 'diego_herrera',
    email: 'diego.herrera@email.com',
    bio: 'Fotógrafo profesional. Capturando momentos únicos. 📷'
  },
  {
    name: 'Valentina',
    surname: 'Morales',
    nick: 'valentina_morales',
    email: 'valentina.morales@email.com',
    bio: 'Escritora y blogger. Las palabras son mi herramienta. ✍️'
  },
  {
    name: 'Andrés',
    surname: 'Castro',
    nick: 'andres_castro',
    email: 'andres.castro@email.com',
    bio: 'Ingeniero de datos. Los datos cuentan historias increíbles. 📊'
  },
  {
    name: 'Camila',
    surname: 'Jiménez',
    nick: 'camila_jimenez',
    email: 'camila.jimenez@email.com',
    bio: 'Psicóloga clínica. Ayudando a sanar mentes y corazones. 🧠💜'
  },
  {
    name: 'Sebastián',
    surname: 'Ruiz',
    nick: 'sebastian_ruiz',
    email: 'sebastian.ruiz@email.com',
    bio: 'Emprendedor digital. Construyendo el futuro una idea a la vez. 🚀'
  },
  {
    name: 'Isabella',
    surname: 'Torres',
    nick: 'isabella_torres',
    email: 'isabella.torres@email.com',
    bio: 'Veterinaria. Los animales son mi pasión y mi propósito. 🐕🐱'
  },
  {
    name: 'Gabriel',
    surname: 'Ramírez',
    nick: 'gabriel_ramirez',
    email: 'gabriel.ramirez@email.com',
    bio: 'Profesor de matemáticas. Los números tienen su propia belleza. 🔢'
  },
  {
    name: 'Natalia',
    surname: 'Flores',
    nick: 'natalia_flores',
    email: 'natalia.flores@email.com',
    bio: 'Abogada especialista en derechos humanos. Justicia para todos. ⚖️'
  }
];

// Textos para publicaciones
const publicationTexts = [
  "¡Qué hermoso día para salir y disfrutar del aire libre! 🌞",
  "Terminando un proyecto increíble. El trabajo duro siempre vale la pena 💪",
  "Reflexionando sobre la vida y sus pequeños milagros diarios ✨",
  "Compartiendo un momento especial con las personas que amo ❤️",
  "Aprendiendo algo nuevo cada día. Nunca dejemos de crecer 📚",
  "La creatividad no tiene límites cuando te apasiona lo que haces 🎨",
  "Disfrutando de una deliciosa comida casera. Nada como cocinar con amor 🍝",
  "El ejercicio es mi terapia diaria. Mente sana en cuerpo sano 🏋️‍♀️",
  "Explorando nuevos lugares y creando recuerdos inolvidables 🗺️",
  "La música tiene el poder de sanar el alma. ¿Cuál es tu canción favorita? 🎶",
  "Trabajando en mis metas y sueños. Paso a paso, día a día 🎯",
  "Agradecido por todas las bendiciones de la vida 🙏",
  "La naturaleza siempre me inspira y me da paz interior 🌿",
  "Compartiendo conocimientos y aprendiendo de otros. Juntos somos más fuertes 🤝",
  "Celebrando los pequeños logros que nos acercan a nuestros objetivos 🎉",
  "Un café ☕ y una buena conversación, así empieza mi día perfecto",
  "Los atardeceres me recuerdan que cada final puede ser hermoso 🌅",
  "Leyendo un libro que cambió mi perspectiva de la vida 📖",
  "Cocinando mi receta favorita de la abuela. Tradiciones que perduran 👵",
  "Nuevo reto aceptado. A veces hay que salir de la zona de confort 🚀",
  "La fotografía me permite capturar momentos que duran para siempre 📸",
  "Entrenamiento completado. Mi cuerpo me lo agradece 💪",
  "Trabajando desde casa hoy. La productividad tiene muchas formas 🏠",
  "Un paseo por la ciudad descubriendo rincones nuevos 🏙️",
  "La vida es demasiado corta para no perseguir tus sueños ⭐",
  "Domingo de descanso y autocuidado. Me lo merezco 🛀",
  "Nueva meta desbloqueada. Cada logro cuenta, por pequeño que sea 🏆",
  "Los amigos verdaderos son la familia que elegimos 👫",
  "Aprendiendo un nuevo skill. Nunca es tarde para evolucionar 🎓",
  "La paciencia es una virtud que estoy aprendiendo a cultivar 🧘‍♀️"
];

// Imágenes disponibles para publicaciones
const publicationImages = [
  'fall-autumn-red-season.jpg',
  'fondos-de-windows-10-6v938g71sm738jgi.jpg',
  'pexels-photo-531880.jpeg',
  'png-clipart-green-lawn-grass-lawn-grass-landscape-green-suburb-green-grass-landscape-computer-wallpaper-grass-thumbnail.png',
  'pngtree-item-with-white-background-2023-jpg-isolated-wallpaper-texture-photo-this-image_16122121.jpg',
  'sunflowers-3292932_640.jpg',
  null, // Sin imagen - para que algunas publicaciones no tengan imagen
  null,
  null,
  null
];

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');
    
    // Conectar a la base de datos
    await connection();
    
    // Limpiar colecciones existentes
    console.log('🧹 Limpiando colecciones existentes...');
    await User.deleteMany({});
    await Publication.deleteMany({});
    await Follow.deleteMany({});
    
    // Crear usuarios
    console.log('👥 Creando usuarios...');
    const createdUsers = [];
    
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Asignar avatar aleatorio
      const randomAvatar = getRandomElement(avatarImages);
      
      const user = new User({
        ...userData,
        image: randomAvatar,
        password: hashedPassword,
        created_at: getRandomDate(new Date(2023, 0, 1), new Date())
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      
      console.log(`✅ Usuario creado: ${userData.name} ${userData.surname} (${userData.nick}) - Avatar: ${randomAvatar}`);
    }
    
    // Crear publicaciones para cada usuario
    console.log('📝 Creando publicaciones...');
    const createdPublications = [];
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      
      for (let j = 0; j < 15; j++) {
        const publication = new Publication({
          user: user._id,
          text: getRandomElement(publicationTexts),
          file: getRandomElement(publicationImages),
          created_at: getRandomDate(new Date(2023, 6, 1), new Date())
        });
        
        const savedPublication = await publication.save();
        createdPublications.push(savedPublication);
      }
      
      console.log(`📄 15 publicaciones creadas para ${user.name} ${user.surname}`);
    }
    
    // Crear relaciones de seguimiento aleatorias
    console.log('🔗 Creando relaciones de seguimiento...');
    const followRelations = [];
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const otherUsers = createdUsers.filter(u => u._id.toString() !== user._id.toString());
      
      // Cada usuario seguirá entre 3-8 usuarios aleatorios
      const followCount = Math.floor(Math.random() * 6) + 3;
      const usersToFollow = [];
      
      // Seleccionar usuarios únicos para seguir
      while (usersToFollow.length < Math.min(followCount, otherUsers.length)) {
        const randomUser = getRandomElement(otherUsers);
        if (!usersToFollow.find(u => u._id.toString() === randomUser._id.toString())) {
          usersToFollow.push(randomUser);
        }
      }
      
      // Crear las relaciones de seguimiento
      for (const userToFollow of usersToFollow) {
        const follow = new Follow({
          user: user._id,
          followed: userToFollow._id,
          createdAt: getRandomDate(new Date(2023, 0, 1), new Date())
        });
        
        await follow.save();
        followRelations.push(follow);
      }
      
      console.log(`👥 ${user.name} sigue a ${usersToFollow.length} usuarios`);
    }
    
    console.log('\n✨ Seed completado exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${createdUsers.length} usuarios creados`);
    console.log(`   - ${createdPublications.length} publicaciones creadas`);
    console.log(`   - ${followRelations.length} relaciones de seguimiento creadas`);
    
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Email: ana.garcia@email.com');
    console.log('   Password: password123');
    console.log('\n   Todos los usuarios tienen la misma contraseña: password123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
};

// Ejecutar seed
seedDatabase();