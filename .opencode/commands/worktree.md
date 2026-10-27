---
description: Crea un git worktree en .worktrees/<nombre>
agent: build
---

Crea un worktree para: "$ARGUMENTS"

Deriva el nombre del directorio a partir de ese texto: minúsculas, sin acentos,
espacios y separadores reemplazados por guiones, kebab-case, sin caracteres
especiales.

Ejecuta exactamente un comando, sin encadenar nada más:

git worktree add .worktrees/<nombre>

Reporta la ruta creada y nada más. No cambies de directorio, no edites archivos,
no hagas commits, no hagas ningún paso adicional.

Si "$ARGUMENTS" está vacío o no permite derivar un nombre, no ejecutes nada y
pide el nombre.

Si los argumentos es muy largos, simplificalos a un nombre significativo