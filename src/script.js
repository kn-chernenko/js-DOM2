const API_URL = "https://picsum.photos/v2/list";
const IMAGES_PER_PAGE = 4;

const gallery = document.querySelector("#gallery");
const statusMessage = document.querySelector("#status");
const loadMoreButton = document.querySelector("#loadMore");
const clearButton = document.querySelector("#clearGallery");
const removeLastButton = document.querySelector("#removeLast");
const reverseButton = document.querySelector("#reverseGallery");

let page = 1;
let isLoading = false;

function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("status-error", isError);
}

function createImageCard(image) {
    const figure = document.createElement("figure");
    figure.className = "gallery-card";
    figure.dataset.imageId = image.id;

    const img = document.createElement("img");
    img.src = image.download_url;
    img.alt = `Фотографія від ${image.author}`;
    img.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.textContent = image.author;

    figure.append(img, caption);
    return figure;
}

async function loadImages() {
    if (isLoading) {
        return;
    }

    isLoading = true;
    loadMoreButton.disabled = true;
    setStatus("Завантажуємо фотографії…");

    try {
        const existingIds = new Set(
            Array.from(gallery.children, (card) => card.dataset.imageId)
        );
        const newImages = [];

        while (newImages.length < IMAGES_PER_PAGE) {
            const response = await fetch(`${API_URL}?page=${page}&limit=${IMAGES_PER_PAGE}`);
            if (!response.ok) {
                throw new Error(`Помилка сервера: ${response.status}`);
            }

            const images = await response.json();
            page += 1;

            if (!Array.isArray(images)) {
                throw new Error("Сервер повернув некоректний список фотографій.");
            }

            const uniqueImages = images.filter((image) => {
                if (!image.id || existingIds.has(image.id)) {
                    return false;
                }

                existingIds.add(image.id);
                return true;
            });
            newImages.push(...uniqueImages);

            if (images.length < IMAGES_PER_PAGE && newImages.length < IMAGES_PER_PAGE) {
                break;
            }
        }

        if (newImages.length === 0) {
            setStatus("Нових фотографій більше немає.");
            return;
        }

        newImages.slice(0, IMAGES_PER_PAGE).forEach((image) => {
            gallery.append(createImageCard(image));
        });

        const addedCount = Math.min(newImages.length, IMAGES_PER_PAGE);
        setStatus(`Додано фотографій: ${addedCount}. У галереї: ${gallery.children.length}.`);
    } catch (error) {
        console.error("Не вдалося завантажити фотографії:", error);
        setStatus("Не вдалося завантажити фотографії. Перевірте з’єднання та спробуйте ще раз.", true);
    } finally {
        isLoading = false;
        loadMoreButton.disabled = false;
    }
}

loadMoreButton.addEventListener("click", loadImages);

clearButton.addEventListener("click", () => {
    gallery.replaceChildren();
    setStatus("Галерею очищено.");
});

removeLastButton.addEventListener("click", () => {
    const lastImage = gallery.lastElementChild;
    if (!lastImage) {
        setStatus("Галерея вже порожня.");
        return;
    }

    lastImage.remove();
    setStatus(`Останню фотографію видалено. У галереї: ${gallery.children.length}.`);
});

reverseButton.addEventListener("click", () => {
    Array.from(gallery.children)
        .reverse()
        .forEach((image) => gallery.append(image));
    setStatus("Порядок фотографій перевернуто.");
});

loadImages();
