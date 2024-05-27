const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 1234;

// Ruta estática para servir imágenes cargadas y otros archivos estáticos
app.use(express.static(path.join(__dirname, '')));

// Ruta para servir el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'galeriaDD.html'));
});

// Configura el almacenamiento de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'upload')) // Define la carpeta donde se guardarán las imágenes cargadas
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) // Define el nombre del archivo
  }
});

// Inicializa multer con la configuración de almacenamiento
const upload = multer({ storage: storage });

// Ruta para cargar imágenes
app.post('/upload', upload.single('image'), (req, res) => {
  // Verifica si hay un error durante la carga de la imagen
  if (!req.file) {
    // No se ha proporcionado ninguna imagen
    return res.status(400).send('No se ha proporcionado ninguna imagen');
  }

  // Aquí puedes acceder a la imagen cargada a través de req.file
  // Por ejemplo, para obtener la ruta de la imagen cargada:
  const imagePath = req.file.path;
  // Envia la URL pública de la imagen al cliente
  res.send(`http://localhost:${PORT}/upload/${req.file.filename}`);
});

// Ruta para obtener la lista de imágenes cargadas
app.get('/images', (req, res) => {
  const directoryPath = path.join(__dirname, 'upload');
  // Lee el contenido del directorio de imágenes
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Error al leer el directorio de imágenes');
    }
    // Filtra solo los archivos de imagen
    const imageFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif'].includes(extension);
    });
    // Construye la URL completa para cada imagen
    const imageUrls = imageFiles.map(file => `http://localhost:${PORT}/upload/${file}`);
    // Envía la lista de URLs de imágenes al cliente
    res.json(imageUrls);
  });
});

// Ruta para eliminar imágenes
app.delete('/upload/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'upload', filename);

  // Verifica si el archivo existe en el sistema de archivos
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      // El archivo no existe
      return res.status(404).send('La imagen no existe');
    }

    // Elimina el archivo del sistema de archivos
    fs.unlink(imagePath, (err) => {
      if (err) {
        // Error al eliminar el archivo
        return res.status(500).send('Error al eliminar la imagen');
      }
      // Eliminación exitosa
      res.status(200).send('Imagen eliminada correctamente');
    });
  });
});


// Manejador de errores para Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error de Multer
    return res.status(500).send('Hubo un error al cargar la imagen: ' + err.message);
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
