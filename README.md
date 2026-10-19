# promts generator rtve

Prepara prompts de ilustración editorial para copiar y pegar en un chat nuevo de ChatGPT.
Funciona en el navegador, sin claves, llamadas a una API ni generación de imágenes integrada.

## Uso

1. Escribe un titular y añade el contexto de la noticia si lo necesitas.
2. Elige entre surrealismo pictórico, poesía visual, minimalismo conceptual o infografía de pictogramas.
3. Selecciona uno de los cinco formatos y pulsa **Generar prompt**.
4. Edita el texto, pulsa **Copiar prompt** y pégalo en un chat nuevo de ChatGPT.
5. Genera y ajusta la imagen en ese chat, según las funciones y límites de tu cuenta.

Las cuatro tarjetas abren su editor de referencias dentro de Dirección de arte. Puedes añadir, reemplazar o eliminar imágenes para un ejercicio y recuperar siempre las referencias de estilo originales. La miniatura muestra la primera referencia activa.
Cada imagen tiene una fidelidad de 0 a 100 (Suave, Media, Extrema) y notas. Activa «Añadir referencia sujeto» para aportar personas, edificios o lugares y definir la precisión con la que deben conservarse. Esta selección es independiente para cada estilo.
Pulsa «Descargar todas las referencias» al final del bloque 02 para obtener un ZIP con las referencias del estilo seleccionado y las de sujeto activadas. Descomprime el ZIP y adjunta las imágenes al chat con los nombres indicados en el prompt. También puedes descargar cada imagen mediante su enlace. Copiar texto no transfiere imágenes. Si eliminas todas las referencias, se utiliza solo la guía escrita del estilo.
Selecciona entre 1 y 10 propuestas. «Limpiar texto» vacía únicamente el prompt; la noticia y las referencias siguen disponibles.
**Abrir ChatGPT** abre la web, pero no envía ni pega tu texto automáticamente.

Si cambias la noticia, el estilo o el formato, el prompt automático se actualiza.
Si habías editado el prompt, conserva tu texto y te pide regenerarlo antes de copiarlo.
El contexto no se recorta ni tiene un límite impuesto por esta herramienta; el chat de destino puede imponer límites propios.

## Abrir y alojar

Web: https://PabloBacigalupe.github.io/promts-generator-rtve/

Abre `index.html` directamente o publica con GitHub Pages. El repositorio utiliza GitHub Actions para desplegar los archivos de la raíz al actualizar `main`.
No requiere Python, claves ni paquetes. Si el navegador no permite copiar automáticamente, se selecciona el texto para usar Ctrl+C o ⌘C.
Las siete referencias originales están incorporadas en `assets.js` y siempre pueden restaurarse. Las imágenes añadidas para ejercicios no se suben al repositorio ni al servidor: permanecen en memoria del navegador.

## Datos

El texto y las imágenes cargadas se preparan en memoria del navegador. No se transmite automáticamente, no se guardan de forma persistente y se pierden al recargar o cerrar. Las referencias originales vienen incluidas y no se modifican. Copia o descarga el prompt para conservarlo.
No hay conexión con OpenAI, no se solicitan claves y no se almacenan credenciales.
Las imágenes de referencia se cargan desde el propio sitio. Sus derechos pertenecen a sus respectivos autores.

## Comprobaciones

```sh
node --test test_frontend.cjs
```

Las pruebas no hacen peticiones a servicios de IA.
