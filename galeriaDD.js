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

// Añadimos evento al pasar por encima de la zona con algo arrastrado
zona.addEventListener("dragover", (e) => {
    e.preventDefault();
    zona.style.border = "4px dashed #000";
});

// Añadimos evento al salir de la zona
zona.addEventListener("dragleave", () => {
    zona.style.border = "4px dashed #999";
});

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
        abrirModal(imageUrl);
    });
}

// Función para abrir el modal de imagen completa
function abrirModal(imageUrl, desdeMenu = false) {
    // creamos la caja para insertar la imagen al hacer click
    const allImagesModal = document.getElementById('all-images-modal');
    allImagesModal.style.display = "none"; // Ocultar el menú de "Ver todas las imágenes"

    modal.style.display = "flex"; // Mostrar el modal de imagen completa
    modalContent.style.display = "block";
    modalImg.src = imageUrl;
    downloadLink.href = imageUrl; // Asigna la URL de la imagen al enlace de descarga

    // Si se abrió desde el menú de imágenes, agregar un botón para retroceder
    if (desdeMenu) {
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        modalContent.appendChild(backButton);

        // Agregar evento de clic al botón de retroceso
        backButton.addEventListener('click', () => {
            // Oculta el modal de imagen completa y muestra el menú de "Ver todas las imágenes"
            modal.style.display = "none";
            modalContent.style.display = "none";
            allImagesModal.style.display = "flex";
        });
    }
}

// Añadimos evento al dejar en la zona algo arrastrado
zona.addEventListener("drop", async (e) => {
    e.preventDefault();
    zona.style.border = "4px dashed #999";

    const files = e.dataTransfer.files;

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
});

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

// Añadimos eventos de click a las flechas para desplazar la galería
arrowLeft.addEventListener('click', () => {
    scrollGallery('left');
});

arrowRight.addEventListener('click', () => {
    scrollGallery('right');
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

// Añadimos eventos para borrar y (fav)
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

// Evento para cerrar el modal
closeModalBtn.addEventListener('click', () => {
    modal.style.display = "none";
    modalContent.style.display = "none";
});

// Cierra el modal si el usuario hace clic fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target == modalAllImages) {
        modalAllImages.style.display = "none";
        modalContent.style.display = "none";
    }
});


// Dentro de la sección de JavaScript de tu documento HTML

// Función para abrir el modal de "Ver todas las imágenes"
function openAllImagesModal() {
    const allImagesModal = document.getElementById('all-images-modal'); // Corregido para seleccionar el modal por ID
    allImagesModal.style.display = "flex";

    // Llamamos a la función para cargar las imágenes recientes
    cargarImagenesRecientes();

    // Agregar eventos de clic a las imágenes dentro del modal de "Ver todas las imágenes"
    const allImages = document.querySelectorAll('#all-images-modal .image-area img');
    allImages.forEach(image => {
        image.addEventListener('click', () => {
            abrirModal(image.src, false); // No es necesario el botón de retroceso en este caso
        });
    });

}

// Cierra el modal si el usuario hace clic fuera del contenido

window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = "none";
        modalContent.style.display = "none";
    }
});

// Función para cerrar el modal de "Ver todas las imágenes"
function closeAllImagesModal() {
    const allImagesModal = document.getElementById('all-images-modal');
    allImagesModal.style.display = "none";
}


// Función para cargar las imágenes recientes
async function cargarImagenesRecientes() {
    const imageArea = document.querySelector('.image-area');
    imageArea.innerHTML = ''; // Limpiamos el área de imágenes

    try {
        const response = await fetch('/images');
        if (!response.ok) {
            console.error('Error al obtener la lista de imágenes');
            return;
        }
        const imageUrls = await response.json();

        // Insertamos las imágenes al principio del contenedor
        imageUrls.reverse().forEach(imageUrl => {
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

            // Aquí puedes implementar la lógica para cargar imágenes favoritas, si tienes una función específica para ello.
        }
    });
});

// Eventos para abrir y cerrar el modal
document.querySelector('.verTodo').addEventListener('click', openAllImagesModal);
document.querySelector('#all-images-modal .close').addEventListener('click', closeAllImagesModal);
