
DOSSIER : intercepteurs (coeur)

Rôle :
Ce dossier contient les intercepteurs HTTP de l’application.
Ils permettent d’intercepter toutes les requêtes et réponses HTTP.

Utilisations principales :
- Ajouter automatiquement le token d’authentification aux requêtes
- Gérer les erreurs globales (401, 403, 500)
- Logger les requêtes HTTP

Règles :
- Les intercepteurs sont globaux
- Ils ne doivent pas contenir de logique spécifique à une fonctionnalité
- Ils doivent être déclarés dans le module coeur
