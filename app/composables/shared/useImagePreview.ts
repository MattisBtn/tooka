import type { MoodboardImage } from "~/types/moodboard";

export const useImagePreview = () => {
  const isOpen = ref(false);
  const currentImage = ref<MoodboardImage | null>(null);
  const images = ref<MoodboardImage[]>([]);
  const currentIndex = ref(0);

  const openPreview = (
    image: MoodboardImage,
    allImages: MoodboardImage[] = []
  ) => {
    currentImage.value = image;
    images.value = allImages;
    currentIndex.value = allImages.findIndex((img) => img.id === image.id);
    isOpen.value = true;
  };

  const closePreview = () => {
    isOpen.value = false;
    currentImage.value = null;
    images.value = [];
    currentIndex.value = 0;
  };

  const nextImage = () => {
    if (images.value.length > 1) {
      currentIndex.value = (currentIndex.value + 1) % images.value.length;
      const nextImg = images.value[currentIndex.value];
      if (nextImg) {
        currentImage.value = nextImg;
      }
    }
  };

  const previousImage = () => {
    if (images.value.length > 1) {
      currentIndex.value =
        currentIndex.value === 0
          ? images.value.length - 1
          : currentIndex.value - 1;
      const prevImg = images.value[currentIndex.value];
      if (prevImg) {
        currentImage.value = prevImg;
      }
    }
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < images.value.length) {
      currentIndex.value = index;
      const targetImg = images.value[index];
      if (targetImg) {
        currentImage.value = targetImg;
      }
    }
  };

  return {
    isOpen,
    currentImage,
    images,
    currentIndex,
    openPreview,
    closePreview,
    nextImage,
    previousImage,
    goToImage,
  };
};
