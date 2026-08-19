1. Prompt para el equipo de desarrollo (o para IA)
Copia y pega este prompt en tu herramienta de IA o en el ticket de desarrollo:

Contexto: Somos una app de gestión de mascotas que ya cuenta con un sistema de alertas. Necesitamos una mejora profunda: que las alertas sean inteligentes (basadas en el ciclo de vacunas y normativa chilena), que se muestren máximo 3 en la pantalla principal y que el usuario pueda eliminarlas.

Requisitos funcionales:

Límite en pantalla principal: Mostrar máximo 3 alertas activas. Si hay más de 3, priorizar por fecha de vencimiento (las más urgentes primero) y ofrecer un botón "Ver todas" que lleve a una lista completa.

Eliminación de alertas: Cada alerta debe tener un botón "Eliminar" o "Descartar". Al eliminarla, debe registrarse en el historial del usuario (no solo borrarse) para evitar que vuelva a aparecer por el mismo evento. Preguntar al usuario: "¿Estás seguro de que quieres eliminar esta alerta?".

Inteligencia en las alertas:

Las alertas deben generarse automáticamente basándose en:

Edad de la mascota (cachorro, adulto, senior).

Historial de vacunación (fecha de última dosis, tipo de vacuna).

Normativa chilena (Ley 21.020 de Tenencia Responsable y directrices del SAG).

El sistema debe calcular próximas fechas de vacunación y generar alertas con X días de anticipación (configurable, ej. 30, 15, 7 días).

Las alertas deben ser contextuales: no solo decir "Vacuna pendiente", sino "A [Nombre de la mascota] le falta la vacuna antirrábica, obligatoria por ley en Chile. Vence en X días".

Tipos de alertas iniciales:

Vacuna antirrábica (obligatoria por ley para perros y gatos desde los 2 meses, refuerzo anual).

Vacuna séxtuple/óctuple (esencial para perros, esquema de 3 dosis en cachorros y refuerzo anual).

Vacuna triple felina (esencial para gatos, esquema de 3 dosis en gatitos).

Desparasitación (interna y externa, recomendada periódicamente).

Microchip (exigido por la Ley 21.020).

Entregable: Diseño de UI/UX (mockups en Figma), especificación técnica de la lógica de alertas (backend), y plan de implementación en sprints.

2. Esquema de inteligencia para las alertas (Arquitectura lógica)
Para que las alertas sean realmente inteligentes, propongo este esquema:

A. Base de conocimiento (normativa chilena)
Tipo de evento	Perros	Gatos	Normativa en Chile
Vacuna antirrábica	1ª dosis: 2 meses
Refuerzo: anual	1ª dosis: 2 meses
Refuerzo: anual	Obligatoria por ley (Ley 21.020)
Vacuna polivalente	Séxtuple/Óctuple: 3 dosis: 6-8, 9-11, 12-14 semanas. Refuerzo: anual	Triple felina: 3 dosis: 8-9, 12-13, 16 semanas. Refuerzo: cada 1-3 años	Esencial (recomendada por Colegio Médico Veterinario)
Microchip	Obligatorio	Obligatorio	Exigido por Ley 21.020
Desparasitación	Periódica (según veterinario)	Periódica (según veterinario)	Recomendada en programas sanitarios
B. Motor de cálculo de fechas
Inputs: Fecha de nacimiento, fecha de última vacuna/desparasitación, tipo de vacuna.

Lógica:

Calcular edad en semanas/meses.
Si es cachorro/gatito (< 1 año): programar alertas para las dosis del esquema inicial (ej. a las 8, 12, 16 semanas).
Si es adulto (> 1 año): programar alerta de refuerzo anual (antirrábica + polivalente) basada en la fecha de la última dosis.
Regla especial (Chile): La vacuna antirrábica es obligatoria anualmente. El sistema debe generar una alerta si han pasado más de 11 meses desde la última dosis.