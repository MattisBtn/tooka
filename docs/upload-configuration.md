# Configuration des limites d'upload d'images

Ce document explique comment configurer les limites d'upload d'images via des variables d'environnement.

## Variables d'environnement disponibles

### Moodboard (Images d'inspiration)

- `NUXT_MOODBOARD_MAX_FILES` (défaut: 50) - Nombre maximum d'images
- `NUXT_MOODBOARD_MAX_FILE_SIZE` (défaut: 10485760 = 10MB) - Taille maximale par fichier en bytes

### Selection (Images de sélection - supporte formats RAW)

- `NUXT_SELECTION_MAX_FILES` (défaut: 200) - Nombre maximum d'images
- `NUXT_SELECTION_MAX_FILE_SIZE` (défaut: 104857600 = 100MB) - Taille maximale par fichier en bytes

### Gallery (Images de galerie finale)

- `NUXT_GALLERY_MAX_FILES` (défaut: 200) - Nombre maximum d'images
- `NUXT_GALLERY_MAX_FILE_SIZE` (défaut: 104857600 = 100MB) - Taille maximale par fichier en bytes

### Formats acceptés

- `NUXT_ACCEPTED_IMAGE_FORMATS` (défaut: "image/jpeg, image/png, image/webp") - Formats d'images standard
- `NUXT_ACCEPTED_RAW_FORMATS` (défaut: ".nef,.dng,.raw,.cr2,.arw,.raf,.orf,.rw2,.crw,.pef,.srw,.x3f") - Formats RAW (sélection uniquement)

## Exemple de configuration

```bash
# Moodboard - Limites plus strictes pour les images d'inspiration
NUXT_MOODBOARD_MAX_FILES=30
NUXT_MOODBOARD_MAX_FILE_SIZE=5242880

# Selection - Support de gros fichiers RAW
NUXT_SELECTION_MAX_FILES=500
NUXT_SELECTION_MAX_FILE_SIZE=209715200

# Gallery - Limites standard pour la livraison finale
NUXT_GALLERY_MAX_FILES=300
NUXT_GALLERY_MAX_FILE_SIZE=52428800

# Formats personnalisés
NUXT_ACCEPTED_IMAGE_FORMATS=image/jpeg, image/png, image/webp, image/heic
NUXT_ACCEPTED_RAW_FORMATS=.nef,.dng,.raw,.cr2,.arw,.raf,.orf,.rw2,.crw,.pef,.srw,.x3f,.heic
```

## Architecture

La configuration est centralisée dans `app/utils/uploadConfig.ts` et utilisée par :

1. **useUploadRules** (`app/composables/shared/useUploadRules.ts`) - Fournit les règles par type
2. **Composants d'upload** - Utilisent la configuration appropriée
3. **Formulaires** - Passent les bonnes valeurs aux composants d'upload

## Avantages

- **Flexibilité** : Configuration via variables d'environnement
- **Centralisation** : Une seule source de vérité pour les limites
- **Maintenabilité** : Modification des limites sans toucher au code
- **Environnements** : Différentes limites selon l'environnement (dev, staging, prod)
