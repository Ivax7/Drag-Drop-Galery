// Guardamos elementos en las variables
const zona = document.querySelector(".zonaArrastre");
const arrowLeft = document.querySelector('.arrow-left');
const arrowRight = document.querySelector('.arrow-right');
const galeriaScrolleable = document.querySelector('.galeriaScrolleable');

// Modal elements
const modal = document.getElementById('modal');
const modalAllImages = document.getElementById('all-images-modal');
const modalContent = document.querySelector('.modal-content');
const modalImg = document.getElementById('modal-img');
const closeModalBtn = document.querySelector('.close');
const downloadLink = document.getElementById('download-link');

zona.addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async function(event) {
    const files = event.target.files;
    await manejarArchivos(files);
});

// Añadimos evento al pasar por encima de la zona con algo arrastrado
zona.addEventListener("dragover", (e) => {
    e.preventDefault();
    zona.style.border = "4px dashed #000";
});

// Añadimos evento al salir de la zona
zona.addEventListener("dragleave", () => {
    zona.style.border = "4px dashed #999";
});

// Añadimos evento al dejar en la zona algo arrastrado
zona.addEventListener("drop", async (e) => {
    e.preventDefault();
    zona.style.border = "4px dashed #999";
    const files = e.dataTransfer.files;
    await manejarArchivos(files);
});

// Función para manejar archivos seleccionados o arrastrados
async function manejarArchivos(files) {
    try {
        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const imageUrl = await response.text();
                setTimeout(() => {
                    crearImagen(imageUrl);
                }, 1700);
                mostrarSpinnerYCheck();
            } else {
                console.error('Error al cargar la imagen');
            }
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}

// Función para mostrar el spinner y el check
function mostrarSpinnerYCheck() {
    const frase = document.querySelector('.frase');
    frase.style.display = 'none';

    const spinner = document.querySelector('.fa-spinner');
    spinner.style.display = 'block';
    spinner.style.opacity = 1;

    setTimeout(() => {
        spinner.style.display = 'none';

        const check = document.querySelector('.fa-check');
        check.style.display = 'block';
        check.style.opacity = 1;

        setTimeout(() => {
            check.style.display = 'none';
            frase.style.display = 'block';
        }, 1000);
    }, 1000);
}

// Función para cargar las imágenes desde el servidor
async function cargarImagenes() {
    try {
        const response = await fetch('/images');
        if (!response.ok) {
            console.error('Error al obtener la lista de imágenes');
            return;
        }
        const imageUrls = await response.json();
        
        for (const imageUrl of imageUrls) {
            crearImagen(imageUrl);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}

// Llamamos a la función para cargar las imágenes cuando la página se carga por primera vez
window.addEventListener('load', cargarImagenes);

// Función para crear una imagen en el DOM
function crearImagen(imageUrl) {
    // creas el div que envuelve la imagen
    const imagenContainer = document.createElement("div");
    imagenContainer.className = "imagen";
    // creas la imagen
    const imagen = document.createElement("img");
    imagen.src = imageUrl;
    // creas su botón de corazon
    const buttonHeart = document.createElement("i");
    buttonHeart.className = "fas fa-heart button-heart";
    // creas su botón de cerrar imagen
    const buttonClose = document.createElement("i");
    buttonClose.className = "fas fa-times button-close";
    // Añades los elementos imagen y boton al div
    imagenContainer.appendChild(imagen);
    imagenContainer.appendChild(buttonHeart);
    imagenContainer.appendChild(buttonClose);
    
    // Insertamos la imagen al principio del contenedor para que la más reciente esté la primera
    galeriaScrolleable.insertBefore(imagenContainer, galeriaScrolleable.firstChild)

    // Añadimos evento de clic a la imagen para abrir el modal
    imagen.addEventListener('click', () => {
        abrirModal(imageUrl, false);
    });

    // Verifica y restaura el estado de favorito al cargar la página
    if (imagenesFavoritas.includes(imageUrl)) {
        buttonHeart.classList.add('favorito');
        buttonHeart.style.color = 'green'; // Cambia el color a verde
    }

    // Evento de clic para agregar o quitar una imagen de favoritos
    buttonHeart.addEventListener('click', async (e) => {
        e.stopPropagation(); // Evitar que el clic se propague al hacer clic en el corazón

        if (buttonHeart.classList.contains('favorito')) {
            // Si la imagen ya está en favoritos, la quitamos
            const index = imagenesFavoritas.indexOf(imageUrl);
            if (index > -1) {
                imagenesFavoritas.splice(index, 1);
            }
            buttonHeart.classList.remove('favorito');
            buttonHeart.style.color = ''; // Restaura el color original
        } else {
            // Si no está en favoritos, la agregamos
            imagenesFavoritas.push(imageUrl);
            buttonHeart.classList.add('favorito');
            buttonHeart.style.color = 'green'; // Cambia el color a verde
        }

        // Guarda la lista de imágenes favoritas en el almacenamiento local
        localStorage.setItem('favoritos', JSON.stringify(imagenesFavoritas));

        // Envía la lista de imágenes favoritas actualizada al servidor
        try {
            const response = await fetch('/favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ favoriteImageUrls: imagenesFavoritas })
            });
            if (!response.ok) {
                console.error('Error al enviar la lista de imágenes favoritas al servidor');
            }
        } catch (error) {
            console.error('Error de red al enviar la lista de imágenes favoritas al servidor:', error);
        }
    });

    // Evento de clic para eliminar la imagen
    buttonClose.addEventListener('click', async (e) => {
        e.stopPropagation(); // Evitar que el clic se propague al hacer clic en el botón de cerrar

        try {
            // Realizar la solicitud DELETE para eliminar la imagen del servidor
            const response = await fetch(imageUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageUrl: imageUrl })
            });

            if (response.ok) {
                // Eliminar la imagen del DOM
                imagenContainer.remove();

                // Si la imagen estaba marcada como favorita, también eliminarla de la lista de favoritos
                if (imagenesFavoritas.includes(imageUrl)) {
                    imagenesFavoritas = imagenesFavoritas.filter(url => url !== imageUrl);
                    localStorage.setItem('favoritos', JSON.stringify(imagenesFavoritas)); // Actualizar almacenamiento local

                    // Actualizar la lista de imágenes favoritas en el cliente
                    const favoriteImages = document.querySelectorAll('.image-area img');
                    favoriteImages.forEach(image => {
                        if (image.src === imageUrl) {
                            image.remove();
                        }
                    });
                }

                console.log('Imagen eliminada:', imageUrl);
            } else {
                console.error('Error al eliminar la imagen');
            }
        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
        }
    });
}

// Función para abrir el modal de imagen completa
function abrirModal(imageUrl, desdeMenu = false) {
    // creamos la caja para insertar la imagen al hacer click
    const allImagesModal = document.getElementById('all-images-modal');
    allImagesModal.style.display = "none"; // Ocultar el menú de "Ver todas las imágenes"

    // Verificar si la imagen existe antes de asignarla al modal
    fetch(imageUrl)
        .then(response => {
            if (response.ok) {
                modal.style.display = "flex"; // Mostrar el modal de imagen completa
                modalContent.style.display = "block";
                modalImg.src = imageUrl;
                downloadLink.href = imageUrl; // Asigna la URL de la imagen al enlace de descarga

                // Eliminar el botón de retroceso si ya existe
                const backButton = document.querySelector('.back-button');
                if(backButton){
                    backButton.remove()
                }
                // Si se abrió desde el menú de imágenes, agregar un botón para retroceder
                if (desdeMenu) {
                    const backButton = document.createElement('button');
                    backButton.classList.add('back-button');
                    backButton.innerHTML = '<i class="fas fa-arrow-left"></i>'; // Agrega el icono que desees

                    modalContent.insertBefore(backButton, modalImg);
                    
                    backButton.addEventListener('click', () => {
                        modalContent.style.display = "none"; // Ocultar el modal de imagen completa
                        modal.style.display = "none";
                        allImagesModal.style.display = "flex"; // Mostrar el menú de "Ver todas las imágenes"
                    });
                }
            } else {
                console.error('La imagen no existe o no se pudo cargar:', imageUrl);
            }
        })
        .catch(error => {
            console.error('Error al verificar la existencia de la imagen:', error);
        });
}

// Cerrar el modal
closeModalBtn.onclick = function () {
    modal.style.display = "none";
    modalContent.style.display = "none";
}

// Cerrar el modal si se hace clic fuera de él
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
        modalContent.style.display = "none";
    }
}

// Navegación en la galería con flechas
arrowLeft.addEventListener('click', () => {
    galeriaScrolleable.scrollBy({ left: -200, behavior: 'smooth' });
});

arrowRight.addEventListener('click', () => {
    galeriaScrolleable.scrollBy({ left: 200, behavior: 'smooth' });
});


function scrollGallery(direction) {
    const images = document.querySelectorAll('.galeriaScrolleable .imagen');
    const scrollLeft = galeriaScrolleable.scrollLeft;
    let newScrollPosition = scrollLeft;

    if (direction === 'left') {
        for (let i = images.length - 1; i >= 0; i--) {
            if (images[i].offsetLeft < scrollLeft) {
                newScrollPosition = images[i].offsetLeft;
                break;
            }
        }
    } else if (direction === 'right') {
        for (let i = 0; i < images.length; i++) {
            if (images[i].offsetLeft > scrollLeft) {
                newScrollPosition = images[i].offsetLeft;
                break;
            }
        }
    }

    animateScroll(galeriaScrolleable, scrollLeft, newScrollPosition, 300);
}

function animateScroll(element, start, end, duration) {
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const scrollDistance = end - start;
        const scrollStep = Math.min(progress / duration, 1) * scrollDistance;
        element.scrollLeft = start + scrollStep;
        if (progress < duration) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
}

// Añadimos eventos para borrar
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('button-close')) {
        const imagenContainer = e.target.closest('.imagen');
        const imagen = imagenContainer.querySelector('img');
        const imageUrl = imagen.src;

        try {
            const response = await fetch(imageUrl, {
                method: 'DELETE'
            });

            if (response.ok) {
                imagenContainer.remove();
                console.log('Imagen eliminada correctamente');
            } else {
                console.error('Error al eliminar la imagen');
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }
});

// Función para cerrar el modal
function cerrarModal() {
    modal.style.display = "none";
    modalContent.style.display = "none";
    // Remover la clase 'active' de cualquier otro contenedor que la tenga
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    // Añadir la clase 'active' al contenedor 'recientes'
    document.querySelector('.recientes').classList.add('active');
}

// Evento para cerrar el modal al hacer clic en el botón de cerrar
closeModalBtn.addEventListener('click', cerrarModal);

// Evento para cerrar el modal si el usuario hace clic fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        cerrarModal();
    }
});




// Cierra el modal si el usuario hace clic fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target == modalAllImages) {
        modalAllImages.style.display = "none";
        modalContent.style.display = "none";
    }
});

// Función para abrir el modal de "Ver todas las imágenes"
function openAllImagesModal() {
    const allImagesModal = document.getElementById('all-images-modal');
    allImagesModal.style.display = "flex";

    // Llamamos a la función para cargar las imágenes recientes
    cargarImagenesRecientes();

    // Agregar eventos de clic a las imágenes dentro del modal de "Ver todas las imágenes"
    const allImages = document.querySelectorAll('#all-images-modal .image-area img');
    allImages.forEach(image => {
        image.addEventListener('click', () => {
            abrirModal(image.src); // No es necesario el botón de retroceso en este caso
        });
    });

}

// Función para cerrar el modal de "Ver todas las imágenes"
function closeAllImagesModal() {
    const allImagesModal = document.getElementById('all-images-modal');
    allImagesModal.style.display = "none";
    
    // Remover la clase 'active' de cualquier otro contenedor que la tenga
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    // Añadir la clase 'active' al contenedor 'recientes'
    document.querySelector('.recientes').classList.add('active');
}

// Evento para (llamar a la función de) cerrar el modal al hacer clic en el botón de cerrar
document.querySelector('#all-images-modal .close').addEventListener('click', closeAllImagesModal);

// Evento para (llamar a la función de) cerrar el modal si el usuario hace clic fuera del contenido
window.addEventListener('click', (e) => {
    const allImagesModal = document.getElementById('all-images-modal');
    if (e.target == allImagesModal) {
        closeAllImagesModal(); // se hace una llamada a la función para que reinicie las clases
                                // si se hace clic fuera del modal
    }
});

// Eventos para abrir y cerrar el modal
document.querySelector('.verTodo').addEventListener('click', openAllImagesModal);



// Función para cargar las imágenes recientes
async function cargarImagenesRecientes() {
    const imageArea = document.querySelector('#all-images-modal .image-area');
    imageArea.innerHTML = ''; // Limpiamos el área de imágenes

    try {
        const response = await fetch('/images');
        if (!response.ok) {
            console.error('Error al obtener la lista de imágenes');
            return;
        }
        const imageUrls = await response.json();

        // Filtra las imágenes que existen en el servidor
        const existingImages = await Promise.all(imageUrls.map(async imageUrl => {
            try {
                const response = await fetch(imageUrl);
                if (response.ok) {
                    return imageUrl;
                }
            } catch (error) {
                console.error('Error al verificar la existencia de la imagen:', error);
            }
        }));

        // Insertamos las imágenes existentes al principio del contenedor
        existingImages.forEach(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            imageArea.insertBefore(img, imageArea.firstChild);

            // Añadimos evento de clic a cada imagen para abrir el modal
            img.addEventListener('click', () => {
                abrirModal(imageUrl, true);
            });
        });
    } catch (error) {
        console.error('Error de red:', error);
    }
}


let imagenesFavoritas = []; // Lista para almacenar las imágenes favoritas

// Función para cargar las imágenes favoritas
async function cargarImagenesFavoritas() {
    const imageArea = document.querySelector('#all-images-modal .image-area');
    imageArea.innerHTML = ''; // Limpiamos el área de imágenes

    try {
        // Realizar una solicitud al servidor para obtener las imágenes favoritas actuales
        const response = await fetch('/favorite');
        if (response.ok) {
            const favoriteImageUrls = await response.json();
            // Crear elementos de imagen y agregarlos al contenedor solo si existen en el servidor
            favoriteImageUrls.reverse();
            for (const imageUrl of favoriteImageUrls) {
                try {
                    const response = await fetch(imageUrl);
                    if (response.ok) {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.addEventListener('click', () => {
                            abrirModal(imageUrl, true);
                        });
                        imageArea.appendChild(img);
                    }
                } catch (error) {
                    console.error('Error al cargar la imagen favorita:', error);
                }
            }
        } else {
            console.error('Error al obtener las imágenes favoritas');
        }
    } catch (error) {
        console.error('Error al cargar las imágenes favoritas:', error);
    }
}


// Función para cambiar entre las pestañas "Recientes" y "Favoritos"
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Cambiar clase activa
        document.querySelector('.tab.active').classList.remove('active');
        tab.classList.add('active');

        // Si es la pestaña de "Recientes", cargar imágenes recientes
        if (tab.textContent === 'Recientes') {
            cargarImagenesRecientes();
        } else {
            // Si es la pestaña de "Favoritos", implementar lógica para cargar imágenes favoritas (pendiente)
            cargarImagenesFavoritas();
            // Aquí puedes implementar la lógica para cargar imágenes favoritas, si tienes una función específica para ello.
        }
    });
});

// Al cargar la página, verifica si hay imágenes favoritas almacenadas en el servidor
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/favorite');
        if (response.ok) {
            const favoriteImageUrls = await response.json();
            imagenesFavoritas = favoriteImageUrls;
            // Marca como favoritas las imágenes almacenadas
            marcarFavoritas();
        } else {
            console.error('Error al obtener las imágenes favoritas');
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
});

// Evento para agregar o quitar una imagen de favoritos
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('button-heart')) {
        const imagenContainer = e.target.closest('.imagen');
        const imagen = imagenContainer.querySelector('img');
        const imageUrl = imagen.src;

        // Si la imagen ya está en favoritos, la quitamos
        if (imagenesFavoritas.includes(imageUrl)) {
            console.log('Quitar imagen de favoritos:', imageUrl);
            const index = imagenesFavoritas.indexOf(imageUrl);
            if (index > -1) {
                imagenesFavoritas.splice(index, 1);
            }
            e.target.classList.remove('favorito');
        } else { // Si no está en favoritos, la agregamos
            console.log('Agregar imagen a favoritos:', imageUrl);
            imagenesFavoritas.push(imageUrl);
            e.target.classList.add('favorito');
        }

        // Guarda la lista de imágenes favoritas en el almacenamiento local
        localStorage.setItem('favoritos', JSON.stringify(imagenesFavoritas));

        // Envía la lista de imágenes favoritas actualizada al servidor
        try {
            const response = await fetch('/favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ favoriteImageUrls: imagenesFavoritas })
            });
            if (!response.ok) {
                console.error('Error al enviar la lista de imágenes favoritas al servidor');
            }
        } catch (error) {
            console.error('Error de red al enviar la lista de imágenes favoritas al servidor:', error);
        }

        // Actualiza la lista de imágenes favoritas en la interfaz de usuario
        cargarImagenesFavoritas();
    }
});





// Función para marcar las imágenes favoritas
function marcarFavoritas() {
    const botonesCorazon = document.querySelectorAll('.button-heart');
    botonesCorazon.forEach((buttonHeart) => {
        const imagenContainer = buttonHeart.closest('.imagen');
        const imagen = imagenContainer.querySelector('img');
        const imageUrl = imagen.src;

        if (imagenesFavoritas.includes(imageUrl)) {
            buttonHeart.classList.add('favorito');
        }
    });
}
